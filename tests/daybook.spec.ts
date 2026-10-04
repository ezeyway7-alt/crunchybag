import {test, expect, Page} from '@playwright/test';

const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kathmandu',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

async function setup(page:Page) {
  const user={id:1,username:'Daybook owner',role:'RESTAURANT_OWNER',outlet_id:1,is_active:true};
  const outlet={id:1,name:'Real outlet',branch_code:'REAL'};
  const state:any={entries:[],writes:[],responses:{},nextId:1,sockets:[],loseResponse:false,payments:[
    {id:1,order_number:'POS-01',customer:'Customer one',source:'POS',amount:'150.00',payment_method:'CASH',transaction_id:'PAY-CASH',created_at:new Date().toISOString(),kind:'SALE'},
    {id:2,order_number:'POS-01',customer:'Customer one',source:'POS',amount:'50.00',payment_method:'FONEPAY',transaction_id:'PAY-QR',created_at:new Date().toISOString(),kind:'SALE'},
    {id:3,order_number:'W-02',customer:'Customer two',source:'WEBSITE',amount:'80.00',payment_method:'FONEPAY',transaction_id:'PAY-WEB',created_at:new Date().toISOString(),kind:'SALE'},
    {id:4,order_number:'POS-01',customer:'Customer one',source:'POS',amount:'20.00',payment_method:'CASH',transaction_id:'REF-CASH',created_at:new Date().toISOString(),kind:'REFUND'},
  ]};
  await page.addInitScript(({user,outlet})=>{
    localStorage.setItem('crunchy_access_token','test-token');
    localStorage.setItem('crunchy_auth_user',JSON.stringify(user));
    localStorage.setItem('crunchy_auth_outlet',JSON.stringify(outlet));
    document.cookie='csrftoken=abcdefghijklmnopqrstuvwx12345678; path=/';
  },{user,outlet});
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.routeWebSocket('**/ws/**',socket=>{
    if(socket.url().includes('/daybook/')){
      state.sockets.push(socket);
      socket.onMessage(()=>socket.send(JSON.stringify({event_type:'HEARTBEAT',revision:String(state.entries.length)})));
    }
  });
  const entry=(body:any)=>({id:state.nextId++,date:today(),party:'',reference:'',source:'MANUAL',recorded_by:user.username,
    created_at:new Date().toISOString(),voided_at:null,voided_by:null,void_reason:'',...body});
  await page.route('**/api/v1/**',async route=>{
    const req=route.request(),url=new URL(req.url()),path=url.pathname;
    let data:any={};
    if(path.endsWith('/auth/me/'))data=user;
    else if(path.includes('/branches'))data=[outlet];
    else if(path.includes('/organization'))data={name:'Real restaurant'};
    else if(path.endsWith('/customer/profile/'))data={favorites:[],member_since:'2026-01-01'};
    else if(path.endsWith('/customer/orders/'))data={results:[]};
    else if(path.endsWith('/catalog/menu/'))data={categories:[]};
    else if(path==='/api/v1/daybook/socket-ticket/')data={ticket:'signed',path:'/ws/daybook/1/'};
    else if(path.startsWith('/api/v1/daybook/')){
      if(req.method()==='POST'){
        const body=req.postDataJSON(),key=req.headers()['idempotency-key'];
        state.writes.push({path,body,key});
        if(state.responses[key])data=state.responses[key];
        else {
          if(path.endsWith('/import/')){
            let created=0,skipped=0;
            for(const id of body.payment_ids){
              if(state.entries.some((e:any)=>e.payment_id===id)){skipped++;continue;}
              const payment=state.payments.find((p:any)=>p.id===id);
              state.entries.push(entry({date:body.date,direction:body.kind==='SALE'?'IN':'OUT',amount:payment.amount,
                payment_method:payment.payment_method,category:body.kind==='SALE'?'Sales received':'Sales refund',
                description:`Payment for order ${payment.order_number}`,reference:payment.transaction_id,source:body.kind,payment_id:id}));created++;
            }
            data={created,skipped,date:body.date};
          }else if(path.endsWith('/void/')){
            const id=Number(path.split('/').at(-3));
            data=state.entries.find((e:any)=>e.id===id);
            Object.assign(data,{voided_at:new Date().toISOString(),voided_by:user.username,void_reason:body.reason});
          }else{data=entry(body);state.entries.push(data);}
          state.responses[key]=data;
        }
        if(state.loseResponse){state.loseResponse=false;await route.abort('failed');return;}
      }else if(path.endsWith('/import/')){
        const kind=url.searchParams.get('kind')||'SALE';
        const results=state.payments.filter((p:any)=>p.kind===kind).map((p:any)=>({...p,
          imported:state.entries.some((e:any)=>e.payment_id===p.id),voided:state.entries.some((e:any)=>e.payment_id===p.id&&e.voided_at)}));
        data={date:url.searchParams.get('date'),kind,results,count:results.length,truncated:false};
      }else{
        const date=url.searchParams.get('date')||today();
        const active=state.entries.filter((e:any)=>!e.voided_at);
        const sum=(rows:any[],direction:string)=>rows.filter(e=>e.direction===direction).reduce((n,e)=>n+Number(e.amount),0);
        const before=active.filter((e:any)=>e.date<date),day=active.filter((e:any)=>e.date===date);
        const opening=sum(before,'IN')-sum(before,'OUT'),income=sum(day,'IN'),expense=sum(day,'OUT');
        const cashBefore=before.filter((e:any)=>e.payment_method==='CASH'),cashDay=day.filter((e:any)=>e.payment_method==='CASH');
        const cashOpening=sum(cashBefore,'IN')-sum(cashBefore,'OUT'),cashIn=sum(cashDay,'IN'),cashOut=sum(cashDay,'OUT');
        let rows=state.entries.filter((e:any)=>e.date===date&&(url.searchParams.get('include_voided')==='true'||!e.voided_at));
        if(url.searchParams.get('direction')!=='ALL')rows=rows.filter((e:any)=>e.direction===url.searchParams.get('direction'));
        if(url.searchParams.get('payment_method')!=='ALL')rows=rows.filter((e:any)=>e.payment_method===url.searchParams.get('payment_method'));
        if(url.searchParams.get('search'))rows=rows.filter((e:any)=>JSON.stringify(e).toLowerCase().includes(url.searchParams.get('search')!.toLowerCase()));
        data={date,results:[...rows].reverse(),count:rows.length,page:1,page_size:25,can_void:true,
          summary:Object.fromEntries(Object.entries({opening,income,expense,net:income-expense,closing:opening+income-expense,
            cash_opening:cashOpening,cash_in:cashIn,cash_out:cashOut,cash_closing:cashOpening+cashIn-cashOut}).map(([k,v])=>[k,Number(v).toFixed(2)]))};
      }
    }
    await route.fulfill({json:data});
  });
  await page.goto('/admin?tab=daybook', {waitUntil:'domcontentloaded'});
  await expect(page.getByTestId('daybook-page').getByRole('heading',{name:'Daybook',exact:true})).toBeVisible();
  return state;
}

