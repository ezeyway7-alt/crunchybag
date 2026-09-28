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
  const activeScope = useRef(outletId); activeScope.current = outletId;
  const validOutlet = /^\d+$/.test(outletId);

  useEffect(() => {
    const changed = () => setAuthVersion(v => v + 1);
    window.addEventListener('crunchy:auth_change', changed);
    return () => window.removeEventListener('crunchy:auth_change', changed);
  }, []);

  const reload = useCallback(async () => {
    if (!validOutlet) { setError('Choose an outlet to load its menu.'); return; }
    const seq = ++sequence.current;
    setLoading(true);
    try {
      const data = await apiClient.get<any>(catalogPath(management ? 'management/' : `menu/`, outletId) + (management ? '' : `&channel=${channel}`), { skipAuth: !management && channel !== 'pos' });
      if (seq !== sequence.current) return;
      const nextProducts = (management ? data.products : data.categories.flatMap((c: any) => c.products)).map(fromProduct);
      if (management) for (const product of nextProducts) {
        const override = data.overrides?.[product.id];
        if (override) product.isAvailable = product.isAvailable && override.is_available;
      }
      setCategories(data.categories.map(fromCategory)); setProducts(nextProducts);
      setTimePricingSchedules(management ? data.schedules.map((s: any) => fromSchedule(s, outletId, nextProducts)) : []);
      setError('');
      clearTimeout(deadline.current);
      if (!management) deadline.current = setTimeout(() => { void reload(); }, Math.max(1000, data.valid_until * 1000 - Date.now() + 150));
    } catch (error) {
      if (seq !== sequence.current) return;
      setError(extractErrorMessage(error));
      // Retry reads with a bounded delay, including cold-cache 503s; never retry writes blindly.
      clearTimeout(deadline.current);
      deadline.current = setTimeout(() => { void reload(); }, 5000);
    } finally { if (seq === sequence.current) setLoading(false); }
  }, [outletId, management, channel, validOutlet, authVersion]);

  useEffect(() => {
    setCategories([]); setProducts([]); setTimePricingSchedules([]);
    void reload();
    let closed = false, attempts = 0;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout>;
    const connect = () => {
      if (closed || !validOutlet) return;
      socket = new WebSocket(menuSocket(outletId));
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
  }, [reload, outletId, validOutlet]);

  const mutate = async <T,>(operation: () => Promise<T>): Promise<T> => {
    if (!validOutlet) throw new Error('Choose a configured outlet before saving.');
    try {
      const result = await operation();
      if (activeScope.current === outletId) await reload();
      return result;
    } catch (error) {
      notifyRef.current({ title: 'Menu change could not be saved', description: extractErrorMessage(error), type: 'error' });
      throw error;
    }
  };
  const quiet = (operation: () => Promise<unknown>) => { void mutate(operation).catch(() => {}); };
  const createCategory = async (name: string) => {
    const existing = categories.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
    const row = await mutate(() => existing
      ? apiClient.patch(catalogPath(`categories/${existing.id}/`, outletId), { is_archived: false })
      : apiClient.post(catalogPath('categories/', outletId), { name: name.trim() }));
    return fromCategory(row);
  };
  const setCategoryArchived = (id: string, archived: boolean) => quiet(() => apiClient.patch(catalogPath(`categories/${id}/`, outletId), { is_archived: archived }));
  const createProduct = async (product: Omit<Product, 'id'>) => fromProduct(await mutate(async () => apiClient.post(catalogPath('products/', outletId), await productPayload(product, outletId))));
  const updateProductFull = async (id: string, product: Partial<Product>) => { await mutate(async () => apiClient.patch(catalogPath(`products/${id}/`, outletId), await productPayload(product, outletId))); };
  const deleteProduct = (id: string) => quiet(() => apiClient.delete(catalogPath(`products/${id}/`, outletId)));
  const toggleProductAvailability = (id: string) => quiet(() => apiClient.post(catalogPath(`outlets/me/products/${id}/toggle-stock/`, outletId), { is_available: !products.find(p => p.id === id)?.isAvailable }));
  const saveTimePricing = async (schedule: TimePricingSchedule) => {
    await mutate(() => timePricingSchedules.some(s => s.id === schedule.id)
      ? apiClient.patch(catalogPath(`schedules/${schedule.id}/`, outletId), schedulePayload(schedule))
      : apiClient.post(catalogPath('schedules/', outletId), schedulePayload(schedule)));
  };
  const deleteTimePricing = (id: string) => quiet(() => apiClient.delete(catalogPath(`schedules/${id}/`, outletId)));
  const toggleTimePricing = (id: string) => quiet(() => apiClient.patch(catalogPath(`schedules/${id}/`, outletId), { is_active: !timePricingSchedules.find(s => s.id === id)?.isActive }));
  return { categories, products, setProducts, timePricingSchedules, catalogLoading, catalogError, createCategory, setCategoryArchived,
    createProduct, updateProductFull, deleteProduct, toggleProductAvailability, saveTimePricing, deleteTimePricing, toggleTimePricing };
}
