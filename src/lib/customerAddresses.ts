import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient, extractErrorMessage } from './api';

export type DeliveryPoint = {lat: number; lng: number; landmark?: string};
export type SavedAddress = {id: number; label: string; address: string; landmark: string; latitude: string | null; longitude: string | null; is_default: boolean};
export const addressPoint = (row: SavedAddress): DeliveryPoint | undefined => row.latitude !== null && row.longitude !== null
  ? {lat: Number(row.latitude), lng: Number(row.longitude), landmark: row.landmark} : undefined;
export function useCustomerAddresses() {
  const {authUser} = useAuth();
  const user = authUser?.role === 'CUSTOMER' ? authUser.id : null;
  const [state, setState] = useState<{user: unknown; rows: SavedAddress[]}>({user: null, rows: []});
  const [error, setError] = useState('');
  const [revision, refresh] = useState(0);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    apiClient.get<SavedAddress[]>('/customer/addresses/', {signal: controller.signal})
      .then(rows => {setState({user, rows});setError('');}).catch(e => {if (!controller.signal.aborted) setError(extractErrorMessage(e));});
    return () => controller.abort();
  }, [user, revision]);
  useEffect(() => {
    const changed = () => refresh(v => v + 1);
    window.addEventListener('customer:addresses', changed);
    return () => window.removeEventListener('customer:addresses', changed);
  }, []);
  const change = async (work: () => Promise<any>) => {
    try { const result = await work();setError('');window.dispatchEvent(new Event('customer:addresses'));return result; }
    catch(e) {setError(extractErrorMessage(e));throw e;}
  };
  return {addresses: state.user === user ? state.rows : [], loading: !!user && state.user !== user, error,
    save: (values: Partial<SavedAddress>, id?: number) => change(() => id ? apiClient.patch<SavedAddress>(`/customer/addresses/${id}/`, values) : apiClient.post<SavedAddress>('/customer/addresses/', values)),
    remove: (id: number) => change(() => apiClient.delete(`/customer/addresses/${id}/`))};
}
