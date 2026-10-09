/** One visitor analytics destination: PostHog. Business outcomes come from Django. */
import posthog, {type PostHog} from 'posthog-js';
import {DEFAULT_API_BASE} from './api';
import {onCLS,onINP,onLCP} from 'web-vitals';
let vitalsInstalled=false;
type Meta=Record<string,unknown>;
type Config={enabled:boolean;token:string;host:string;replay:boolean};
let outlet='',enabled=false,client:PostHog|undefined,loading:Promise<void>|undefined;
let activeConfig:Config|undefined;
let generation=0;
let attribution:Record<string,string>={};
let pending:{name:string;metadata:Meta;id:string;path:string}[]=[];
const instances=new Map<string,PostHog>();
const keys='utm_source utm_medium utm_campaign utm_content utm_term fbclid campaign_id campaign_name adset_id adset_name ad_id ad_name'.split(' ');
const fields=new Set('product_id product_name category payment_method provider error_category endpoint method metric network area fulfillment_type attempt_id quantity unit_price cart_value delivery_fee total duration_ms value scroll_percent status search_length result_count'.split(' '));
export const trackingAllowed=()=>typeof navigator!=='undefined'&&navigator.doNotTrack!=='1'&&!(navigator as any).globalPrivacyControl;
const path=()=>(location.pathname||'/').replace(/\/[0-9a-f-]{20,}(?=\/|$)/gi,'/:id').replace(/\/\d+(?=\/|$)/g,'/:id');
const clean=(value:unknown)=>{const text=String(value).slice(0,120);return /@|(?:\+?\d[\s().-]*){9,}|password|bearer |token=|secret=|cvv/i.test(text)?'[redacted]':text.replace(/[\x00-\x1f<>]/g,'');};
const identifier=(value:unknown)=>String(value).replace(/[^A-Za-z0-9_.-]/g,'').slice(0,200);
function sanitize(metadata:Meta):Meta{
  const result:Meta={};
  for(const [key,value] of Object.entries(metadata)){
    if(fields.has(key))result[key]=typeof value==='number'?(Number.isFinite(value)?Math.max(0,value):0):key.endsWith('_id')?identifier(value):key==='endpoint'?String(value).split(/[?#]/)[0]:clean(value);
    if(key==='items'&&Array.isArray(value))result.items=value.slice(0,100).map(item=>Object.fromEntries(['product_id','product_name','quantity','unit_price'].filter(k=>item[k]!=null).map(k=>[k,k==='product_id'?identifier(item[k]):typeof item[k]==='number'?item[k]:clean(item[k])])));
  }
  return result;
}
function anonymousId(){
  try{
    let visitor=JSON.parse(localStorage.getItem('crunchy_visitor')||'null');
    if(!visitor||visitor.expires<Date.now()){visitor={id:crypto.randomUUID(),expires:Date.now()+90*86400000};localStorage.setItem('crunchy_visitor',JSON.stringify(visitor));}
    return visitor.id as string;
  }catch{return null;}
}
export function trackingContext(){
  if(!enabled||!trackingAllowed()||!client)return null;
  const visitor_id=anonymousId();if(!visitor_id)return null;
  const session_id=client.get_session_id();
  return {visitor_id,session_id,posthog_session_id:session_id};
}
function capture(name:string,metadata:Meta,id:string,page:string){
  if(!client||!enabled||!trackingAllowed())return;
  // Only this function captures browser events. Autocapture/pageview/error SDK
  // collection is disabled, so a business interaction is never counted twice.
  client.capture(name==='page_view'?'$pageview':name,{...sanitize(metadata),...attribution,
    outlet_id:outlet,authority:'browser',event_id:id,$insert_id:id,path:page,
    $current_url:location.origin+page,$pathname:page,$referrer:attribution.referrer||'',
    $process_person_profile:false});
}
export function configureTracking(id:string,active:boolean){
  const next=active&&/^\d+$/.test(id)&&trackingAllowed();
  if(outlet!==id||!next){generation++;client?.stopSessionRecording();client?.opt_out_capturing();client=undefined;pending=[];loading=undefined;activeConfig=undefined;}
  outlet=id;enabled=next;
  if(!enabled)return;
  try{
    // Do not replay pre-migration custom batches into the new provider.
    sessionStorage.removeItem(`journey:queue:${id}`);
    const touch:Record<string,string>={};const params=new URLSearchParams(location.search);
    for(const key of keys)if(params.has(key))touch[key]=key.endsWith('_id')||key==='fbclid'?identifier(params.get(key)):clean(params.get(key));
    if(document.referrer&&new URL(document.referrer).origin!==location.origin)touch.referrer=new URL(document.referrer).hostname;
    const slot=`posthog:touch:${id}`,saved=JSON.parse(sessionStorage.getItem(slot)||'null');
    attribution=Object.keys(touch).length?touch:saved&&Date.now()-saved.last<1800000?saved.touch:{};
    sessionStorage.setItem(slot,JSON.stringify({touch:attribution,last:Date.now()}));
  }catch{attribution={};}
  if(client){updateReplay();return;}
  if(loading)return;
  const scope=generation;
  loading=(async()=>{
    try{
      const response=await fetch(`${DEFAULT_API_BASE}/customer/tracking-config/?outlet_id=${id}`,{credentials:'omit'});
      if(!response.ok)return;
      const config:Config=await response.json();
      if(scope!==generation||!enabled||!trackingAllowed()||!config.enabled)return;
      const visitor=anonymousId();if(!visitor)return;
      const instanceKey=`outlet_${id}_${config.token}`;
      client=instances.get(instanceKey);
      if(!client){
        client=posthog.init(config.token,{
          api_host:config.host,person_profiles:'never',autocapture:false,capture_pageview:false,
          capture_pageleave:false,capture_dead_clicks:false,capture_exceptions:false,capture_performance:false,
          disable_session_recording:true,enable_recording_console_log:false,
          advanced_disable_feature_flags:true,disable_surveys:true,
          persistence:'localStorage',respect_dnt:true,ip:false,
          bootstrap:{distinctID:`outlet-${id}:${visitor}`,isIdentifiedID:false},
          session_recording:{maskAllInputs:true,maskTextSelector:'*',
            blockSelector:'img,video,canvas,iframe,input[type="file"],input[type="hidden"],[data-analytics-private],.ph-no-capture',
            maskAttributeFn:(name,value)=>['class','style','width','height','type','role'].includes(name)?value:'',
            recordHeaders:false,recordBody:false,maskCapturedNetworkRequestFn:()=>null},
          before_send:(event)=>{
            if(!enabled||!trackingAllowed()||scope!==generation)return null;
            if(['order_success','order_confirmed','payment_success','$autocapture','$identify','$set'].includes(event.event))return null;
            for(const key of Object.keys(event.properties)){
              if(/url|referrer|pathname/i.test(key)&&typeof event.properties[key]==='string'){
                try{const url=new URL(event.properties[key],location.origin);event.properties[key]=key.includes('pathname')?url.pathname:url.origin+url.pathname;}catch{delete event.properties[key];}
              }
            }
            // No person properties or automatically collected campaign query strings.
            delete event.$set;delete event.$set_once;
            return event;
          }
        },instanceKey);
        if(client)instances.set(instanceKey,client);
      }
      client?.opt_in_capturing({captureEventName:false});
      activeConfig=config;updateReplay();
      for(const event of pending.splice(0))capture(event.name,event.metadata,event.id,event.path);
    }catch{/* Ordering must keep working when analytics is unavailable. */}
    finally{if(scope===generation)loading=undefined;}
  })();
}
function updateReplay(){
  const sensitive=/^\/(admin|profile|orders|track|auth|login|signup)(\/|$)/.test(location.pathname);
  if(activeConfig?.replay&&!sensitive)client?.startSessionRecording();else client?.stopSessionRecording();
}
export function trackEvent(name:string,metadata:Meta={},eventId?:string){
  if(!enabled||!trackingAllowed()||['order_success','order_confirmed','payment_success'].includes(name))return;
  const event={name,metadata:sanitize(metadata),id:eventId||crypto.randomUUID(),path:path()};
  if(client)capture(event.name,event.metadata,event.id,event.path);
  else if(loading){pending.push(event);if(pending.length>150)pending.shift();}
}
export async function flushTracking(_beacon=false){await loading;}

export function cartMetadata(cart:any):Meta {
  return {cart_value:cart.finalTotal,items:cart.items.map((item:any)=>({product_id:item.productId,product_name:item.productName,quantity:item.quantity,unit_price:item.unitPrice}))};
}

export function installJourneyListeners() {
  const scrolls=new Set<number>();
  const scroll=()=>{const depth=Math.round((window.scrollY+innerHeight)/Math.max(document.documentElement.scrollHeight,1)*100);for(const value of [25,50,75,100])if(depth>=value&&!scrolls.has(value)){scrolls.add(value);trackEvent('scroll',{scroll_percent:value});}};
  const exit=()=>{trackEvent('exit');void flushTracking(true);};
  const visibility=()=>{if(document.visibilityState==='hidden')void flushTracking(true);};
  const back=(event:PopStateEvent)=>{if(event.isTrusted)trackEvent('back_navigation');};
  const failure=(event:globalThis.Event)=>trackEvent(event.target instanceof HTMLImageElement?'image_error':'javascript_error',{error_category:event.target instanceof HTMLImageElement?'image_load':'uncaught_exception'});
  const rejection=()=>trackEvent('javascript_error',{error_category:'unhandled_rejection'});
  const api=(event:globalThis.Event)=>{const row=(event as CustomEvent).detail;trackEvent(row.status===0?'network_error':row.status>=400?'api_error':'api_timing',row);};
  const click=(event:MouseEvent)=>{const node=(event.target as Element)?.closest?.('[data-analytics],a[href^="tel:"],a[href*="wa.me"]');if(!node)return;const name=node.getAttribute('data-analytics') || (node.getAttribute('href')?.startsWith('tel:')?'call_click':'whatsapp_click');trackEvent(name);};
  window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('pagehide',exit);window.addEventListener('popstate',back);
  document.addEventListener('visibilitychange',visibility);window.addEventListener('error',failure,true);window.addEventListener('unhandledrejection',rejection);
  window.addEventListener('journey:api',api);document.addEventListener('click',click);
  const heartbeat=setInterval(()=>{if(document.visibilityState==='visible')trackEvent('heartbeat');},60000);
  if(!vitalsInstalled){
    vitalsInstalled=true;
    const record=(metric:{name:string;value:number})=>trackEvent('performance',{metric:metric.name,value:metric.value});
    onCLS(record,{reportAllChanges:true});onINP(record,{reportAllChanges:true});onLCP(record,{reportAllChanges:true});
  }
  const navigation=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
  if(navigation){trackEvent('performance',{metric:'DOM',value:navigation.domContentLoadedEventEnd});if(navigation.loadEventEnd)trackEvent('performance',{metric:'load',value:navigation.loadEventEnd});}
  return()=>{clearInterval(heartbeat);window.removeEventListener('scroll',scroll);window.removeEventListener('pagehide',exit);window.removeEventListener('popstate',back);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('error',failure,true);window.removeEventListener('unhandledrejection',rejection);window.removeEventListener('journey:api',api);document.removeEventListener('click',click);};
}
