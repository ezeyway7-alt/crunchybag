import { useCallback, useEffect, useRef, useState } from 'react';
import { Category, Product, TimePricingSchedule } from '../types';
import { apiClient, extractErrorMessage, normalizeOutletId } from '../lib/api';
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
  const reloadRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const isAdminRoute = typeof window !== 'undefined' && (/^\/(admin|superadmin|brand|outlet|dashboard)/i.test(window.location.pathname) || window.location.pathname.startsWith('/admin'));
  const isManagementPortal = portal === 'admin' || isAdminRoute;
  const management = isManagementPortal && !!authStorage.getAccessToken();
  const channel = portal === 'kiosk' ? 'kiosk' : portal === 'staff' || portal === 'admin' || isManagementPortal ? 'pos' : tableMode ? 'qr' : 'web';
  
  // Normalize outlet ID: extracts numeric ID or defaults to "1"
  const effectiveOutletId = normalizeOutletId(outletId);
  const activeScope = useRef(effectiveOutletId); activeScope.current = effectiveOutletId;
  const validOutlet = /^\d+$/.test(effectiveOutletId);

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
      const data = await apiClient.get<any>(catalogPath(management ? 'management/' : `menu/`, effectiveOutletId) + (management ? '' : `&channel=${channel}`), { skipAuth: !management && channel !== 'pos' });
      if (seq !== sequence.current) return;
      const nextProducts = (management ? data.products : data.categories.flatMap((c: any) => c.products)).map(fromProduct);
      if (management) for (const product of nextProducts) {
        const override = data.overrides?.[product.id];
        if (override) product.isAvailable = product.isAvailable && override.is_available;
      }
      const nextCategories = (data.categories || []).map(fromCategory);
      setCategories(prev => {
        const fetchedIds = new Set(nextCategories.map(c => String(c.id)));
        const pending = prev.filter(c => !c.isArchived && !fetchedIds.has(String(c.id)));
        return [...nextCategories, ...pending];
      });
      setProducts(nextProducts);
      setTimePricingSchedules(management ? (data.schedules || []).map((s: any) => fromSchedule(s, effectiveOutletId, nextProducts)) : []);
      setError('');
      clearTimeout(deadline.current);
      if (!management && typeof data?.valid_until === 'number' && Number.isFinite(data.valid_until)) {
        const delay = Math.max(1000, data.valid_until * 1000 - Date.now() + 150);
        deadline.current = setTimeout(() => { void reloadRef.current(); }, delay);
      }
    } catch (error) {
      if (seq !== sequence.current) return;
      setError(extractErrorMessage(error));
      // Retry reads with a bounded delay, including cold-cache 503s; never retry writes blindly.
      clearTimeout(deadline.current);
      deadline.current = setTimeout(() => { void reloadRef.current(); }, 5000);
    } finally { if (seq === sequence.current) setLoading(false); }
  }, [effectiveOutletId, management, channel, validOutlet, authVersion]);

  reloadRef.current = reload;

  // Real-time WebSocket connection scoped strictly to outlet ID
  useEffect(() => {
    setCategories([]); setProducts([]); setTimePricingSchedules([]);
    let closed = false, attempts = 0;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout>;
    const connect = () => {
      if (closed || !validOutlet) return;
      socket = new WebSocket(menuSocket(effectiveOutletId));
      socket.onopen = () => {
        const wasReconnect = attempts > 0;
        attempts = 0;
        if (wasReconnect) void reloadRef.current();
      };
      socket.onmessage = event => {
        try { if (JSON.parse(event.data).event === 'MENU_UPDATED') void reloadRef.current(); } catch { /* Ignore non-domain frames. */ }
      };
      socket.onclose = () => { if (!closed) retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempts++) + Math.random() * 500); };
      socket.onerror = () => socket?.close();
    };
    connect();
    const foreground = () => { if (!document.hidden) void reloadRef.current(); };
    document.addEventListener('visibilitychange', foreground);
    window.addEventListener('online', foreground);
    return () => {
      closed = true;
      ++sequence.current;
      clearTimeout(retry);
      clearTimeout(deadline.current);
      socket?.close();
      document.removeEventListener('visibilitychange', foreground);
      window.removeEventListener('online', foreground);
    };
  }, [effectiveOutletId, validOutlet]);

  // Fetch catalog whenever scope, channel, or auth version updates
  useEffect(() => {
    void reload();
  }, [reload]);

  const mutate = async <T,>(operation: () => Promise<T>): Promise<T> => {
    if (!validOutlet) throw new Error('Choose a configured outlet before saving.');
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
    if (!trimmed) throw new Error('Category name cannot be empty.');
    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    const row = await mutate(async () => existing
      ? apiClient.patch(catalogPath(`categories/${existing.id}/`, effectiveOutletId), { is_archived: false })
      : apiClient.post(catalogPath('categories/', effectiveOutletId), { name: trimmed }));
    
    const created = fromCategory(row);
    if (!created.id && existing) created.id = String(existing.id);
    if (!created.id) created.id = `cat-${Date.now()}`;
    if (!created.name) created.name = trimmed;

    setCategories(prev => {
      const exists = prev.some(c => String(c.id) === String(created.id) || c.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        return prev.map(c => (String(c.id) === String(created.id) || c.name.toLowerCase() === trimmed.toLowerCase())
          ? { ...c, ...created, isArchived: false }
          : c
        );
      }
      return [...prev, created];
    });

    return created;
  };
  const setCategoryArchived = (id: string, archived: boolean) => {
    setCategories(prev => prev.map(c => String(c.id) === String(id) ? { ...c, isArchived: archived } : c));
    quiet(() => apiClient.patch(catalogPath(`categories/${id}/`, effectiveOutletId), { is_archived: archived }));
  };
  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => String(c.id) !== String(id)));
    return await mutate(async () => {
      try {
        return await apiClient.delete(catalogPath(`categories/${id}/`, effectiveOutletId));
      } catch (err: any) {
        try {
          return await apiClient.patch(catalogPath(`categories/${id}/`, effectiveOutletId), { is_archived: true });
        } catch {
          throw err;
        }
      }
    });
  };
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
  return { categories, products, setProducts, timePricingSchedules, catalogLoading, catalogError, createCategory, setCategoryArchived, deleteCategory,
    createProduct, updateProductFull, deleteProduct, toggleProductAvailability, saveTimePricing, deleteTimePricing, toggleTimePricing };
}
