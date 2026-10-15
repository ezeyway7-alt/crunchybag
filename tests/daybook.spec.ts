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
  state.attendance={};
  state.attendanceFail=false;
  state.khaja={products:[{id:'momo',name:'Veg Momo',category:'Snacks',archived:false},{id:'tea',name:'Milk Tea',category:'Drinks',archived:false},{id:'chowmein',name:'Chowmein',category:'Snacks',archived:false}],days:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((name,weekday)=>({name,weekday,revision:0,products:[],updated_at:null,updated_by:null}))};
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
    else if(path==='/api/v1/daybook/staff/')data=[{id:2,name:'Asha',active:true},{id:3,name:'Bikash',active:true},{id:4,name:'Former staff',active:false}];
    else if(path==='/api/v1/daybook/attendance/'){
      if(req.method()==='POST'){
        if(state.attendanceFail){state.attendanceFail=false;await route.fulfill({status:400,json:{detail:'Attendance could not be saved'}});return;}
        const body=req.postDataJSON();state.writes.push({path,body});
        const key=`${body.year}:${body.month}:${body.staff_id}:${body.day}`;
        data={status:body.status,revision:(state.attendance[key]?.revision||0)+1,updated_at:new Date().toISOString(),updated_by:user.username};
        state.attendance[key]=data;
      }else{
        const year=Number(url.searchParams.get('year')||2083),month=Number(url.searchParams.get('month')||6);
        const days=Array.from({length:30},(_,i)=>({day:i+1,date:`2026-10-${String(i+1).padStart(2,'0')}`,weekday:'Thu',today:year===2083&&month===6&&i===28,future:year>2083||(year===2083&&(month>6||(month===6&&i>28)))}));
        data={year,month,month_name:'Ashwin',months:['Baisakh','Jestha','Ashadh','Shrawan','Bhadra','Ashwin','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra'],min_year:1975,max_year:2100,today:{year:2083,month:6,day:29},days,total_days:30,
          staff:[{id:2,name:'Asha'},{id:3,name:'Bikash'}].map(staff=>{
            const cells=Object.fromEntries(days.filter(d=>state.attendance[`${year}:${month}:${staff.id}:${d.day}`]).map(d=>[String(d.day),state.attendance[`${year}:${month}:${staff.id}:${d.day}`]]));
            const values=Object.values(cells) as any[],half_days=values.filter(c=>['FIRST_HALF','SECOND_HALF'].includes(c.status)).length;
            const present=values.filter(c=>c.status==='PRESENT').length+half_days/2,absent=values.filter(c=>c.status==='ABSENT').length+half_days/2;
            return {...staff,active:true,cells,present,absent,half_days,unmarked:days.filter(d=>!d.future).length-present-absent};
          })};
      }
    }
    else if(path==='/api/v1/daybook/khaja-schedule/'){
      if(req.method()==='POST'){
        const body=req.postDataJSON();
        state.writes.push({path,body});
        const day=state.khaja.days[body.weekday];
        day.products=state.khaja.products.filter((p:any)=>body.product_ids.includes(p.id));
        day.revision++;day.updated_at=new Date().toISOString();day.updated_by=user.username;
      }
      data=state.khaja;
    }
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
        const scoped=state.entries.filter((e:any)=>(url.searchParams.get('staff_only')!=='true'||e.staff_id)&&(!url.searchParams.get('staff_id')||String(e.staff_id)===url.searchParams.get('staff_id')));
        const active=scoped.filter((e:any)=>!e.voided_at);
        const sum=(rows:any[],direction:string)=>rows.filter(e=>e.direction===direction).reduce((n,e)=>n+Number(e.amount),0);
        const before=active.filter((e:any)=>e.date<date),day=active.filter((e:any)=>e.date===date);
        const opening=sum(before,'IN')-sum(before,'OUT'),income=sum(day,'IN'),expense=sum(day,'OUT');
        const cashBefore=before.filter((e:any)=>e.payment_method==='CASH'),cashDay=day.filter((e:any)=>e.payment_method==='CASH');
        const cashOpening=sum(cashBefore,'IN')-sum(cashBefore,'OUT'),cashIn=sum(cashDay,'IN'),cashOut=sum(cashDay,'OUT');
        let rows=scoped.filter((e:any)=>e.date===date&&(url.searchParams.get('include_voided')==='true'||!e.voided_at));
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


