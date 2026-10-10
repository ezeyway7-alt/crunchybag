import React,{useEffect,useRef,useState} from 'react';
import {Paperclip,Mic,Square,Camera} from 'lucide-react';
import {apiClient,DEFAULT_API_BASE,extractErrorMessage,RequestOptions} from '../../lib/api';
import {ChatMessage} from '../../lib/chat';

export const CHAT_FILE_LIMIT=20*1024*1024;
export const AttachmentPicker:React.FC<{disabled:boolean;onFile:(file:File)=>void;onError:(error:string)=>void}> = ({disabled,onFile,onError})=>{
  const input=useRef<HTMLInputElement>(null),camera=useRef<HTMLInputElement>(null),recorder=useRef<MediaRecorder|null>(null);
  const stream=useRef<MediaStream|null>(null),timer=useRef<ReturnType<typeof setTimeout>>(),active=useRef(true);
  const [recording,setRecording]=useState(false),[starting,setStarting]=useState(false);
  const choose=(file?:File)=>{if(!file)return;if(!file.size||file.size>CHAT_FILE_LIMIT){onError('Choose a non-empty file up to 20 MB.');return;}onFile(file);};
  useEffect(()=>{active.current=true;return()=>{active.current=false;clearTimeout(timer.current);if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());};},[]);
  useEffect(()=>{const hidden=()=>{if(document.hidden&&recorder.current?.state==='recording')recorder.current.stop();};document.addEventListener('visibilitychange',hidden);return()=>document.removeEventListener('visibilitychange',hidden);},[]);
  const record=async()=>{
    if(recording){recorder.current?.stop();return;}
    setStarting(true);
    try{
      if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined')throw new Error('Recording is unavailable here. You can attach an audio file instead.');
      const media=await navigator.mediaDevices.getUserMedia({audio:true});
      if(!active.current){media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media;
      const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(type=>MediaRecorder.isTypeSupported(type));
      const instance=new MediaRecorder(media,mime?{mimeType:mime}:undefined);recorder.current=instance;
      const chunks:BlobPart[]=[];let size=0;
      instance.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);size+=e.data.size;if(size>CHAT_FILE_LIMIT&&instance.state==='recording')instance.stop();}};
      instance.onerror=()=>{if(active.current)onError('Recording failed. Please try again.');media.getTracks().forEach(t=>t.stop());};
      instance.onstop=()=>{clearTimeout(timer.current);media.getTracks().forEach(t=>t.stop());if(!active.current)return;setRecording(false);
        const type=instance.mimeType||mime||'audio/webm';const extension=type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':'webm';
        choose(new File(chunks,`Voice-${Date.now()}.${extension}`,{type}));};
      instance.start(1000);setRecording(true);timer.current=setTimeout(()=>{if(instance.state==='recording')instance.stop();},300000);
    }catch(e){stream.current?.getTracks().forEach(t=>t.stop());if(active.current)onError(extractErrorMessage(e));}
    finally{if(active.current)setStarting(false);}
  };
  return <div className="flex items-center gap-1 px-3 py-1 text-zinc-400">
    <input ref={input} type="file" aria-label="Choose attachment" className="hidden" onChange={e=>{choose(e.target.files?.[0]);e.target.value='';}}/>
    <input ref={camera} type="file" accept="image/*" capture="environment" aria-label="Take photo" className="hidden" onChange={e=>{choose(e.target.files?.[0]);e.target.value='';}}/>
    <button type="button" aria-label="Attach file" disabled={disabled||recording||starting} onClick={()=>input.current?.click()} className="p-2 disabled:opacity-40"><Paperclip size={18}/></button>
    <button type="button" aria-label="Attach photo" disabled={disabled||recording||starting} onClick={()=>camera.current?.click()} className="p-2 disabled:opacity-40"><Camera size={18}/></button>
    <button type="button" aria-label={recording?'Stop recording':'Record voice message'} disabled={disabled||starting} onClick={()=>void record()} className={`p-2 ${recording?'text-red-400 animate-pulse':''}`}>{recording?<Square size={18}/>:<Mic size={18}/>}</button>
    <span className="text-[10px]">{recording?'Recording - tap stop (max 5 min)':starting?'Waiting for microphone...':'Files up to 20 MB'}</span>
  </div>;
};

export const ChatAttachment:React.FC<{message:ChatMessage;accessPath:string;options:RequestOptions}>=({message,accessPath,options})=>{
  const [url,setUrl]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const attachment=message.attachment!;
  const load=async()=>{setLoading(true);try{
    const data=await apiClient.get<{url:string}>(accessPath,options);
    const resolved=new URL(data.url,new URL(DEFAULT_API_BASE,location.origin)).href;setUrl(resolved);setError('');return resolved;
  }catch(e){setError(extractErrorMessage(e));return '';}finally{setLoading(false);}};
  useEffect(()=>{let cancelled=false; if(attachment.kind==='image')apiClient.get<{url:string}>(accessPath,options).then(data=>{if(!cancelled)setUrl(new URL(data.url,new URL(DEFAULT_API_BASE,location.origin)).href);}).catch(()=>{if(!cancelled)setError('Preview unavailable. Open again.');});return()=>{cancelled=true;};},[message.id,accessPath]);
  return <div className="space-y-2 my-1 min-w-0">
    {url&&attachment.kind==='image'&&<a href={url} target="_blank" rel="noreferrer"><img src={url} alt={attachment.name} loading="lazy" className="max-h-52 max-w-full rounded-lg object-contain" onError={()=>{setUrl('');setError('Preview expired. Open again.');}}/></a>}
    {url&&attachment.kind==='audio'&&<audio aria-label={attachment.name} src={url} controls preload="metadata" className="w-full max-w-64"/>}
    {url&&attachment.kind==='video'&&<video aria-label={attachment.name} src={url} controls playsInline preload="metadata" className="max-h-64 max-w-full rounded-lg"/>}
    <button type="button" disabled={loading} className="text-xs underline break-all text-left" onClick={async()=>{const link=await load();if(link&&attachment.kind==='file'){const a=document.createElement('a');a.href=link;a.download=attachment.name;a.rel='noreferrer';a.click();}}}>{loading?'Loading...':`${attachment.kind==='file'?'Download':'Open'} ${attachment.name}`} ({Math.max(1,Math.ceil(attachment.size/1024))} KB)</button>
    {error&&<p className="text-xs">{error}</p>}
  </div>;
};


export const DraftAttachment:React.FC<{file:File;remove:()=>void}>=({file,remove})=>{
  const [url,setUrl]=useState('');
  useEffect(()=>{const next=URL.createObjectURL(file);setUrl(next);return()=>URL.revokeObjectURL(next);},[file]);
  return <div className="px-4 py-2 text-xs text-amber-300 shrink-0">
    <div className="flex gap-2"><span className="truncate flex-1">{file.name} ({Math.ceil(file.size/1024)} KB)</span><button aria-label="Remove attachment" onClick={remove}>Remove</button></div>
    {url&&file.type.startsWith('audio/')&&<audio src={url} controls className="w-full h-10 mt-1" aria-label="Preview voice message"/>}
    {url&&file.type.startsWith('image/')&&file.type!=='image/svg+xml'&&<img src={url} alt="Selected photo" className="max-h-20 mt-1 rounded object-contain"/>}
  </div>;
};
