import {test, expect, Page} from '@playwright/test';
test.setTimeout(60000);
async function setup(page:Page,signedIn=false,staff=false){
 await page.clock.setFixedTime(new Date('2026-10-10T06:00:00Z'));
 const user={id:91,username:staff?'Manager':'Customer',role:staff?'BRANCH_MANAGER':'CUSTOMER',is_active:true,outlet_id:2};
 const outlet={id:2,name:'Outlet Two',branch_code:'TWO',accepting_orders:true};
 const conversation:any={id:'11111111-1111-4111-8111-111111111111',outlet_id:signedIn?2:1,outlet_name:signedIn?'Outlet Two':'Main Outlet',customer_name:'Guest',is_guest:!signedIn,last_message_id:0,unread_count:0,customer_read_id:0,staff_read_id:0};
 const state:any={messages:[],sockets:[],sends:[],starts:[],reads:[],typing:[],fail:false,conversation};
 if(signedIn)await page.addInitScript(({user,outlet})=>{localStorage.setItem('crunchy_access_token','test-access');localStorage.setItem('crunchy_refresh_token','test-refresh');localStorage.setItem('crunchy_auth_user',JSON.stringify(user));localStorage.setItem('crunchy_auth_outlet',JSON.stringify(outlet));},{user,outlet});
 await page.addInitScript(()=>{document.cookie='csrftoken=abcdefghijklmnopqrstuvwx12345678; path=/';});
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.routeWebSocket('**/ws/**',socket=>{if(socket.url().includes('/ws/chat/')){state.sockets.push(socket);socket.onMessage(raw=>{const event=JSON.parse(String(raw));if(event.type==='typing')state.typing.push(event);else socket.send(JSON.stringify({event_type:'HEARTBEAT',revision:state.messages.length}));});}});
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace('/api/v1/','');let body:any={};try{body=req.postDataJSON()||{};}catch{}
  let attachment:any=null;
  if(req.headers()['content-type']?.startsWith('multipart/form-data')){
    const form=await new Response(req.postDataBuffer(),{headers:{'Content-Type':req.headers()['content-type']}}).formData();
    body={client_id:form.get('client_id'),text:form.get('text')};
    const file=form.get('file') as File;attachment={name:file.name,size:file.size,mime:file.type,kind:file.type.startsWith('audio/')?'audio':file.type.startsWith('image/')?'image':file.type.startsWith('video/')?'video':'file'};
  }
  let result:any={};
  if(path==='auth/me/')result=user;
  else if(path.includes('branches'))result=[outlet];
  else if(path==='catalog/menu/')result={categories:[]};
  else if(path==='chat/start/'){state.starts.push({body,guest:req.headers()['x-chat-guest']});result={conversation,messages:state.messages,has_more:false};}
  else if(path.includes('chat/')&&path.endsWith('socket-ticket/'))result={ticket:'test-ticket',path:'/ws/chat/'};
  else if(path.includes('chat/')&&path.endsWith('/attachment/'))result={url:'/api/v1/chat/files/?ticket=test',expires_in:600};
  else if(path==='chat/staff/')result={results:[{...conversation,last_message:state.messages.at(-1),unread_count:1}],unread_count:1,has_more:false};
  else if(path.includes('chat/')&&path.endsWith('/messages/')){
   if(req.method()==='POST'){
    state.sends.push(body);
    if(state.fail){await route.fulfill({status:503,json:{detail:'Temporarily offline'}});return;}
    result={...body,attachment,id:state.messages.length+1,is_staff:staff,created_at:'2026-10-10T06:00:00Z',conversation_id:conversation.id};state.messages.push(result);conversation.last_message_id=result.id;
   }else {const catchingUp=new URL(req.url()).searchParams.has('after');const after=Number(new URL(req.url()).searchParams.get('after')||0);const rows=catchingUp?state.messages.filter((m:any)=>m.id>after):state.messages;result={conversation,messages:catchingUp?rows.slice(0,100):rows.slice(-50),has_newer:catchingUp?rows.length>100:false,has_more:!catchingUp&&rows.length>50};}
  }else if(path.includes('chat/')&&path.endsWith('/read/')){state.reads.push(body);if(staff)conversation.staff_read_id=body.last_message_id;else conversation.customer_read_id=body.last_message_id;result={ok:true};}
  else if(path==='orders/pos/meta/')result={outlet_id:2,outlet_name:'Outlet Two',permissions:{orders:true},tables:[],fulfillment_modes:['TAKEAWAY'],payment_methods:['CASH']};
  else if(path.includes('dashboard'))result={results:[],summary:{},count:0};
  await route.fulfill({json:result});
 });
 await page.goto('/');await page.getByRole('button',{name:'Open messages',exact:true}).click();
 return state;
}

