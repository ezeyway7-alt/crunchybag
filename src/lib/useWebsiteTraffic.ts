import {useEffect,useRef} from 'react';
import {apiClient} from './api';

export function useWebsiteTraffic(path:string,outlet:string,portal:string,staff:boolean){
  const last=useRef('');
  useEffect(()=>{
    if(!/^\d+$/.test(outlet)||navigator.doNotTrack==='1'||(navigator as any).globalPrivacyControl)return;
    const allowed=['/','/menu','/orders','/profile','/checkout','/table-qr','/kiosk','/track'];
    if(staff)return;
    const timer=setTimeout(()=>{
      try{
        const actualPath=window.location.pathname.toLowerCase().replace(/\/+$/,'')||'/';
        if(!allowed.includes(actualPath))return;
        const scope=`${outlet}:${actualPath}:${portal}`;
        if(last.current===scope)return;
        last.current=scope;
        const now=Date.now();let visitor=JSON.parse(localStorage.getItem('crunchy_visitor')||'null');
        if(!visitor||visitor.expires<now){visitor={id:crypto.randomUUID(),expires:now+90*86400000};localStorage.setItem('crunchy_visitor',JSON.stringify(visitor));}
        let session=JSON.parse(sessionStorage.getItem('crunchy_visit_session')||'null');
        if(!session||now-session.last>30*60000)session={id:crypto.randomUUID()};
        session.last=now;sessionStorage.setItem('crunchy_visit_session',JSON.stringify(session));
        const channel=actualPath==='/kiosk'||portal==='kiosk'?'KIOSK':actualPath==='/table-qr'||portal==='table-qr'?'TABLE_QR':'WEBSITE';
        void apiClient.post('/customer/traffic/',{event_id:crypto.randomUUID(),visitor_id:visitor.id,session_id:session.id,outlet_id:Number(outlet),path:actualPath,channel,device:window.matchMedia('(max-width: 767px)').matches?'MOBILE':'DESKTOP'},{skipAuth:true}).catch(()=>{});
      }catch{} // Analytics must never interrupt ordering or require browser storage.
    },150);
    return()=>clearTimeout(timer);
  },[path,outlet,portal,staff]);
}
