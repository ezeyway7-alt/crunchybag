import { useEffect, useState } from "react";
import { apiClient, DEFAULT_API_BASE, extractErrorMessage } from "./api";
import { authStorage } from "./authStorage";
import { useAuth } from "../context/AuthContext";
import { posOrderToOrder } from "./posApi";
import { CartLineItem, Order } from "../types";

export const customerPath = (path: string) => `/customer/${path}`;
export const customerRefresh = () => window.dispatchEvent(new Event('customer:refresh'));
export const cartLines = (items: CartLineItem[]) => items.map(item => ({product_id: item.productId, quantity: item.quantity,
  variant_id: item.comboSelections ? null : item.variant.id || null,
  modifier_option_ids: item.comboSelections ? [] : item.selectedModifiers.map(m => m.optionId),
  ...(item.comboSelections ? {combo_selections: item.comboSelections} : {})}));
export function saveCustomerSession(result: any) {
  authStorage.setSession({...result, outlet: authStorage.getOutlet()});
  customerRefresh();
}
export function customerOrder(row: any): Order {
  const mapped = posOrderToOrder(row, row.outlet_name);
  return {...mapped, id: String(row.id), status: row.status === 'PENDING' ? 'AWAITING_PAYMENT' : mapped.status,
    orderSource: 'WEBSITE', paymentMethod: 'FONEPAY_QR', _customerOrder: row } as Order;
}
const emptyProfile = {name:'',phone:'',email:'',address:'',points:0,tier:'',memberSince:''};
export function useCustomerAccount() {
  const {authUser, isLoading} = useAuth();
  const enabled = !isLoading && !!authUser && authUser.is_active !== false;
  const scope = enabled ? String(authUser.id) : 'guest';
  const [state,setState] = useState<{scope:string; orders:Order[]; favorites:string[]; profile:typeof emptyProfile}>({scope:'',orders:[],favorites:[],profile:emptyProfile});
  const [error,setError] = useState('');
  const [revision,setRevision] = useState(0);
  const [guestFavorites,setGuestFavorites] = useState<string[]>(() => {try {return JSON.parse(localStorage.getItem('crunchy_favorites') || '[]');} catch {return [];}});
  useEffect(() => {const refresh = () => setRevision(v=>v+1); window.addEventListener('customer:refresh',refresh); return () => window.removeEventListener('customer:refresh',refresh);},[]);
  useEffect(() => {
    if (!enabled) return;
    let live = true; const controller = new AbortController();
    Promise.all([apiClient.get<any>(customerPath('profile/'),{signal:controller.signal}),apiClient.get<any>(customerPath('orders/'),{signal:controller.signal})])
      .then(([profile,orders]) => {
        if(live){
          setError('');
          setState({
            scope,
            orders:(orders?.results || []).map(customerOrder),
            favorites:(profile?.favorites || []).map(String),
            profile:{
              ...emptyProfile,
              ...(profile || {}),
              name: profile?.name || '',
              phone: profile?.phone || '',
              email: profile?.email || '',
              address: profile?.address || '',
              points: typeof profile?.points === 'number' ? profile.points : 0,
              tier: profile?.tier || '',
              memberSince: profile?.member_since ? new Date(profile.member_since).toLocaleDateString() : ''
            }
          });
        }
      })
      .catch(e=>{if(live)setError(extractErrorMessage(e));});
    return () => {live=false;controller.abort();};
  },[enabled,scope,revision]);
  useEffect(() => {
    if (!enabled) return;
    let stopped=false, socket:WebSocket, retry:any, debounce:any, attempts=0, version:string|undefined, opened=0, heard=Date.now();
    const controller = new AbortController();
    const refresh=()=>{clearTimeout(debounce);debounce=setTimeout(customerRefresh,200);};
    const reconnect=()=>{if(!stopped)retry=setTimeout(connect,Math.min(60000,2000*2**Math.min(attempts++,5)));};
    const connect=async()=>{try{
      const ticket=await apiClient.post<any>(customerPath('socket-ticket/'),{}, {signal:controller.signal}); if(stopped)return;
      const url=new URL((import.meta as any).env.VITE_POS_WS_ORIGIN || DEFAULT_API_BASE,window.location.origin);url.protocol=['https:','wss:'].includes(url.protocol)?'wss:':'ws:';url.pathname=ticket.path;url.search=new URLSearchParams({ticket:ticket.ticket}).toString();
      socket=new WebSocket(url);
      socket.onopen=()=>{opened=heard=Date.now();refresh();socket.send(JSON.stringify({type:'ping'}));};
      socket.onmessage=e=>{try{const message=JSON.parse(e.data);heard=Date.now();if(heard-opened>30000)attempts=0;
        if(message.type==='orders_changed')refresh();
        if(message.type==='heartbeat'){if(version!==undefined&&version!==message.revision)refresh();version=message.revision;}
      }catch{socket.close();}};
      socket.onerror=()=>socket.close();socket.onclose=e=>{if(e.code!==4403)reconnect();};
    }catch(error){if(!stopped){setError(extractErrorMessage(error));reconnect();}}};
    void connect();
    const ping=()=>{if(socket?.readyState===WebSocket.OPEN){if(Date.now()-heard>65000)socket.close();else socket.send(JSON.stringify({type:'ping'}));}};
    const timer=setInterval(ping,30000);window.addEventListener('online',ping);document.addEventListener('visibilitychange',ping);
    return()=>{stopped=true;controller.abort();clearTimeout(retry);clearTimeout(debounce);clearInterval(timer);socket?.close();window.removeEventListener('online',ping);document.removeEventListener('visibilitychange',ping);};
  },[enabled,scope]);
  const favorites = enabled ? state.scope===scope?state.favorites:[] : guestFavorites;
  return {enabled, orders:state.scope===scope?state.orders:[], profile:state.scope===scope?state.profile:emptyProfile, favorites, error,
    toggleFavorite:async(id:string)=>{if(!enabled){const next=favorites.includes(id)?favorites.filter(v=>v!==id):[...favorites,id];setGuestFavorites(next);localStorage.setItem('crunchy_favorites',JSON.stringify(next));return;}
      try{const result=await apiClient.post<any>(customerPath(`favorites/${id}/`),{selected:!favorites.includes(id)});setState(old=>({...old,favorites:result.favorites.map(String)}));}catch(e){setError(extractErrorMessage(e));}},
    saveProfile:async(values:any)=>{try{await apiClient.patch(customerPath('profile/'),{name:values.name,email:values.email,address:values.address || ''});customerRefresh();return true;}catch(e){setError(extractErrorMessage(e));return false;}},
    cancel:async(id:string)=>{try{await apiClient.post(customerPath(`orders/${id}/cancel/`),{});customerRefresh();}catch(e){setError(extractErrorMessage(e));}}
  };
}