test('guest sends privately, receives reply via websocket and reads it',async({page})=>{
 const state=await setup(page);
 await expect(page.getByRole('textbox',{name:'Message',exact:true})).toBeVisible();
 expect(state.starts[0].guest).toMatch(/^[a-f0-9]{64}$/);
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('Can you help with delivery?');
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await expect(page.getByText('Can you help with delivery?',{exact:true})).toBeVisible();
 expect(state.sends).toHaveLength(1);
 await expect.poll(()=>state.sockets.length).toBeGreaterThan(0);
 state.messages.push({id:2,client_id:'reply',conversation_id:state.conversation.id,is_staff:true,text:'Yes, where would you like delivery?',created_at:'2026-10-10T06:00:00Z'});
 state.conversation.last_message_id=2;state.conversation.unread_count=1;
 state.sockets.at(-1).send(JSON.stringify({event_type:'CHAT_MESSAGE'}));
 await expect(page.getByText('Yes, where would you like delivery?',{exact:true})).toBeVisible();
 await expect.poll(()=>state.reads.some((r:any)=>r.last_message_id===2)).toBe(true);
 await expect(page.getByRole('dialog',{name:'Chat with CrunchyBag'})).toHaveScreenshot('guest-chat.png',{maxDiffPixelRatio:.05});
});

test('failed send retries same client id and guest identity survives reload',async({page})=>{
 const state=await setup(page);state.fail=true;
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('One question');await page.getByRole('button',{name:'Send message',exact:true}).click();
 await expect(page.getByRole('button',{name:'Not confirmed - tap to retry'})).toBeVisible();
 const key=state.sends[0].client_id,credential=state.starts[0].guest;
 await page.reload();await page.getByRole('button',{name:'Open messages',exact:true}).click();
 state.fail=false;await page.getByRole('button',{name:'Not confirmed - tap to retry'}).click();
 await expect.poll(()=>state.messages.length).toBe(1);expect(state.sends.at(-1).client_id).toBe(key);expect(state.starts.at(-1).guest).toBe(credential);
});

test('signed-in customer starts with their account outlet',async({page})=>{
 const state=await setup(page,true);
 await expect(page.getByRole('textbox',{name:'Message',exact:true})).toBeVisible();
 expect(state.starts[0].body.outlet_id).toBe('2');expect(state.starts[0].guest).toBeUndefined();
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('<script>alert(1)</script>');await page.getByRole('button',{name:'Send message',exact:true}).click();
 await expect(page.getByText('<script>alert(1)</script>',{exact:true})).toBeVisible();
});

test('staff inbox opens a conversation and replies',async({page})=>{
 const state=await setup(page,true,true);
 await page.getByRole('button',{name:/Guest/}).last().click();
 await expect(page.getByRole('textbox',{name:'Message',exact:true})).toBeVisible();
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('How can we help?');await page.getByRole('button',{name:'Send message',exact:true}).click();
 await expect(page.getByText('How can we help?',{exact:true})).toBeVisible();expect(state.messages[0].is_staff).toBe(true);
});


test('mobile chat fits a narrow phone viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await setup(page);
 const dialog=page.getByRole('dialog',{name:'Chat with CrunchyBag'});
 await expect(page.getByRole('textbox',{name:'Message',exact:true})).toBeVisible();
 const box=await dialog.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(390);
 await expect(dialog).toHaveScreenshot('mobile-chat.png');
});

test('live catch-up fetches multiple pages without skipping messages',async({page})=>{
 const state=await setup(page);
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('Start');await page.getByRole('button',{name:'Send message',exact:true}).click();
 await expect(page.getByText('Start',{exact:true})).toBeVisible();
 for(let id=2;id<=136;id++)state.messages.push({id,client_id:`reply-${id}`,conversation_id:state.conversation.id,is_staff:true,text:`Reply number ${id}`,created_at:'2026-10-10T06:00:00Z'});
 state.conversation.last_message_id=136;
 await expect.poll(()=>state.sockets.length).toBeGreaterThan(0);
 state.sockets.at(-1).send(JSON.stringify({event_type:'CHAT_MESSAGE'}));
 await expect(page.getByText('Reply number 136',{exact:true})).toBeVisible();
 await expect(page.getByText('Reply number 50',{exact:true})).toHaveCount(1);
 await expect(page.getByText('Reply number 101',{exact:true})).toHaveCount(1);
});


