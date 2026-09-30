import {useEffect,useRef,useState} from 'react';
import {DEFAULT_API_BASE} from './api';

// Public outlet events carry identifiers/status only. Private snapshots still require authorization.
export function useOutletEvents(outlet: string, enabled: boolean, onRefresh: () => void, onEvent?: (event:any)=>void, channel:'display'|'analytics'='display') {
  const refreshRef=useRef(onRefresh), eventRef=useRef(onEvent);
  refreshRef.current=onRefresh;eventRef.current=onEvent;
  const [live,setLive]=useState(false);
  useEffect(()=>{
    if(!enabled)return;
    let stopped=false, socket:WebSocket|undefined, retry:ReturnType<typeof setTimeout>, debounce:ReturnType<typeof setTimeout>;
    let attempts=0, heard=Date.now(), revision:string|undefined;
    const seen=new Set<string>();
    const refresh=()=>{clearTimeout(debounce);debounce=setTimeout(()=>{if(!stopped)refreshRef.current();},120);};
    const connect=()=>{
      if(stopped)return;
      const url=new URL((import.meta as any).env.VITE_POS_WS_ORIGIN || DEFAULT_API_BASE,window.location.origin);
      url.protocol=['https:','wss:'].includes(url.protocol)?'wss:':'ws:';
      url.pathname=`/ws/outlets/${encodeURIComponent(outlet)}/${channel}/`;url.search='';
      const ws=new WebSocket(url);socket=ws;
      ws.onopen=()=>{if(stopped){ws.close();return;}setLive(true);attempts=0;heard=Date.now();refresh();ws.send(JSON.stringify({type:'ping'}));};
      ws.onmessage=message=>{
        if(stopped)return;
        heard=Date.now();
        try {
          const event=JSON.parse(message.data);
          if(event.event_type==='HEARTBEAT'){
            if(revision!==undefined && revision!==event.revision)refresh();
            revision=event.revision;return;
          }
          if(event.event==='CONNECTED')return;
          if(event.event_id && seen.has(event.event_id))return;
          if(event.event_id){seen.add(event.event_id);if(seen.size>500)seen.delete(seen.values().next().value!);}
          eventRef.current?.(event);refresh();
        }catch{}
      };
      ws.onerror=()=>ws.close();
      ws.onclose=()=>{if(stopped)return;setLive(false);retry=setTimeout(connect,Math.min(30000,1000*2**Math.min(attempts++,5)));};
    };
    connect();
    const ping=setInterval(()=>{if(socket?.readyState===WebSocket.OPEN){if(Date.now()-heard>65000)socket.close();else socket.send(JSON.stringify({type:'ping'}));}},25000);
    return()=>{stopped=true;clearInterval(ping);clearTimeout(retry);clearTimeout(debounce);socket?.close();};
  },[outlet,enabled,channel]);
  return live;
}
