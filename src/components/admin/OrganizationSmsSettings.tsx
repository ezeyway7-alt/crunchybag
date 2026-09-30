import React,{useEffect,useState} from 'react';
import {apiClient,extractErrorMessage} from '../../lib/api';
import {Input} from '../common/Input';
import {Button} from '../common/Button';

const empty={sms_enabled:false,sms_admin_numbers:'',sms_keyword:'',sms_shortcode:'',sms_sender:'',sms_public_base_url:'',sms_token_configured:false};
export const OrganizationSmsSettings:React.FC=()=>{
  const [value,setValue]=useState(empty),[token,setToken]=useState(''),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const load=async()=>{try{const result=await apiClient.get<any>('/organization/');setValue(Object.fromEntries(Object.keys(empty).map(key=>[key,result[key]??empty[key as keyof typeof empty]])) as typeof empty);setLoaded(true);setError('');}catch(e){setError(extractErrorMessage(e));}};
  useEffect(()=>{void load();},[]);
  const save=async()=>{
    setError('');setSaved(false);
    const numbers=value.sms_admin_numbers.split(/[,;\s]+/).filter(Boolean);
    if(numbers.some(number=>! /^(?:\+?977)?9[78]\d{8}$/.test(number))){setError('Enter valid Nepal mobile numbers separated by commas.');return;}
    if(value.sms_enabled && (!value.sms_sender.trim() || (!token.trim()&&!value.sms_token_configured))){setError('Sender identity and API token are required to enable SMS.');return;}
    if(value.sms_public_base_url){try{const url=new URL(value.sms_public_base_url);if(url.protocol!=='https:' || url.username || url.password || url.search || url.hash)throw Error();}catch{setError('Enter a valid public HTTPS URL.');return;}}
    setBusy(true);try{const {sms_token_configured,...payload}=value;const result=await apiClient.patch<any>('/organization/',{...payload,...(token.trim()?{sms_api_token:token.trim()}:{})});setValue({...value,sms_token_configured:!!result.sms_token_configured});setToken('');setSaved(true);}catch(e){setError(extractErrorMessage(e));}finally{setBusy(false);}
  };
  return <section aria-label="Sparrow SMS settings" className="border-t border-zinc-800 pt-4 space-y-3">
    <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-zinc-100">Sparrow SMS</h3><label className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={value.sms_enabled} disabled={!loaded||busy} onChange={e=>{setValue({...value,sms_enabled:e.target.checked});setSaved(false);}}/>Enable customer OTP</label></div>
    <p className="text-[11px] text-zinc-500">Signup and password/PIN recovery codes go to the customer?s mobile. Admin numbers, keyword, shortcode and link URL are stored for other SMS workflows.</p>
    <fieldset disabled={!loaded||busy} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {([['sms_admin_numbers','Admin Mobile Number(s)'],['sms_keyword','Keyword'],['sms_shortcode','ShortCode'],['sms_sender','Sender Identity (From)'],['sms_public_base_url','Public Base URL for 1-Click Link']] as const).map(([key,label])=><label key={key} className="block text-[11px] text-zinc-400">{label}<Input aria-label={label} value={value[key]} onChange={e=>{setValue({...value,[key]:e.target.value});setSaved(false);}} className="mt-1 h-9 text-xs"/></label>)}
      <label className="block text-[11px] text-zinc-400">Sparrow SMS API Token<Input type="password" autoComplete="new-password" aria-label="Sparrow SMS API Token" value={token} onChange={e=>{setToken(e.target.value);setSaved(false);}} placeholder={value.sms_token_configured?'Saved ? leave blank to keep':'Enter API token'} className="mt-1 h-9 text-xs"/></label>
    </fieldset>
    {error&&<p role="alert" className="text-xs text-rose-400">{error}{!loaded&&<button type="button" onClick={()=>void load()} className="ml-2 underline">Retry</button>}</p>}
    <div className="flex items-center justify-end gap-3">{saved&&<span role="status" className="text-xs text-emerald-400">SMS settings saved</span>}<Button type="button" size="sm" disabled={!loaded||busy} onClick={()=>void save()}>{busy?'Saving...':'Save SMS Settings'}</Button></div>
  </section>;
};