async function manual(page:Page,direction:'in'|'out',amount:string,note:string) {
  await page.getByRole('button',{name:`Money ${direction}`,exact:true}).click();
  await page.getByLabel('Entry amount',{exact:true}).fill(amount);
  await page.getByLabel('Entry description',{exact:true}).fill(note);
  await page.getByRole('button',{name:'Save entry',exact:true}).click();
}

test('daybook starts empty, persists money in and cash out, and audits corrections',async({page})=>{
  const state=await setup(page);
  await expect(page.getByText('No entries for these filters',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Daybook date',{exact:true})).toHaveValue(today());
  await manual(page,'in','1000','Starting cash');
  await expect(page.getByTestId('daybook-income')).toContainText('1,000');
  await manual(page,'out','250','Cash taken by manager');
  await expect(page.getByTestId('daybook-cash_closing')).toContainText('750');
  expect(state.entries.map((e:any)=>e.direction)).toEqual(['IN','OUT']);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.getByText('Cash taken by manager',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Void entry DB-2',exact:true}).click();
  await page.getByLabel('Void reason',{exact:true}).fill('Incorrect amount; replacing entry');
  await page.getByRole('button',{name:'Void entry',exact:true}).click();
  await expect(page.getByTestId('daybook-cash_closing')).toContainText('1,000');
  await page.getByRole('checkbox',{name:'Show voided entries',exact:true}).check();
  await expect(page.getByText('Voided',{exact:true})).toBeVisible();
  await expect(page.getByText(/Incorrect amount; replacing entry/)).toBeVisible();
});

test('sales import selects all by default, honors unticked sales, and prevents repeated imports',async({page})=>{
  const state=await setup(page);
  await page.getByRole('button',{name:"Import today's sales",exact:true}).click();
  for(const id of ['PAY-CASH','PAY-QR','PAY-WEB'])await expect(page.getByRole('checkbox',{name:`Select payment ${id}`,exact:true})).toBeChecked();
  await page.getByRole('checkbox',{name:'Select payment PAY-WEB',exact:true}).uncheck();
  await page.getByRole('button',{name:'Import 2 selected',exact:true}).click();
  await expect(page.getByTestId('daybook-income')).toContainText('200');
  expect(state.writes.find((w:any)=>w.path.endsWith('/import/')).body.payment_ids).toEqual([1,2]);
  await page.getByRole('button',{name:"Import today's sales",exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Select payment PAY-CASH',exact:true})).toBeDisabled();
  await expect(page.getByRole('checkbox',{name:'Select payment PAY-QR',exact:true})).toBeDisabled();
  await expect(page.getByRole('checkbox',{name:'Select payment PAY-WEB',exact:true})).toBeChecked();
  await page.getByRole('button',{name:'Import 1 selected',exact:true}).click();
  await expect(page.getByTestId('daybook-income')).toContainText('280');
  await page.getByRole('button',{name:'Import refunds',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Select payment REF-CASH',exact:true})).toBeChecked();
  await page.getByRole('button',{name:'Import 1 selected',exact:true}).click();
  await expect(page.getByTestId('daybook-expense')).toContainText('20');
  await expect(page.getByTestId('daybook-closing')).toContainText('260');
  await page.screenshot({path:test.info().outputPath('daybook.png'),fullPage:true});
});

test('lost save response retries the same entry without duplicate cash movement',async({page})=>{
  const state=await setup(page);
  state.loseResponse=true;
  await manual(page,'out','75','Cash withdrawal with retry');
  await page.getByRole('button',{name:'Retry pending entry',exact:true}).last().click();
  await expect(page.getByTestId('daybook-expense')).toContainText('75');
  expect(state.entries).toHaveLength(1);
  expect(state.writes).toHaveLength(2);
  expect(state.writes[0].key).toBe(state.writes[1].key);
});

test('live daybook updates preserve import selections without navigating',async({page})=>{
  const state=await setup(page);
  await page.getByRole('button',{name:"Import today's sales",exact:true}).click();
  await page.getByRole('checkbox',{name:'Select payment PAY-WEB',exact:true}).uncheck();
  let navigations=0;page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
  await expect.poll(()=>state.sockets.length).toBeGreaterThan(0);
  state.sockets.at(-1).send(JSON.stringify({event_type:'DAYBOOK_CREATE',event_id:'external-entry'}));
  await expect(page.getByRole('checkbox',{name:'Select payment PAY-WEB',exact:true})).not.toBeChecked();
  await expect(page.getByRole('checkbox',{name:'Select payment PAY-CASH',exact:true})).toBeChecked();
  expect(navigations).toBe(0);
});
