import { apiClient, DEFAULT_API_BASE, RequestOptions } from './api';

export type ChatMessage = {id:number; client_id:string; conversation_id:string; text:string; preview?:string; attachment?:{name:string;size:number;mime:string;kind:string}|null; is_staff:boolean; created_at:string};
export type Conversation = {id:string; outlet_id:number; outlet_name:string; customer_name:string; is_guest:boolean; last_client_ip?:string; last_message_id:number; unread_count:number; customer_read_id:number; staff_read_id:number; last_message:ChatMessage|null};
export type History = {conversation:Conversation; messages:ChatMessage[]; has_more:boolean};
export type Inbox = {results:Conversation[]; unread_count:number; has_more:boolean};
export function guestCredential(): string {
  let token = localStorage.getItem('crunchy_chat_guest');
  if(!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
    localStorage.setItem('crunchy_chat_guest', token);
  }
  return token;
}
export function mergeMessages(old:ChatMessage[], fresh:ChatMessage[]) {
  return [...new Map([...old,...fresh].map(message=>[message.id,message])).values()].sort((a,b)=>a.id-b.id);
}
/** Short-lived signed tickets; reconnects always fetch a fresh REST snapshot. */
export function connectChat(ticketPath:string, body:object, options:RequestOptions, changed:()=>void, status:(s:string)=>void, typing:(event:{conversation_id:string;is_staff:boolean;is_typing:boolean})=>void=()=>{}) {
  let stopped=false, socket:WebSocket|undefined, timer:ReturnType<typeof setTimeout>|undefined;
  let heartbeat:ReturnType<typeof setInterval>|undefined, failures=0;
  const controller=new AbortController();
  const connect=async()=>{
    if(stopped)return;
    status(failures?'Reconnecting...':'Connecting...');
    try {
      const ticket=await apiClient.post<{ticket:string;path:string}>(ticketPath,body,{...options,signal:controller.signal});
      if(stopped)return;
      const url=new URL(ticket.path,new URL(DEFAULT_API_BASE,location.origin));
      url.protocol=url.protocol==='https:'?'wss:':'ws:';url.searchParams.set('ticket',ticket.ticket);
      socket=new WebSocket(url);
      let lastSeen=Date.now(), revision:number|undefined, openedAt=0;
      socket.onopen=()=>{openedAt=Date.now();status('Live');changed();socket?.send(JSON.stringify({type:'ping'}));
        heartbeat=setInterval(()=>{if(Date.now()-lastSeen>65000)socket?.close();else socket?.send(JSON.stringify({type:'ping'}));},25000);};
      socket.onmessage=event=>{lastSeen=Date.now();try{const data=JSON.parse(event.data);
        if(data.event_type==='CHAT_TYPING')typing(data);
        else if(data.event_type==='HEARTBEAT'){if(revision!==undefined&&revision!==data.revision)changed();revision=data.revision;}
        else if(data.event_type==='CHAT_MESSAGE'||data.event_type==='CHAT_READ')changed();
      }catch{socket?.close();}};
      socket.onclose=()=>{clearInterval(heartbeat);if(Date.now()-openedAt>30000)failures=0;schedule();};
      socket.onerror=()=>socket?.close();
    }catch{schedule();}
  };
  const schedule=()=>{if(stopped)return;status('Reconnecting...');timer=setTimeout(connect,Math.min(30000,1000*2**Math.min(failures++,5))+Math.random()*500);};
  void connect();
  const close=()=>{stopped=true;controller.abort();clearTimeout(timer);clearInterval(heartbeat);socket?.close();};
  return Object.assign(close,{sendTyping:(id:string,active:boolean)=>{if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'typing',conversation_id:id,is_typing:active}));}});
}
