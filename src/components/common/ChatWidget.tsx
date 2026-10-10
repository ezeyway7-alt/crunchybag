import {AttachmentPicker,ChatAttachment,DraftAttachment} from './ChatAttachments';
import {pendingFile} from '../../lib/chatFiles';
import React, {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft, MessageCircle, Send, X, ExternalLink, MapPin} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {useApp} from '../../context/AppContext';
import {apiClient,extractErrorMessage,RequestOptions} from '../../lib/api';
import {ChatMessage,Conversation,History,Inbox,connectChat,guestCredential,mergeMessages} from '../../lib/chat';

function getGoogleMapsUrl(text?: string): string | null {
  if (!text) return null;
  const match = text.match(/https?:\/\/(?:www\.)?(?:google\.com\/maps[^\s]*|maps\.google\.com[^\s]*)/i);
  return match ? match[0] : null;
}

function getFirstUrl(text?: string): string | null {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

type Pending={client_id:string;text:string;conversation_id:string;fileName?:string};
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
  const [file,setFile]=useState<File|null>(null);
  const lastLoaded=useRef(0);
  const alive=useRef(true),activeId=useRef(''),openRef=useRef(false),bottom=useRef<HTMLDivElement>(null),busy=useRef(false);
  const options=useRef<RequestOptions>({cache:'no-store',skipAuth:!authenticated});
  const prefix=staff?`/chat/staff/`:'/chat/';
  const path=useCallback((suffix:string)=>`${prefix}${suffix}${staff?`?outlet_id=${encodeURIComponent(outlet)}`:''}`,[prefix,outlet,staff]);
  const savePending=(value:Pending|null)=>{if(!value&&pending?.fileName)void pendingFile(`${storageKey}:${pending.client_id}`,null).catch(()=>{});setPending(value);try{if(value)sessionStorage.setItem(storageKey,JSON.stringify(value));else sessionStorage.removeItem(storageKey);}catch{/* In-memory retries still work when storage is unavailable. */}};
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
    indicateTyping(false);setTypingId('');setDraft('');setFile(null);
    activeId.current=item.id;lastLoaded.current=0;setThread(item);setMessages([]);setLoading(true);setError('');
    try{const data=await apiClient.get<History>(path(`conversations/${item.id}/messages/`),options.current);if(activeId.current===item.id)accept(data,true);}
    catch(e){setError(extractErrorMessage(e));}finally{setLoading(false);}
  };
  const send=async()=>{
    if(busy.current||!thread)return;
    const message=pending||{client_id:crypto.randomUUID(),text:draft.trim(),conversation_id:thread.id,...(file?{fileName:file.name}:{})};
    if((!message.text&&!message.fileName)||message.conversation_id!==thread.id)return;
    indicateTyping(false);
    busy.current=true;setSending(true);setError('');
    try{
      let payload:any={client_id:message.client_id,text:message.text};
      if(message.fileName){
        const upload=pending?await pendingFile(`${storageKey}:${message.client_id}`):file;
        if(!upload)throw new Error('The pending file is unavailable. Discard this attempt and select it again.');
        if(!pending)await pendingFile(`${storageKey}:${message.client_id}`,upload);
        payload=new FormData();payload.append('client_id',message.client_id);payload.append('text',message.text);payload.append('file',upload,upload.name);
      }
      savePending(message);setDraft('');setFile(null);
      const saved=await apiClient.post<ChatMessage>(path(`conversations/${thread.id}/messages/`),payload,options.current);
      if(message.fileName)void pendingFile(`${storageKey}:${message.client_id}`,null).catch(()=>{});
      try{sessionStorage.removeItem(storageKey);}catch{};
      if(alive.current){if(activeId.current===message.conversation_id)setMessages(old=>mergeMessages(old,[saved]));savePending(null);void refresh();}}
    catch(e){if(alive.current)setError(extractErrorMessage(e));}
    finally{busy.current=false;if(alive.current)setSending(false);}
  };
  const older=async()=>{if(!thread||!messages.length)return;setLoading(true);try{
    const url=path(`conversations/${thread.id}/messages/`);const data=await apiClient.get<History>(`${url}${url.includes('?')?'&':'?'}before=${messages[0].id}`,options.current);
    setMessages(old=>mergeMessages(old,data.messages));setMore(data.has_more);
  }catch(e){setError(extractErrorMessage(e));}finally{setLoading(false);}};

  return <div className="ph-no-capture ph-sensitive fixed right-3 sm:right-4 bottom-20 sm:bottom-5 z-[90] font-sans" data-ph-no-capture>
    {!open?(
      <div className="flex items-center gap-2 group">
        <button
          type="button"
          onClick={()=>{setOpen(true);setStarted(true);try{localStorage.setItem(`crunchy_chat_started:${scope}`,'1');}catch{}}}
          className="px-2.5 py-1 rounded-none bg-zinc-950/95 border border-amber-400 text-amber-300 text-[11px] font-semibold shadow-lg shadow-black/50 flex items-center gap-1.5 hover:bg-zinc-900 active:scale-95 transition-all select-none cursor-pointer animate-pulse"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Order by chat</span>
        </button>
        <button
          aria-label="Open messages"
          onClick={()=>{setOpen(true);setStarted(true);try{localStorage.setItem(`crunchy_chat_started:${scope}`,'1');}catch{}}}
          className="relative h-10 w-10 rounded-full bg-amber-400 text-zinc-950 border border-amber-300 shadow-lg shadow-black/40 flex items-center justify-center hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-white"
        >
          {/* Ambient wave animation around the chat icon */}
          <span className="absolute -inset-1 rounded-full bg-amber-400/35 animate-ping pointer-events-none -z-10" />
          <span className="absolute -inset-1.5 rounded-full border border-amber-400/50 animate-pulse pointer-events-none -z-10" />
          <MessageCircle size={18}/>
          {unread>0&&<span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5 flex items-center justify-center shadow-sm">{unread>99?'99+':unread}</span>}
        </button>
      </div>
    ):
    <section
      role="dialog"
      aria-label={staff?'Customer messages':'Chat with CrunchyBag'}
      className="w-[calc(100vw-1.5rem)] sm:w-[350px] h-[min(570px,78dvh)] rounded-none border border-amber-400 bg-zinc-950 text-zinc-100 shadow-2xl shadow-black/80 flex flex-col overflow-hidden"
    >
      <header className="flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-800 bg-zinc-900/95 text-xs select-none">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {staff&&thread?(
            <button
              aria-label="Back to inbox"
              onClick={()=>{indicateTyping(false);setTypingId('');setDraft('');setFile(null);activeId.current='';setThread(null);setMessages([]);void refresh();}}
              className="p-0.5 text-zinc-400 hover:text-white shrink-0"
            >
              <ArrowLeft size={13}/>
            </button>
          ):(
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse"/>
          )}
          <div className="flex items-center gap-1 min-w-0 truncate text-[11px]">
            <h2 className="font-semibold text-zinc-200 truncate">
              {staff?(thread?.customer_name||'Customer messages'):'Chat with CrunchyBag'}
            </h2>
            <span className="text-zinc-600 shrink-0">•</span>
            <span className="text-zinc-400 truncate text-[10px]">{thread?.outlet_name||'Main'}</span>
            <span className="text-zinc-600 shrink-0">•</span>
            <span className="text-emerald-400 text-[10px] font-medium shrink-0">
              {status==='Connected'?'Live':status}
            </span>
          </div>
        </div>
        <button
          aria-label="Close messages"
          onClick={()=>{indicateTyping(false);setTypingId('');setOpen(false);}}
          className="p-0.5 text-zinc-400 hover:text-white shrink-0 rounded-none transition-colors"
        >
          <X size={14}/>
        </button>
      </header>

      {error&&<div role="alert" className="p-2 text-xs bg-red-950/60 border-b border-red-900/50 text-red-200 flex items-center justify-between">{error}<button aria-label="Retry connection" className="ml-2 underline font-medium text-amber-400 shrink-0" onClick={()=>{setRetry(n=>n+1);void refresh();}}>Retry</button></div>}

      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-2.5 space-y-2" role="log" aria-live="polite">
        {loading&&<p className="text-[10px] text-zinc-500 font-mono">Loading messages...</p>}
        {staff&&!thread?<>{!loading&&!threads.length&&<p className="text-zinc-400 text-xs p-2">No conversations yet. Customer messages will appear here.</p>}{threads.map(item=><button key={item.id} onClick={()=>void choose(item)} className="w-full text-left p-2 rounded-none bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"><div className="flex justify-between gap-2"><strong className="truncate text-xs">{item.customer_name}{item.is_guest?'':' - Customer'}</strong>{item.unread_count>0&&<span className="text-[10px] bg-amber-400 text-black font-semibold rounded-none px-1.5">{item.unread_count}</span>}</div><p className="text-[10px] text-zinc-500">{item.last_client_ip}</p><p className="text-xs text-zinc-400 truncate mt-0.5">{item.last_message?.preview||item.last_message?.text}</p></button>)}{moreThreads&&<button className="text-amber-400 text-xs underline p-1" onClick={async()=>{try{const data=await apiClient.get<Inbox>(`${path('')}&before=${threads.at(-1)?.last_message_id}`,options.current);setThreads(old=>[...new Map([...old,...data.results].map(t=>[t.id,t])).values()]);setMoreThreads(data.has_more);}catch(e){setError(extractErrorMessage(e));}}}>Older conversations</button>}</>:
        <>{!messages.length&&!loading&&<div className="rounded-none p-2.5 bg-zinc-900/90 border border-zinc-800 text-xs"><p className="font-medium text-zinc-200">How can we help with your order?</p><p className="text-zinc-400 text-[11px] mt-1">Ask about the menu, delivery or an order. Our team will reply live here. Messages do not place an order automatically.</p>{!authenticated&&<p className="text-[10px] text-zinc-500 mt-1">Guest chat stays in this browser. Keep this browser to see replies.</p>}</div>}{more&&<button disabled={loading} onClick={()=>void older()} className="text-amber-400 text-[10px] underline block mx-auto py-1">Load earlier messages</button>}
        {messages.map(message=>{
          const mine=message.is_staff===staff;
          const hasImage=message.attachment?.kind==='image';
          const hasOnlyImage=hasImage&&!message.text;
          const mapsUrl=getGoogleMapsUrl(message.text);
          const anyUrl=mapsUrl||getFirstUrl(message.text);
          const isLocation=!!mapsUrl;
          const isClickableUrl=!!anyUrl;

          const openLink=(e: React.MouseEvent)=>{
            if(!anyUrl)return;
            const target=(e.target as HTMLElement);
            if(target.closest('button')||target.closest('audio')||target.closest('video'))return;
            window.open(anyUrl,'_blank','noopener,noreferrer');
          };

          return <div key={message.id} className={`flex ${mine?'justify-end':'justify-start'}`}>
            <div
              onClick={isClickableUrl?openLink:undefined}
              className={`max-w-[85%] rounded-none transition-all ${
                hasOnlyImage
                  ? 'p-0.5 bg-zinc-900 border border-zinc-800'
                  : isLocation
                  ? 'p-2 bg-zinc-900 border border-amber-400 text-zinc-100 hover:bg-zinc-850 hover:border-amber-300 cursor-pointer shadow-md'
                  : isClickableUrl
                  ? mine
                    ? 'px-2.5 py-1.5 bg-amber-400 text-zinc-950 border border-amber-400 hover:bg-amber-300 cursor-pointer shadow-sm'
                    : 'px-2.5 py-1.5 bg-zinc-900 text-zinc-100 border border-zinc-800 hover:border-amber-400 cursor-pointer shadow-sm'
                  : mine
                  ? 'px-2.5 py-1.5 bg-amber-400 text-zinc-950 border border-amber-400/80 shadow-sm'
                  : 'px-2.5 py-1.5 bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-sm'
              }`}
            >
              {isLocation ? (
                <div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={13}/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-amber-400">Live Location Pin</span>
                        <span className="text-[9px] text-zinc-400 flex items-center gap-0.5 hover:underline">
                          Open Maps <ExternalLink size={9}/>
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 truncate mt-0.5">{message.text}</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-amber-400/80 block mt-1">Tap anywhere to open in Google Maps ↗</span>
                </div>
              ) : (
                message.text && (
                  <p className={`whitespace-pre-wrap break-words text-xs leading-relaxed ${isClickableUrl?'underline decoration-amber-400/60 hover:decoration-amber-400':''}`}>
                    {message.text}
                  </p>
                )
              )}

              {message.attachment&&<ChatAttachment message={message} accessPath={path(`conversations/${message.conversation_id}/messages/${message.id}/attachment/`)} options={options.current} mine={mine}/>}

              <div className={`text-[9px] mt-0.5 flex items-center gap-1 ${hasOnlyImage?'px-1 py-0.5 text-zinc-400 justify-end':isLocation?'text-zinc-400 justify-end':mine?'text-zinc-800 justify-end':'text-zinc-500 justify-start'}`}>
                {!mine&&message.is_staff&&<span>CrunchyBag · </span>}
                <span>{new Date(message.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                {mine&&<span>· {(staff?thread?.customer_read_id:thread?.staff_read_id)!>=message.id?'Read':'Sent'}</span>}
              </div>
            </div>
          </div>;
        })}
        {pending&&pending.conversation_id===thread?.id&&<div className="ml-4 rounded-none border border-amber-400/60 bg-amber-400/5 p-2 text-xs"><p className="whitespace-pre-wrap break-words">{pending.text}</p>{pending.fileName&&<p className="text-[10px] text-zinc-400 mt-0.5">Attachment: {pending.fileName}</p>}<button disabled={sending} onClick={()=>void send()} className="text-amber-400 text-[11px] underline mt-1">{sending?'Sending...':'Not confirmed - tap to retry'}</button>{!sending&&<button className="ml-3 text-[11px] text-zinc-400 underline" onClick={()=>savePending(null)}>Discard</button>}</div>}
        <div ref={bottom}/></>}
      </div>

      {thread&&typingId===thread.id&&(
        <p role="status" className="shrink-0 px-2.5 py-1 text-[11px] text-amber-400 border-t border-zinc-900 bg-zinc-950/90 flex items-center gap-1.5 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
          {staff?thread.customer_name:'CrunchyBag team'} is typing...
        </p>
      )}

      {thread&&<div className="border-t border-zinc-800/90 bg-zinc-900/90 shrink-0">
        {file&&<DraftAttachment file={file} remove={()=>setFile(null)}/>}
        <form onSubmit={e=>{e.preventDefault();void send();}} className="p-1 flex items-center gap-1">
          <AttachmentPicker
            key={thread.id}
            disabled={sending||!!pending||loading}
            onFile={setFile}
            onError={setError}
            onLocation={locText=>{
              setDraft(prev=>prev.trim()?`${prev.trim()}\n${locText}`:locText);
            }}
          />
          <textarea
            aria-label="Message"
            placeholder="Type a message..."
            maxLength={2000}
            rows={1}
            value={draft}
            disabled={sending||!!pending}
            onBlur={()=>indicateTyping(false)}
            onChange={e=>{setDraft(e.target.value);indicateTyping(!!e.target.value.trim());}}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send();}}}
            className="flex-1 min-w-0 resize-none rounded-none bg-zinc-950 border border-zinc-800/90 px-2 py-1 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-400 max-h-20 leading-snug"
          />
          <button
            aria-label="Send message"
            disabled={sending||!!pending||(!draft.trim()&&!file)}
            className="h-7 w-7 rounded-none bg-amber-400 text-zinc-950 flex items-center justify-center hover:bg-amber-300 disabled:opacity-30 disabled:hover:bg-amber-400 transition-colors shrink-0"
          >
            <Send size={13}/>
          </button>
        </form>
      </div>}
    </section>}
  </div>;
}