test('staff daybook selects outlet staff, records Dr and Cr, and isolates balances',async({page})=>{
  const state=await setup(page);
  await page.getByRole('navigation',{name:'Daybook sections'}).getByRole('button',{name:'Staff Daybook',exact:true}).click();
  await expect(page.getByRole('button',{name:'Dr - Staff takes',exact:true})).toBeDisabled();
  await page.getByLabel('Outlet staff',{exact:true}).selectOption('2');
  for(const [button,amount,note] of [['Dr - Staff takes','500','Asha takes advance'],['Cr - Staff gives','100','Asha returns change']]){
    await page.getByRole('button',{name:button,exact:true}).click();
    await page.getByLabel('Entry amount',{exact:true}).fill(amount);
    await page.getByLabel('Entry description',{exact:true}).fill(note);
    await page.getByRole('button',{name:'Save entry',exact:true}).click();
    await expect(page.getByRole('table').getByText(note,{exact:true})).toBeVisible();
  }
  await expect(page.getByTestId('daybook-closing')).toContainText('400');
  expect(state.writes.map((w:any)=>[w.body.staff_id,w.body.direction])).toEqual([[2,'OUT'],[2,'IN']]);
  await page.screenshot({path:test.info().outputPath('staff-daybook.png'),fullPage:true});
  await page.getByLabel('Outlet staff',{exact:true}).selectOption('3');
  await expect(page.getByText('No entries for these filters',{exact:true})).toBeVisible();
  await expect(page.getByTestId('daybook-closing')).toContainText('0');
  await page.getByLabel('Outlet staff',{exact:true}).selectOption('4');
  await expect(page.getByRole('button',{name:'Dr - Staff takes',exact:true})).toBeDisabled();
  await page.getByRole('navigation',{name:'Daybook sections'}).getByRole('button',{name:'Daybook',exact:true}).click();
  await expect(page.getByText('Asha takes advance',{exact:true})).toBeVisible();
  await expect(page.getByTestId('daybook-closing')).toContainText('-400');
});