test('typing is scoped to the selected thread and stops after send',async({page})=>{
 const state=await setup(page);
 await expect.poll(()=>state.sockets.length).toBeGreaterThan(0);
 const socket=state.sockets.at(-1);
 socket.send(JSON.stringify({event_type:'CHAT_TYPING',conversation_id:'someone-else',is_staff:true,is_typing:true}));
 await expect(page.getByText('CrunchyBag team is typing...')).toHaveCount(0);
 socket.send(JSON.stringify({event_type:'CHAT_TYPING',conversation_id:state.conversation.id,is_staff:true,is_typing:true}));
 await expect(page.getByText('CrunchyBag team is typing...')).toBeVisible();
 socket.send(JSON.stringify({event_type:'CHAT_TYPING',conversation_id:state.conversation.id,is_staff:true,is_typing:false}));
 await expect(page.getByText('CrunchyBag team is typing...')).toHaveCount(0);
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('Hello');
 await expect.poll(()=>state.typing.some((e:any)=>e.is_typing&&e.conversation_id===state.conversation.id)).toBe(true);
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await expect.poll(()=>state.typing.at(-1)?.is_typing).toBe(false);
});


test('typing remains visible when a long conversation is scrolled up',async({page})=>{
 const state=await setup(page);
 await expect.poll(()=>state.sockets.length).toBeGreaterThan(0);
 state.messages=Array.from({length:30},(_,i)=>({id:i+1,client_id:`m-${i}`,conversation_id:state.conversation.id,is_staff:true,text:`Long history message ${i}`,created_at:'2026-10-10T06:00:00Z'}));
 state.sockets.at(-1).send(JSON.stringify({event_type:'CHAT_MESSAGE'}));
 await expect(page.getByText('Long history message 29',{exact:true})).toBeVisible();
 await page.getByRole('log').evaluate(el=>{el.scrollTop=0;});
 state.sockets.at(-1).send(JSON.stringify({event_type:'CHAT_TYPING',conversation_id:state.conversation.id,is_staff:true,is_typing:true}));
 await expect(page.getByRole('status').filter({hasText:'CrunchyBag team is typing...'})).toBeInViewport();
});


test('PDF upload retries once with the original file after reload',async({page})=>{
 const state=await setup(page);state.fail=true;
 await page.getByLabel('Choose attachment',{exact:true}).setInputFiles({name:'receipt.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 receipt')});
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await expect(page.getByRole('button',{name:'Not confirmed - tap to retry'})).toBeVisible();
 const key=state.sends[0].client_id;
 await page.reload();await page.getByRole('button',{name:'Open messages',exact:true}).click();state.fail=false;
 await page.getByRole('button',{name:'Not confirmed - tap to retry'}).click();
 await expect(page.getByRole('button',{name:/Download receipt.pdf/})).toBeVisible();
 expect(state.messages).toHaveLength(1);expect(state.messages[0].attachment.name).toBe('receipt.pdf');expect(state.sends.at(-1).client_id).toBe(key);
});

test('staff can send an audio attachment without a text caption',async({page})=>{
 const state=await setup(page,true,true);await page.getByRole('button',{name:/Guest/}).last().click();
 await page.getByLabel('Choose attachment',{exact:true}).setInputFiles({name:'Voice.m4a',mimeType:'audio/mp4',buffer:Buffer.from('audio fixture')});
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await expect(page.getByRole('button',{name:/Open Voice.m4a/})).toBeVisible();
 expect(state.messages[0].attachment.kind).toBe('audio');expect(state.messages[0].is_staff).toBe(true);
});


test('recording stops the microphone and creates a reviewable voice attachment',async({page})=>{
 await page.addInitScript(()=>{
   const stream={getTracks:()=>[{stop:()=>{(window as any).micStopped=true;}}]};
   Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>stream},configurable:true});
   class Recorder {
     static isTypeSupported(){return true;}
     state='inactive';mimeType='audio/webm';ondataavailable:any;onstop:any;onerror:any;
     start(){this.state='recording';}
     stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['voice fixture'],{type:'audio/webm'})});this.onstop?.();}
   }
   (window as any).MediaRecorder=Recorder;
 });
 const state=await setup(page);
 await page.getByRole('button',{name:'Record voice message',exact:true}).click();
 await page.getByRole('button',{name:'Stop recording',exact:true}).click();
 await expect(page.getByLabel('Preview voice message')).toBeVisible();
 expect(await page.evaluate(()=>(window as any).micStopped)).toBe(true);
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await expect.poll(()=>state.messages.length).toBe(1);
 expect(state.messages[0].attachment.kind).toBe('audio');
});
