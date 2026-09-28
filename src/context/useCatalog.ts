import { useCallback, useEffect, useRef, useState } from 'react';
import { Category, Product, TimePricingSchedule } from '../types';
import { apiClient, extractErrorMessage } from '../lib/api';
import { authStorage } from '../lib/authStorage';
import { catalogPath, fromCategory, fromProduct, fromSchedule, productPayload, schedulePayload, menuSocket } from '../lib/catalogApi';

export function useCatalog(outletId: string, portal: string, tableMode: boolean, notify: (toast: any) => void) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [timePricingSchedules, setTimePricingSchedules] = useState<TimePricingSchedule[]>([]);
  const [catalogLoading, setLoading] = useState(false);
  const [catalogError, setError] = useState('');
  const [authVersion, setAuthVersion] = useState(0);
  const sequence = useRef(0);
  const notifyRef = useRef(notify); notifyRef.current = notify;
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const management = portal === 'admin' && !!authStorage.getAccessToken();
  const channel = portal === 'kiosk' ? 'kiosk' : portal === 'staff' || portal === 'admin' ? 'pos' : tableMode ? 'qr' : 'web';
  const effectiveOutletId = /^\d+$/.test(String(outletId)) ? String(outletId) : "1";
  const activeScope = useRef(effectiveOutletId); activeScope.current = effectiveOutletId;
  const validOutlet = true;

  useEffect(() => {
    const changed = () => setAuthVersion(v => v + 1);
    window.addEventListener('crunchy:auth_change', changed);
    return () => window.removeEventListener('crunchy:auth_change', changed);
  }, []);

  const reload = useCallback(async () => {
    const seq = ++sequence.current;
    setLoading(true);
    try {
      const data = await apiClient.get<any>(catalogPath(management ? 'management/' : `menu/`, effectiveOutletId) + (management ? '' : `&channel=${channel}`), { skipAuth: !management && channel !== 'pos' });
      if (seq !== sequence.current) return;
      const rawCats = data?.categories || data?.data?.categories || [];
      const rawProducts = (management ? (data?.products || data?.data?.products || []) : rawCats.flatMap((c: any) => c.products || [])) || [];
      const nextProducts = rawProducts.map(fromProduct);
      if (management) {
        const overrides = data?.overrides || data?.data?.overrides;
        if (overrides) {
          for (const product of nextProducts) {
            const override = overrides[product.id];
            if (override) product.isAvailable = product.isAvailable && override.is_available;
          }
        }
      }
      setCategories(rawCats.map(fromCategory));
      setProducts(nextProducts);
      const rawSchedules = data?.schedules || data?.data?.schedules || [];
      setTimePricingSchedules(management ? rawSchedules.map((s: any) => fromSchedule(s, effectiveOutletId, nextProducts)) : []);
      setError('');
      clearTimeout(deadline.current);
      if (!management) deadline.current = setTimeout(() => { void reload(); }, Math.max(1000, data.valid_until * 1000 - Date.now() + 150));
    } catch (error) {
      if (seq !== sequence.current) return;
      setError(extractErrorMessage(error));
      clearTimeout(deadline.current);
      deadline.current = setTimeout(() => { void reload(); }, 5000);
    } finally { if (seq === sequence.current) setLoading(false); }
  }, [effectiveOutletId, management, channel, authVersion]);

  useEffect(() => {
    setCategories([]); setProducts([]); setTimePricingSchedules([]);
    void reload();
    let closed = false, attempts = 0;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout>;
    const connect = () => {
      if (closed) return;
      socket = new WebSocket(menuSocket(effectiveOutletId));
      socket.onopen = () => { attempts = 0; void reload(); };
      socket.onmessage = event => {
        try { if (JSON.parse(event.data).event === 'MENU_UPDATED') void reload(); } catch { /* Ignore non-domain frames. */ }
      };
      socket.onclose = () => { if (!closed) retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempts++) + Math.random() * 500); };
      socket.onerror = () => socket?.close();
    };
    connect();
    const foreground = () => { if (!document.hidden) void reload(); };
    document.addEventListener('visibilitychange', foreground);
    window.addEventListener('online', foreground);
    return () => { closed = true; ++sequence.current; clearTimeout(retry); clearTimeout(deadline.current); socket?.close(); document.removeEventListener('visibilitychange', foreground); window.removeEventListener('online', foreground); };
  }, [reload, effectiveOutletId]);

  const mutate = async <T,>(operation: () => Promise<T>): Promise<T> => {
    try {
      const result = await operation();
      if (activeScope.current === effectiveOutletId) await reload();
      return result;
    } catch (error) {
      notifyRef.current({ title: 'Menu change could not be saved', description: extractErrorMessage(error), type: 'error' });
      throw error;
    }
  };
  const quiet = (operation: () => Promise<unknown>) => { void mutate(operation).catch(() => {}); };
  const createCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Category name cannot be empty");
    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    const row = await mutate(() => existing
      ? apiClient.patch(catalogPath(`categories/${existing.id}/`, effectiveOutletId), { is_archived: false })
      : apiClient.post(catalogPath('categories/', effectiveOutletId), { name: trimmed }));
    const created = fromCategory(row);
    if (!created.id && existing) {
      created.id = String(existing.id);
      created.name = existing.name;
    }
    setCategories(prev => {
      const idx = prev.findIndex(c => String(c.id) === String(created.id) || c.name.toLowerCase() === created.name.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...created, isArchived: false };
        return next;
      }
      return [...prev, created];
    });
    return created;
  };
  const setCategoryArchived = (id: string, archived: boolean) => quiet(() => apiClient.patch(catalogPath(`categories/${id}/`, effectiveOutletId), { is_archived: archived }));
  const createProduct = async (product: Omit<Product, 'id'>) => fromProduct(await mutate(async () => apiClient.post(catalogPath('products/', effectiveOutletId), await productPayload(product, effectiveOutletId))));
  const updateProductFull = async (id: string, product: Partial<Product>) => { await mutate(async () => apiClient.patch(catalogPath(`products/${id}/`, effectiveOutletId), await productPayload(product, effectiveOutletId))); };
  const deleteProduct = (id: string) => quiet(() => apiClient.delete(catalogPath(`products/${id}/`, effectiveOutletId)));
  const toggleProductAvailability = (id: string) => quiet(() => apiClient.post(catalogPath(`outlets/me/products/${id}/toggle-stock/`, effectiveOutletId), { is_available: !products.find(p => p.id === id)?.isAvailable }));
  const saveTimePricing = async (schedule: TimePricingSchedule) => {
    await mutate(() => timePricingSchedules.some(s => s.id === schedule.id)
      ? apiClient.patch(catalogPath(`schedules/${schedule.id}/`, effectiveOutletId), schedulePayload(schedule))
      : apiClient.post(catalogPath('schedules/', effectiveOutletId), schedulePayload(schedule)));
  };
  const deleteTimePricing = (id: string) => quiet(() => apiClient.delete(catalogPath(`schedules/${id}/`, effectiveOutletId)));
  const toggleTimePricing = (id: string) => quiet(() => apiClient.patch(catalogPath(`schedules/${id}/`, effectiveOutletId), { is_active: !timePricingSchedules.find(s => s.id === id)?.isActive }));
  return { categories, products, setProducts, timePricingSchedules, catalogLoading, catalogError, createCategory, setCategoryArchived,
    createProduct, updateProductFull, deleteProduct, toggleProductAvailability, saveTimePricing, deleteTimePricing, toggleTimePricing };
}