test('khaja weekly table supports multiple products, editing, clearing and reload',async({page})=>{
  const state=await setup(page);
  const open=()=>page.getByRole('navigation',{name:'Daybook sections'}).getByRole('button',{name:'Khaja Schedule',exact:true}).click();
  await open();
  const table=page.getByRole('table',{name:'Weekly khaja schedule'});
  await expect(table.getByRole('row')).toHaveCount(8);
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  for(const day of days){
    await page.getByRole('button',{name:`Edit ${day} khaja`,exact:true}).click();
    await page.getByRole('checkbox',{name:/Veg Momo/}).check();
    await page.getByRole('checkbox',{name:/Milk Tea/}).check();
    await page.getByRole('button',{name:'Save day',exact:true}).click();
    await expect(table.getByRole('row').filter({has:page.getByRole('rowheader',{name:day,exact:true})})).toContainText('Veg Momo');
  }
  await expect(page.getByText('7 of 7 days planned')).toBeVisible();
  await page.getByRole('button',{name:'Edit Monday khaja',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:/Veg Momo/})).toBeChecked();
  await page.getByRole('checkbox',{name:/Veg Momo/}).uncheck();
  await page.getByRole('textbox',{name:'Search menu products'}).fill('chow');
  await page.getByRole('checkbox',{name:/Chowmein/}).check();
  await page.getByRole('button',{name:'Save day',exact:true}).click();
  const monday=table.getByRole('row').filter({has:page.getByRole('rowheader',{name:'Monday',exact:true})});
  await expect(monday).toContainText('Chowmein');
  await expect(monday).toContainText('Milk Tea');
  await expect(monday).not.toContainText('Veg Momo');
  await page.getByRole('button',{name:'Edit Tuesday khaja',exact:true}).click();
  await page.getByRole('button',{name:'Clear selections'}).click();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(page.getByText('7 of 7 days planned')).toBeVisible();
  await page.getByRole('button',{name:'Edit Saturday khaja',exact:true}).click();
  await page.getByRole('button',{name:'Clear selections'}).click();
  await page.getByRole('button',{name:'Save day',exact:true}).click();
  await expect(page.getByText('6 of 7 days planned')).toBeVisible();
  await page.reload({waitUntil:'domcontentloaded'});await open();
  await expect(monday).toContainText('Chowmein');
  await expect(page.getByText('6 of 7 days planned')).toBeVisible();
  expect(state.writes.filter((w:any)=>w.path.endsWith('/khaja-schedule/'))).toHaveLength(9);
  await page.screenshot({path:test.info().outputPath('khaja-schedule.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole('button',{name:'Edit Sunday khaja',exact:true})).toBeAttached();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});


test('attendance defaults to BS month, marks statuses, filters and persists corrections',async({page})=>{
  test.setTimeout(60000);
  const state=await setup(page);
  const open=()=>page.getByRole('navigation',{name:'Daybook sections'}).getByRole('button',{name:'Staff Attendance',exact:true}).click();
  await open();
  await expect(page.getByLabel('Nepali year',{exact:true})).toHaveValue('2083');
  await expect(page.getByLabel('Nepali month',{exact:true})).toHaveValue('6');
  await page.getByRole('button',{name:'Mark attendance for Asha',exact:true}).click();
  await expect(page.getByLabel('Attendance Nepali date',{exact:true})).toHaveValue('29');
  await page.getByRole('button',{name:'Save attendance',exact:true}).click();
  await expect(page.getByRole('button',{name:'Asha, 2083/6/29 BS: Present',exact:true})).toBeVisible();
  for(const [day,status,label] of [[1,'ABSENT','Absent'],[2,'FIRST_HALF','First half present'],[3,'SECOND_HALF','Second half present']] as const){
    await page.getByRole('button',{name:`Asha, 2083/6/${day} BS: Unmarked`,exact:true}).click();
    await page.getByLabel('Attendance status',{exact:true}).selectOption(status);
    await page.getByRole('button',{name:'Save attendance',exact:true}).click();
    await expect(page.getByRole('button',{name:`Asha, 2083/6/${day} BS: ${label}`,exact:true})).toBeVisible();
  }
  const row=page.getByRole('table',{name:'Monthly staff attendance'}).getByRole('row').filter({has:page.getByRole('button',{name:'Mark attendance for Asha',exact:true})});
  await expect(row.getByRole('cell').nth(31)).toHaveText('2');
  await expect(row.getByRole('cell').nth(32)).toHaveText('2');
  await expect(page.getByRole('button',{name:'Asha, 2083/6/30 BS: Unmarked',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Asha, 2083/6/1 BS: Absent',exact:true}).click();
  await page.getByLabel('Attendance status',{exact:true}).selectOption('PRESENT');
  state.attendanceFail=true;
  await page.getByRole('button',{name:'Save attendance',exact:true}).click();
  await expect(page.getByText('Attendance could not be saved',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Save attendance',exact:true}).click();
  await expect(page.getByRole('button',{name:'Asha, 2083/6/1 BS: Present',exact:true})).toBeVisible();
  await page.getByLabel('Search attendance staff',{exact:true}).fill('asha');
  await expect(page.getByRole('button',{name:'Mark attendance for Bikash',exact:true})).toHaveCount(0);
  await page.getByLabel('Nepali month',{exact:true}).selectOption('5');
  await expect(page.getByRole('button',{name:'Asha, 2083/5/1 BS: Unmarked',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Current month',exact:true}).click();
  await expect(page.getByRole('button',{name:'Asha, 2083/6/1 BS: Present',exact:true})).toBeVisible();
  await page.reload({waitUntil:'domcontentloaded'});await open();
  await expect(page.getByRole('button',{name:'Asha, 2083/6/1 BS: Present',exact:true})).toBeVisible();
  await page.screenshot({path:test.info().outputPath('attendance-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByLabel('Search attendance staff',{exact:true})).toBeAttached();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  const filters=page.getByLabel('Attendance filters',{exact:true});
  expect(await filters.evaluate(el=>getComputedStyle(el).flexWrap)).toBe('nowrap');
  await page.screenshot({path:test.info().outputPath('attendance-mobile.png'),fullPage:true});
});
