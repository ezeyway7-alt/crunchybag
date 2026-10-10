import React, {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft, MessageCircle, Send, X, RefreshCw} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {useApp} from '../../context/AppContext';
import {apiClient,extractErrorMessage,RequestOptions} from '../../lib/api';
import {ChatMessage,Conversation,History,Inbox,connectChat,guestCredential,mergeMessages} from '../../lib/chat';

type Pending={client_id:string;text:string;conversation_id:string};
export function ChatWidget(){
  const {authUser,authOutlet,isLoading}=useAuth();
  const {activePortal,currentOutlet}=useApp();
  if(isLoading || ['kiosk','tv','kitchen'].includes(activePortal) || /^\/(kiosk|tv|kds|admin-login|login)(\/|$)/.test(location.pathname))return null;
  const staff=!!authUser && authUser.role!=='CUSTOMER';
  const outlet=String(authOutlet?.id||currentOutlet?.id||1);
  return <ChatSession key={`${authUser?.id||'guest'}:${staff?outlet:authUser?outlet:'1'}`} staff={staff} authenticated={!!authUser} outlet={outlet} scope={`${authUser?.id||'guest'}:${authUser?outlet:'1'}`}/>;
}
const ChatSession: React.FC<{staff:boolean;authenticated:boolean;outlet:string;scope:string}> = ({staff,authenticated,outlet,scope}) => {
  const [open,setOpen]=useState(false),[started,setStarted]=useState(()=>staff || localStorage.getItem(`crunchy_chat_started:${scope}`)==='1');
  const [threads,setThreads]=useState<Conversation[]>([]),[thread,setThread]=useState<Conversation|null>(null);
  const [messages,setMessages]=useState<ChatMessage[]>([]),[more,setMore]=useState(false),[moreThreads,setMoreThreads]=useState(false);
  const [unread,setUnread]=useState(0),[draft,setDraft]=useState(''),[error,setError]=useState(''),[status,setStatus]=useState('Connecting...');
  const [loading,setLoading]=useState(false),[sending,setSending]=useState(false),[retry,setRetry]=useState(0);
  const storageKey=`crunchy_chat_pending:${scope}`;
  const [pending,setPending]=useState<Pending|null>(()=>{try{return JSON.parse(sessionStorage.getItem(storageKey)||'null');}catch{return null;}});
  const [typingId,setTypingId]=useState('');
  const live=useRef<ReturnType<typeof connectChat>|null>(null), typingExpiry=useRef<ReturnType<typeof setTimeout>>(), localExpiry=useRef<ReturnType<typeof setTimeout>>(), lastTyping=useRef(0);
  const indicateTyping=(active:boolean)=>{
    clearTimeout(localExpiry.current);
    if(!active||Date.now()-lastTyping.current>1200){live.current?.sendTyping(activeId.current,active);lastTyping.current=active?Date.now():0;}
    if(active)localExpiry.current=setTimeout(()=>{live.current?.sendTyping(activeId.current,false);lastTyping.current=0;},1800);
  };
  const lastLoaded=useRef(0);
  const alive=useRef(true),activeId=useRef(''),openRef=useRef(false),bottom=useRef<HTMLDivElement>(null),busy=useRef(false);
  const options=useRef<RequestOptions>({cache:'no-store',skipAuth:!authenticated});
  const prefix=staff?`/chat/staff/`:'/chat/';
  const path=useCallback((suffix:string)=>`${prefix}${suffix}${staff?`?outlet_id=${encodeURIComponent(outlet)}`:''}`,[prefix,outlet,staff]);
  const savePending=(value:Pending|null)=>{setPending(value);try{if(value)sessionStorage.setItem(storageKey,JSON.stringify(value));else sessionStorage.removeItem(storageKey);}catch{/* In-memory retries still work when storage is unavailable. */}};
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{openRef.current=open;},[open]);
  const accept=useCallback((data:History,reset=false)=>{
    if(!alive.current)return;
    setThread(data.conversation);activeId.current=data.conversation.id;
    setMessages(old=>reset?data.messages:mergeMessages(old,data.messages));
    if(reset)lastLoaded.current=0;
    lastLoaded.current=Math.max(lastLoaded.current,...data.messages.map(m=>m.id));
    if(reset)setMore(data.has_more);
    if(!staff)setUnread(data.conversation.unread_count);
  },[staff]);
  const refresh=useCallback(async()=>{
    try{
      if(staff){const list=await apiClient.get<Inbox>(path(''),options.current);if(!alive.current)return;setThreads(list.results);setMoreThreads(list.has_more);setUnread(list.unread_count);}
      const id=activeId.current;
      if(id){
        let moreNew=true;
        while(moreNew&&alive.current&&activeId.current===id){
          const url=path(`conversations/${id}/messages/`);
          const cursor=lastLoaded.current;
          const data=await apiClient.get<History & {has_newer?:boolean}>(`${url}${url.includes('?')?'&':'?'}after=${cursor}`,options.current);
          if(activeId.current!==id)return;
          accept(data);moreNew=!!data.has_newer;
        }
      }
    }catch(e){if(alive.current)setError(extractErrorMessage(e));}
  },[path,staff,accept]);
  useEffect(()=>{
    if(!started)return;
    let cancelled=false;setLoading(true);setError('');
    (async()=>{
      try{
        if(!authenticated)options.current={...options.current,headers:{'X-Chat-Guest':guestCredential()}};
        if(staff)await refresh();
        else {const data=await apiClient.post<History>('/chat/start/',{outlet_id:outlet},options.current);if(!cancelled)accept(data,true);}
      }catch(e){if(!cancelled)setError(extractErrorMessage(e));}
      finally{if(!cancelled)setLoading(false);}
    })();return()=>{cancelled=true;};
  },[started,retry]);
  useEffect(()=>{
    if(!started||(!staff&&!thread))return;
    const connection=connectChat(path('socket-ticket/'),staff?{}:{conversation_id:thread!.id},options.current,()=>void refresh(),setStatus,event=>{
      if(event.conversation_id!==activeId.current||event.is_staff===staff)return;
      clearTimeout(typingExpiry.current);setTypingId(event.is_typing?event.conversation_id:'');
      if(event.is_typing)typingExpiry.current=setTimeout(()=>setTypingId(''),5000);
    });live.current=connection;
    return()=>{connection.sendTyping(activeId.current,false);connection();live.current=null;clearTimeout(typingExpiry.current);clearTimeout(localExpiry.current);};
  },[started,staff,thread?.id,path,refresh,retry]);
  useEffect(()=>{
    const sync=()=>{if(document.visibilityState==='visible'&&started)void refresh();};
    window.addEventListener('online',sync);document.addEventListener('visibilitychange',sync);
    return()=>{window.removeEventListener('online',sync);document.removeEventListener('visibilitychange',sync);};
  },[started,refresh]);
  useEffect(()=>{
    if(pending&&messages.some(m=>m.client_id===pending.client_id&&m.conversation_id===pending.conversation_id))savePending(null);

    if(!open||!thread||!messages.length||document.visibilityState!=='visible')return;
    const last=messages[messages.length-1].id;
    if((staff?thread.staff_read_id:thread.customer_read_id)>=last&&thread.unread_count===0)return;
    apiClient.post(path(`conversations/${thread.id}/read/`),{last_message_id:last},options.current).then(()=>{if(!staff)setUnread(0);}).catch(()=>{});
  },[open,messages,thread?.id]);
  useEffect(()=>{if(open)bottom.current?.scrollIntoView({behavior:'smooth',block:'end'});},[open,messages.at(-1)?.id,pending]);
  const choose=async(item:Conversation)=>{
    indicateTyping(false);setTypingId('');setDraft('');
    activeId.current=item.id;lastLoaded.current=0;setThread(item);setMessages([]);setLoading(true);setError('');
    try{const data=await apiClient.get<History>(path(`conversations/${item.id}/messages/`),options.current);if(activeId.current===item.id)accept(data,true);}
    catch(e){setError(extractErrorMessage(e));}finally{setLoading(false);}
  };
  const send=async()=>{
    if(busy.current||!thread)return;
    const message=pending||{client_id:crypto.randomUUID(),text:draft.trim(),conversation_id:thread.id};
    if(!message.text||message.conversation_id!==thread.id)return;
    indicateTyping(false);
    busy.current=true;setSending(true);setError('');savePending(message);setDraft('');
    try{const saved=await apiClient.post<ChatMessage>(path(`conversations/${thread.id}/messages/`),message,options.current);
      if(alive.current){setMessages(old=>mergeMessages(old,[saved]));savePending(null);void refresh();}}
    catch(e){if(alive.current)setError(extractErrorMessage(e));}
    finally{busy.current=false;if(alive.current)setSending(false);}
  };
  const older=async()=>{if(!thread||!messages.length)return;setLoading(true);try{
    const url=path(`conversations/${thread.id}/messages/`);const data=await apiClient.get<History>(`${url}${url.includes('?')?'&':'?'}before=${messages[0].id}`,options.current);
    setMessages(old=>mergeMessages(old,data.messages));setMore(data.has_more);
  }catch(e){setError(extractErrorMessage(e));}finally{setLoading(false);}};
  return <div className="ph-no-capture ph-sensitive fixed right-4 bottom-24 sm:bottom-6 z-[90] font-sans" data-ph-no-capture>
    {!open?<button aria-label="Open messages" onClick={()=>{setOpen(true);setStarted(true);try{localStorage.setItem(`crunchy_chat_started:${scope}`,'1');}catch{}}} className="relative h-14 w-14 rounded-full bg-amber-400 text-zinc-950 shadow-xl shadow-black/40 flex items-center justify-center hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-white"><MessageCircle size={25}/>{unread>0&&<span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-xs px-1.5 py-0.5">{unread>99?'99+':unread}</span>}</button>:
    <section role="dialog" aria-label={staff?'Customer messages':'Chat with CrunchyBag'} className="w-[calc(100vw-2rem)] sm:w-96 h-[min(620px,75dvh)] rounded-2xl border border-zinc-700 bg-zinc-950 text-zinc-100 shadow-2xl flex flex-col overflow-hidden">
      <header className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-zinc-900">
        {staff&&thread?<button aria-label="Back to inbox" onClick={()=>{indicateTyping(false);setTypingId('');setDraft('');activeId.current='';setThread(null);setMessages([]);void refresh();}}><ArrowLeft size={20}/></button>:<MessageCircle className="text-amber-400"/>}
        <div className="flex-1 min-w-0"><h2 className="font-semibold truncate">{staff?(thread?.customer_name||'Customer messages'):'Chat with CrunchyBag'}</h2><p className="text-xs text-zinc-400">{thread?.outlet_name||'Ordering help'} - {status}</p></div>
        <button aria-label="Close messages" onClick={()=>{indicateTyping(false);setTypingId('');setOpen(false);}} className="p-2"><X size={20}/></button>
      </header>
      {error&&<div role="alert" className="p-3 text-sm bg-red-950/50 text-red-200">{error}<button aria-label="Retry connection" className="ml-2 underline" onClick={()=>{setRetry(n=>n+1);void refresh();}}>Retry</button></div>}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite">
        {loading&&<p className="text-xs text-zinc-400">Loading messages...</p>}
        {staff&&!thread?<>{!loading&&!threads.length&&<p className="text-zinc-400 text-sm">No conversations yet. Customer messages will appear here.</p>}{threads.map(item=><button key={item.id} onClick={()=>void choose(item)} className="w-full text-left p-3 rounded-xl bg-zinc-900 border border-zinc-800"><div className="flex justify-between gap-2"><strong className="truncate">{item.customer_name}{item.is_guest?'':' - Customer'}</strong>{item.unread_count>0&&<span className="text-xs bg-amber-400 text-black rounded-full px-2">{item.unread_count}</span>}</div><p className="text-xs text-zinc-500">{item.last_client_ip}</p><p className="text-sm text-zinc-400 truncate mt-1">{item.last_message?.text}</p></button>)}{moreThreads&&<button className="text-amber-400 text-sm" onClick={async()=>{try{const data=await apiClient.get<Inbox>(`${path('')}&before=${threads.at(-1)?.last_message_id}`,options.current);setThreads(old=>[...new Map([...old,...data.results].map(t=>[t.id,t])).values()]);setMoreThreads(data.has_more);}catch(e){setError(extractErrorMessage(e));}}}>Older conversations</button>}</>:
        <>{!messages.length&&!loading&&<div className="rounded-xl p-4 bg-zinc-900"><p className="font-medium">How can we help with your order?</p><p className="text-sm text-zinc-400 mt-2">Ask about the menu, delivery or an existing order. Our team will reply here. Messages do not place an order automatically.</p>{!authenticated&&<p className="text-xs text-zinc-500 mt-2">Guest chat stays in this browser. Keep this browser to see replies.</p>}</div>}{more&&<button disabled={loading} onClick={()=>void older()} className="text-amber-400 text-xs">Load earlier messages</button>}
        {messages.map(message=>{const mine=message.is_staff===staff;return <div key={message.id} className={`flex ${mine?'justify-end':'justify-start'}`}><div className={`max-w-[88%] rounded-2xl p-3 ${mine?'bg-amber-400 text-zinc-950 rounded-br-sm':'bg-zinc-800 rounded-bl-sm'}`}><p className="whitespace-pre-wrap break-words text-sm">{message.text}</p><p className={`text-[10px] mt-1 ${mine?'text-zinc-700':'text-zinc-400'}`}>{!mine&&message.is_staff?'CrunchyBag team - ':''}{new Date(message.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}{mine?` - ${(staff?thread?.customer_read_id:thread?.staff_read_id)!>=message.id?'Read':'Sent'}`:''}</p></div></div>})}
        {pending&&pending.conversation_id===thread?.id&&<div className="ml-8 rounded-xl border border-amber-400/50 p-3 text-sm"><p className="whitespace-pre-wrap break-words">{pending.text}</p><button disabled={sending} onClick={()=>void send()} className="text-amber-400 text-xs mt-2">{sending?'Sending...':'Not confirmed - tap to retry'}</button></div>}
        {typingId===thread?.id&&<p className="text-xs text-zinc-400">{staff?thread.customer_name:'CrunchyBag team'} is typing...</p>}<div ref={bottom}/></>}
      </div>
      {thread&&<form onSubmit={e=>{e.preventDefault();void send();}} className="border-t border-zinc-800 p-3 flex items-end gap-2"><textarea aria-label="Message" placeholder="Type your message..." maxLength={2000} rows={2} value={draft} disabled={sending||!!pending} onBlur={()=>indicateTyping(false)} onChange={e=>{setDraft(e.target.value);indicateTyping(!!e.target.value.trim());}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send();}}} className="flex-1 min-w-0 resize-none rounded-xl bg-zinc-900 p-3 text-sm outline-none focus:ring-1 focus:ring-amber-400"/><button aria-label="Send message" disabled={sending||!!pending||!draft.trim()} className="p-3 rounded-xl bg-amber-400 text-black disabled:opacity-40"><Send size={20}/></button></form>}
    </section>}
  </div>;
}
