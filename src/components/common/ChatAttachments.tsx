import React,{useEffect,useRef,useState} from 'react';
import {Paperclip,Mic,Square,Camera,MapPin,FileText,Download} from 'lucide-react';
import {apiClient,DEFAULT_API_BASE,extractErrorMessage,RequestOptions} from '../../lib/api';
import {ChatMessage} from '../../lib/chat';

export const CHAT_FILE_LIMIT=20*1024*1024;

export const AttachmentPicker:React.FC<{
  disabled:boolean;
  onFile:(file:File)=>void;
  onError:(error:string)=>void;
  onLocation?:(locationText:string)=>void;
}> = ({disabled,onFile,onError,onLocation})=>{
  const input=useRef<HTMLInputElement>(null),camera=useRef<HTMLInputElement>(null),recorder=useRef<MediaRecorder|null>(null);
  const stream=useRef<MediaStream|null>(null),timer=useRef<ReturnType<typeof setTimeout>>(),active=useRef(true);
  const [recording,setRecording]=useState(false),[starting,setStarting]=useState(false),[locating,setLocating]=useState(false);

  const choose=(file?:File)=>{
    if(!file)return;
    if(!file.size||file.size>CHAT_FILE_LIMIT){
      onError('Choose a non-empty file up to 20 MB.');
      return;
    }
    onFile(file);
  };

  useEffect(()=>{
    active.current=true;
    return()=>{
      active.current=false;
      clearTimeout(timer.current);
      if(recorder.current?.state==='recording')recorder.current.stop();
      stream.current?.getTracks().forEach(t=>t.stop());
    };
  },[]);

  useEffect(()=>{
    const hidden=()=>{if(document.hidden&&recorder.current?.state==='recording')recorder.current.stop();};
    document.addEventListener('visibilitychange',hidden);
    return()=>document.removeEventListener('visibilitychange',hidden);
  },[]);

  const record=async()=>{
    if(recording){recorder.current?.stop();return;}
    setStarting(true);
    try{
      if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined')throw new Error('Recording is unavailable here. You can attach an audio file instead.');
      const media=await navigator.mediaDevices.getUserMedia({audio:true});
      if(!active.current){media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media;
      const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(type=>MediaRecorder.isTypeSupported(type));
      const instance=new MediaRecorder(media,mime?{mimeType:mime}:undefined);
      recorder.current=instance;
      const chunks:BlobPart[]=[];let size=0;
      instance.ondataavailable=e=>{
        if(e.data.size){
          chunks.push(e.data);
          size+=e.data.size;
          if(size>CHAT_FILE_LIMIT&&instance.state==='recording')instance.stop();
        }
      };
      instance.onerror=()=>{if(active.current)onError('Recording failed. Please try again.');media.getTracks().forEach(t=>t.stop());};
      instance.onstop=()=>{
        clearTimeout(timer.current);media.getTracks().forEach(t=>t.stop());if(!active.current)return;setRecording(false);
        const type=instance.mimeType||mime||'audio/webm';
        const extension=type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':'webm';
        choose(new File(chunks,`Voice-${Date.now()}.${extension}`,{type}));
      };
      instance.start(1000);
      setRecording(true);
      timer.current=setTimeout(()=>{if(instance.state==='recording')instance.stop();},300000);
    }catch(e){
      stream.current?.getTracks().forEach(t=>t.stop());
      if(active.current)onError(extractErrorMessage(e));
    }finally{
      if(active.current)setStarting(false);
    }
  };

  const handleShareLocation=()=>{
    if(disabled||recording||starting||locating)return;
    if(!navigator.geolocation){
      onError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos=>{
        setLocating(false);
        const lat=pos.coords.latitude.toFixed(6);
        const lng=pos.coords.longitude.toFixed(6);
        const mapsUrl=`https://www.google.com/maps?q=${lat},${lng}`;
        const locMessage=`📍 Live Location: https://www.google.com/maps?q=${lat},${lng}`;
        if(onLocation)onLocation(locMessage);
      },
      err=>{
        setLocating(false);
        onError(err.message||'Unable to retrieve current location.');
      },
      {enableHighAccuracy:true,timeout:10000,maximumAge:30000}
    );
  };

  return <div className="flex items-center gap-0.5 text-zinc-400 shrink-0">
    <input ref={input} type="file" aria-label="Choose attachment" className="hidden" onChange={e=>{choose(e.target.files?.[0]);e.target.value='';}}/>
    <input ref={camera} type="file" accept="image/*" capture="environment" aria-label="Take photo" className="hidden" onChange={e=>{choose(e.target.files?.[0]);e.target.value='';}}/>
    
    <button
      type="button"
      aria-label="Attach file"
      title="Attach file"
      disabled={disabled||recording||starting}
      onClick={()=>input.current?.click()}
      className="p-1 rounded-none hover:text-amber-400 hover:bg-zinc-800 disabled:opacity-30 transition-colors touch-manipulation"
    >
      <Paperclip size={14}/>
    </button>

    <button
      type="button"
      aria-label="Attach photo"
      title="Attach photo"
      disabled={disabled||recording||starting}
      onClick={()=>camera.current?.click()}
      className="p-1 rounded-none hover:text-amber-400 hover:bg-zinc-800 disabled:opacity-30 transition-colors touch-manipulation"
    >
      <Camera size={14}/>
    </button>

    <button
      type="button"
      aria-label="Share live location"
      title="Share live location"
      disabled={disabled||recording||starting||locating}
      onClick={handleShareLocation}
      className={`p-1 rounded-none hover:text-amber-400 hover:bg-zinc-800 disabled:opacity-30 transition-colors touch-manipulation ${locating?'text-amber-400 animate-pulse':''}`}
    >
      <MapPin size={14}/>
    </button>

    <button
      type="button"
      aria-label={recording?'Stop recording':'Record voice message'}
      title={recording?'Stop recording':'Record voice'}
      disabled={disabled||starting}
      onClick={()=>void record()}
      className={`p-1 rounded-none transition-colors touch-manipulation ${recording?'text-red-400 bg-red-500/20 animate-pulse':'hover:text-amber-400 hover:bg-zinc-800 disabled:opacity-30'}`}
    >
      {recording?<Square size={14}/>:<Mic size={14}/>}
    </button>

    {recording&&<span className="text-[9px] text-red-400 font-mono animate-pulse ml-0.5">REC</span>}
  </div>;
};

// In-memory media URL cache so audio, video and images load instantly and stay cached
const mediaUrlCache = new Map<string, string>();

export const ChatAttachment:React.FC<{
  message:ChatMessage;
  accessPath:string;
  options:RequestOptions;
  mine?:boolean;
}>=({message,accessPath,options,mine})=>{
  const [url,setUrl]=useState(()=>mediaUrlCache.get(accessPath)||'');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const attachment=message.attachment!;

  const load=async()=>{
    const cached=mediaUrlCache.get(accessPath);
    if(cached){
      setUrl(cached);
      return cached;
    }
    setLoading(true);
    try{
      const data=await apiClient.get<{url:string}>(accessPath,options);
      const resolved=new URL(data.url,new URL(DEFAULT_API_BASE,location.origin)).href;
      mediaUrlCache.set(accessPath,resolved);
      setUrl(resolved);
      setError('');
      return resolved;
    }catch(e){
      setError(extractErrorMessage(e));
      return '';
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{
    let cancelled=false;
    const cached=mediaUrlCache.get(accessPath);
    if(cached){
      setUrl(cached);
      return;
    }
    if(['image','audio','video'].includes(attachment.kind)){
      setLoading(true);
      apiClient.get<{url:string}>(accessPath,options)
        .then(data=>{
          if(cancelled)return;
          const resolved=new URL(data.url,new URL(DEFAULT_API_BASE,location.origin)).href;
          mediaUrlCache.set(accessPath,resolved);
          setUrl(resolved);
        })
        .catch(()=>{if(!cancelled)setError('Preview unavailable. Open again.');})
        .finally(()=>{if(!cancelled)setLoading(false);});
    }
    return()=>{cancelled=true;};
  },[message.id,accessPath,attachment.kind]);

  return <div className="min-w-0 my-0.5 space-y-1">
    {url&&attachment.kind==='image'&&(
      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden">
        <img
          src={url}
          alt={attachment.name}
          loading="lazy"
          className="max-h-52 max-w-full rounded-none object-contain block hover:opacity-95 transition-opacity"
          onError={()=>{setUrl('');setError('Preview expired. Open again.');}}
        />
      </a>
    )}

    {url&&attachment.kind==='audio'&&(
      <audio aria-label={attachment.name} src={url} controls preload="auto" className="w-full max-w-56 h-7 my-0.5"/>
    )}

    {url&&attachment.kind==='video'&&(
      <video aria-label={attachment.name} src={url} controls playsInline preload="metadata" className="max-h-56 max-w-full rounded-none"/>
    )}

    {attachment.kind==='file'?(
      <div className={`flex items-center gap-2 p-1.5 rounded-none border ${mine?'bg-amber-300/30 border-amber-600/30 text-zinc-950':'bg-zinc-800/80 border-zinc-700/60 text-zinc-200'}`}>
        <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${mine?'bg-amber-500/30 text-zinc-950':'bg-zinc-700 text-amber-400'}`}>
          <FileText size={13}/>
        </div>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            disabled={loading}
            className="text-[11px] font-medium leading-tight text-left break-all hover:underline block"
            onClick={async()=>{
              const link=await load();
              if(link){
                const a=document.createElement('a');
                a.href=link;
                a.download=attachment.name;
                a.rel='noreferrer';
                a.click();
              }
            }}
          >
            {loading?'Loading...':`Download ${attachment.name}`}
          </button>
          <span className="text-[9px] opacity-75">{Math.max(1,Math.ceil(attachment.size/1024))} KB</span>
        </div>
        <Download size={12} className="shrink-0 opacity-60"/>
      </div>
    ):attachment.kind==='audio'?(
      <button
        type="button"
        disabled={loading}
        className={`text-[10px] underline break-all text-left block opacity-85 hover:opacity-100 ${mine?'text-zinc-900':'text-zinc-300'}`}
        onClick={async()=>{await load();}}
      >
        {loading?'Loading...':`Open ${attachment.name}`} ({Math.max(1,Math.ceil(attachment.size/1024))} KB)
      </button>
    ):null}

    {error&&<p className="text-[10px] text-red-400">{error}</p>}
  </div>;
};

export const DraftAttachment:React.FC<{file:File;remove:()=>void}>=({file,remove})=>{
  const [url,setUrl]=useState('');
  useEffect(()=>{
    const next=URL.createObjectURL(file);
    setUrl(next);
    return()=>URL.revokeObjectURL(next);
  },[file]);

  return <div className="px-2.5 py-1 text-xs border-b border-zinc-800 bg-zinc-950 flex items-center justify-between gap-2 shrink-0">
    <div className="flex items-center gap-1.5 min-w-0 flex-1">
      <span className="truncate text-[11px] text-zinc-300">
        {file.name} <span className="text-[10px] text-zinc-500">({Math.ceil(file.size/1024)} KB)</span>
      </span>
    </div>
    {url&&file.type.startsWith('audio/')&&<audio src={url} controls className="h-6 w-32" aria-label="Preview voice message" preload="auto"/>}
    {url&&file.type.startsWith('image/')&&file.type!=='image/svg+xml'&&<img src={url} alt="Selected photo" className="h-5 w-5 rounded-none object-cover border border-zinc-700"/>}
    <button aria-label="Remove attachment" onClick={remove} className="text-[10px] text-red-400 hover:underline shrink-0">Remove</button>
  </div>;
};
