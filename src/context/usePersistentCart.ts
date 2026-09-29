import { useCallback, useEffect, useRef, useState } from 'react';
import type { SetStateAction } from 'react';
import { useAuth } from './AuthContext';
import { apiClient, ApiError, extractErrorMessage, normalizeOutletId } from '../lib/api';
import { CartLineItem } from '../types';

type StoredCart = { items: CartLineItem[]; base: CartLineItem[]; mergeId: string };
const empty = (): StoredCart => ({items: [], base: [], mergeId: crypto.randomUUID()});
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const storageKey = (scope: string) => `crunchy-cart-v1:${scope}`;
function read(scope: string): StoredCart {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(scope)) || 'null');
    if (value && Array.isArray(value.items) && Array.isArray(value.base) && typeof value.mergeId === 'string') {
      const valid = (item: any) => item && typeof item.cartItemId === 'string' && typeof item.productId === 'string'
        && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 100
        && item.variant && Number.isFinite(item.unitPrice) && Number.isFinite(item.lineTotal) && Array.isArray(item.selectedModifiers);
      return {...value, items: value.items.filter(valid), base: value.base.filter(valid)};
    }
  } catch { /* Corrupt local data must not prevent the menu from opening. */ }
  return empty();
}
// Apply only this device's edits to the latest server cart, preserving other devices' additions.
function rebase(remote: CartLineItem[], base: CartLineItem[], local: CartLineItem[]) {
  const before = new Map(base.map(row => [row.cartItemId, row]));
  const after = new Map(local.map(row => [row.cartItemId, row]));
  const result = new Map(remote.map(row => [row.cartItemId, row]));
  for (const id of before.keys()) if (!after.has(id)) result.delete(id);
  for (const row of local) if (!same(row, before.get(row.cartItemId))) result.set(row.cartItemId, row);
  return [...result.values()];
}

export function usePersistentCart(outletId: string) {
  const {authUser, isLoading} = useAuth();
  const outlet = normalizeOutletId(outletId);
  const user = authUser?.role === 'CUSTOMER' ? String(authUser.id) : 'guest';
  const scope = `${user}:${outlet}`;
  const [, redraw] = useState(0);
  const [status, setStatus] = useState({scope, busy: user !== 'guest', error: ''});
  const current = useRef<{scope: string; value: StoredCart} | null>(null);
  if (!current.current || current.current.scope !== scope) current.current = {scope, value: read(scope)};
  const syncRef = useRef<() => Promise<void>>(async () => {});
  const persist = (target: string, value: StoredCart) => {
    try { localStorage.setItem(storageKey(target), JSON.stringify(value)); }
    catch { setStatus({scope: target, busy: false, error: 'Cart storage is unavailable. Keep this tab open until checkout.'}); }
  };
  const setItems = useCallback((update: SetStateAction<CartLineItem[]>) => {
    if (current.current.scope !== scope) return;
    const record = current.current.value;
    const items = typeof update === 'function' ? update(record.items) : update;
    if (items.length > 100 || items.some(item => item.quantity > 100)) {
      setStatus({scope, busy: false, error: 'Your cart allows up to 100 lines and 100 of each item.'});
      return;
    }
    current.current.value = {...record, items, ...(user === 'guest' ? {mergeId: crypto.randomUUID()} : {})};
    persist(scope, current.current.value);
    redraw(v => v + 1);
    // Persist locally synchronously; server writes are serialized by the sync worker.
    void syncRef.current();
  }, [scope, user]);

  useEffect(() => {
    if (user === 'guest' || isLoading) {
      syncRef.current = async () => {};
      setStatus({scope, busy: false, error: ''});
      return;
    }
    let stopped = false, running: Promise<void> | undefined, requested = false;
    const controller = new AbortController();
    const path = `/customer/cart/?outlet_id=${outlet}`;
    const options = {signal: controller.signal};
    const sync = (): Promise<void> => {
      requested = true;
      if (running) return running;
      running = (async () => {
        setStatus({scope, busy: true, error: ''});
        try {
          while (requested && !stopped) {
            requested = false;
            let remote = await apiClient.get<{items: CartLineItem[]; version: number}>(path, options);
            if (stopped) return;
            const guestScope = `guest:${outlet}`;
            const guest = read(guestScope);
            if (guest.items.length) {
              remote = await apiClient.post(path, {items: guest.items, merge_id: guest.mergeId}, options);
              if (stopped) return;
              // Delete only the exact guest snapshot acknowledged by the server.
              if (read(guestScope).mergeId === guest.mergeId) localStorage.removeItem(storageKey(guestScope));
            }
            for (let attempt = 0; attempt < 4; attempt++) {
              if (stopped) return;
              const local = current.current.value;
              const items = rebase(remote.items, local.base, local.items);
              current.current.value = {...local, items, base: remote.items};
              persist(scope, current.current.value);
              redraw(v => v + 1);
              if (same(items, remote.items)) break;
              try {
                const saved = await apiClient.put<{items: CartLineItem[]; version: number}>(path, {items, version: remote.version}, options);
                if (stopped) return;
                // Keep edits made while the request was in flight.
                current.current.value = {...current.current.value, items: rebase(saved.items, items, current.current.value.items), base: saved.items};
                persist(scope, current.current.value);
                redraw(v => v + 1);
                break;
              } catch (e) {
                if (!(e instanceof ApiError) || e.status !== 409 || attempt === 3) throw e;
                remote = await apiClient.get(path, options);
              }
            }
          }
          if (!stopped) setStatus({scope, busy: false, error: ''});
        } catch (e) {
          if (!stopped) setStatus({scope, busy: false, error: `Cart is saved on this device. ${extractErrorMessage(e)}`});
        } finally { running = undefined; }
      })();
      return running;
    };
    syncRef.current = sync;
    const retry = () => { void sync(); };
    window.addEventListener('online', retry);
    void sync();
    return () => {stopped = true; controller.abort(); window.removeEventListener('online', retry); syncRef.current = async () => {};};
  }, [scope, user, outlet, isLoading]);
  const consumePurchased = (ids: string[]) => {
    if (current.current.scope !== scope) return;
    const purchased = new Set(ids);
    const record = current.current.value;
    // The server already consumed these lines transactionally. Do not send a second
    // deletion that could remove quantities another device added during checkout.
    current.current.value = {...record, items: record.items.filter(row=>!purchased.has(row.cartItemId)), base: record.base.filter(row=>!purchased.has(row.cartItemId))};
    persist(scope, current.current.value);redraw(v=>v+1);void syncRef.current();
  };
  return {items: current.current.value.items, setItems,
    consumePurchased,
    syncing: (user !== 'guest' && isLoading) || (status.scope !== scope ? user !== 'guest' : status.busy),
    error: status.scope === scope ? status.error : '', retry: () => syncRef.current()};
}
