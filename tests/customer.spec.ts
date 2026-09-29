import {test,expect,Page} from '@playwright/test';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0x8AAAAASUVORK5CYII=';
async function setup(page:Page, signedIn=false) {
  page.on('pageerror',e=>console.log('BROWSER ERROR',e.stack));
  const user={id:91,username:'web_customer',phone_number:'+9779841234567',email:'',role:'CUSTOMER',is_active:true};
  const outlet={id:1,name:'Web Outlet',branch_code:'WEB',enable_delivery:true,enable_takeaway:true,accepting_orders:true};
  const product={id:'burger',category:'food',name:'Web Burger',description:'Burger',base_price:'200.00',variants:[],modifier_groups:[],images:[`data:image/png;base64,${png}`],dietary_tags:[],is_available:true,is_web_visible:true,is_delivery_eligible:true,requires_kitchen:true};
  const combo={...product,id:'combo',name:'Web Combo',base_price:'350.00',is_combo_package:true,combo_discount_type:'fixed_price',combo_discount_value:'350.00',combo_items:[{product_id:'burger',product_name:'Web Burger',quantity:2,unit_price:'200.00'}]};
  const state:any={user,outlet,orders:[],favorites:[],calls:[],writes:[],sockets:[],created:0,failCreate:false};
  if(signedIn)await page.addInitScript(({user,outlet})=>{localStorage.setItem('crunchy_access_token','test-access');localStorage.setItem('crunchy_refresh_token','test-refresh');localStorage.setItem('crunchy_auth_user',JSON.stringify(user));localStorage.setItem('crunchy_auth_outlet',JSON.stringify(outlet));},{user,outlet});
  await page.addInitScript(()=>{document.cookie='csrftoken=abcdefghijklmnopqrstuvwx12345678; path=/';});
  await page.routeWebSocket('**/ws/**',socket=>{if(socket.url().includes('/customer/orders/')){state.sockets.push(socket);socket.onMessage(()=>socket.send(JSON.stringify({type:'heartbeat',revision:String(state.orders.map(o=>o.version))})));}});
  await page.route('**/api/v1/**',async route=>{
    const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1/','');
    state.calls.push(req.method()+' '+path);
    let body:any=null;if(req.headers()['content-type']?.includes('application/json')&&req.postData())body=req.postDataJSON();
    if(req.method()==='POST')state.writes.push({path,body,raw:req.postData(),key:req.headers()['idempotency-key']});
    let result:any={};
    if(path==='auth/me/')result=user;
    else if(path.includes('branches'))result=[outlet];
    else if(path==='catalog/menu/')result={categories:[{id:'food',name:'Food',products:[product,combo]}],valid_until:null};
    else if(path==='catalog/management/')result={categories:[{id:'food',name:'Food'}],products:[product,combo],schedules:[],overrides:{}};
    else if(path==='catalog/quote/')result={items:[{unit_price:'350.00',line_total:'350.00'}],subtotal:'350.00'};
    else if(path==='customer/auth/start/')result={exists:body.phone==='9800000000',challenge_id:'challenge-1',demo_code:'4821'};
    else if(path==='customer/auth/verify/'){
      if(body.code!=='4821'){await route.fulfill({status:400,json:{detail:'Invalid code'}});return;}
      result={registration_token:'signed-registration'};
    }else if(path==='customer/auth/register/'||path==='customer/auth/login/')result={access:'test-access',refresh:'test-refresh',user,outlet};
    else if(path==='customer/profile/')result={name:user.username,phone:user.phone_number,email:'',address:'',member_since:'2026-09-01',favorites:state.favorites};
    else if(path.startsWith('customer/favorites/')){const id=path.split('/')[2];state.favorites=body.selected?[...state.favorites,id]:state.favorites.filter(v=>v!==id);result={favorites:state.favorites};}
    else if(path==='customer/orders/')result={results:state.orders};
    else if(path==='customer/socket-ticket/')result={ticket:'private-ticket',path:'/ws/customer/orders/'};
    else if(path==='customer/checkout/meta/')result={qr_url:`data:image/png;base64,${png}`,merchant:'Registered Merchant',accepting_orders:true,fulfillment_modes:['TAKEAWAY','DELIVERY'],tables:[]};
    else if(path==='customer/checkout/quote/'){
      const subtotal=body.items.reduce((n,i)=>n+(i.product_id==='combo'?350:200)*i.quantity,0);
      result={subtotal:String(subtotal),total_payable:(subtotal+Number(body.tip)).toFixed(2),vat_included_amount:'0.00',items:body.items};
    }else if(path==='customer/checkout/'){
      if(state.failCreate){state.failCreate=false;await route.fulfill({status:409,json:{detail:'Price changed; please review.'}});return;}
      const raw=req.postData()!; const payload=JSON.parse(raw.match(/name="payload"\r?\n\r?\n([^\r\n]+)/)![1]);
      state.created++;state.lastPayload=payload;
      result={id:7,outlet_id:1,outlet_name:'Web Outlet',order_number:'WEB-REAL-7',request_key:req.headers()['idempotency-key'],version:1,status:'PENDING',fulfillment_type:payload.fulfillment_type,order_source:'WEBSITE',customer_name:payload.customer_name,customer_phone:user.phone_number,notes:'',delivery_address:payload.delivery_address,created_at:new Date().toISOString(),subtotal:payload.expected_total,total_payable:payload.expected_total,paid_amount:'0.00',due_amount:payload.expected_total,credit_amount:'0.00',refunded_amount:'0.00',discount_amount:'0.00',vat_included_amount:'0.00',payment_method:'FONEPAY',settlement:'UNPAID',payment_review:'PENDING',receipts:[{id:1,kind:'TOKEN',number:'TOKEN-7'}],payments:[],reorder_items:payload.items,items:payload.items.map((i,n)=>({id:n+1,product_id:i.product_id,product_name:i.product_id==='combo'?'Web Combo':'Web Burger',variant_name:'',quantity:i.quantity,unit_price:i.product_id==='combo'?'350':'200',line_total:payload.expected_total,round_number:1,requires_kitchen:true,is_voided:false,modifiers:[],combo_components:[]}))};
      state.orders=[result];
    }
    await route.fulfill({json:result});
  });
  await page.goto('/');await expect(page.getByRole('button',{name:'Add Web Burger',exact:true})).toBeVisible();
  return state;
}
async function openCheckout(page:Page){await page.getByRole('button',{name:'Add Web Burger',exact:true}).click();await page.getByRole('button',{name:'Shopping Cart',exact:true}).click();await expect(page.getByText('Select 1 Sauce to Proceed')).toHaveCount(0);await page.locator('#cart-checkout-btn').click();}
async function receipt(page:Page){await page.locator('#fulfillment-opt-takeaway').click();await page.getByLabel('Payment receipt').setInputFiles({name:'receipt.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});}

test('guest signup resumes cart checkout and real tracking without required add-ons',async({page})=>{
  const state=await setup(page);await openCheckout(page);
  await page.getByLabel('Mobile Phone Number',{exact:true}).fill('9841234567');await page.getByRole('button',{name:'Continue',exact:true}).click();
  for(const [index,digit] of [...'4821'].entries())await page.getByLabel(`Signup code digit ${index+1}`).fill(digit);
  await page.getByRole('button',{name:'Verify & Continue'}).click();
  await page.getByLabel('Username',{exact:true}).fill('web_customer');await page.getByLabel('Set Password').fill('Crisp!River49Ocean');await page.getByLabel('New 4-Digit Quick PIN').fill('1234');
  await page.getByRole('button',{name:'Create Account & Continue'}).click();
  await expect(page.getByAltText('Merchant payment QR')).toBeVisible();
  const submit=page.getByRole('button',{name:/Submit Receipt & Place Order/});await expect(submit).toBeDisabled();
  await receipt(page);await expect(submit).toBeEnabled();await submit.click();
  await expect(page.getByText('WEB-REAL-7',{exact:false}).first()).toBeVisible();
  expect(state.created).toBe(1);expect(state.lastPayload.items).toEqual([{product_id:'burger',quantity:1,variant_id:null,modifier_option_ids:[]}]);
  expect(state.writes.find(w=>w.path==='customer/checkout/').key).toBeTruthy();
  state.orders[0].status='PREPARING';state.orders[0].version++;
  state.sockets.at(-1).send(JSON.stringify({type:'orders_changed'}));
  await expect(page.getByText('In kitchen',{exact:true}).first()).toBeVisible();
  await page.reload();await page.getByRole('button',{name:'Add Web Burger',exact:true}).click();await page.getByRole('button',{name:'Shopping Cart',exact:true}).click();await page.locator('#cart-checkout-btn').click();
  await expect(page.getByAltText('Merchant payment QR')).toBeVisible();await expect(page.getByText('Customer Sign In',{exact:true})).toHaveCount(0);
});

test('returning customer can use mobile and PIN or password; favourites persist',async({page})=>{
  const state=await setup(page);await page.getByRole('button',{name:'User Account Profile'}).click();await page.getByRole('button',{name:'Sign In / Sign Up'}).click();
  await page.getByLabel('Mobile Phone Number',{exact:true}).fill('9800000000');await page.getByRole('button',{name:'Continue',exact:true}).click();
  for(const [index,digit] of [...'1234'].entries())await page.getByLabel(`PIN digit ${index+1}`).fill(digit);
  await page.getByRole('button',{name:'Unlock Account'}).click();
  await page.getByTitle('Save to favorites').first().click();await expect.poll(()=>state.favorites.length).toBe(1);
  await page.reload();await expect(page.getByTitle('Remove favorite').first()).toBeVisible();
  await page.getByRole('button',{name:'User Account Profile'}).click();await page.locator('#menu-logout-btn').click();
  await page.getByRole('button',{name:'User Account Profile'}).click();await page.getByRole('button',{name:'Sign In / Sign Up'}).click();
  await page.getByRole('button',{name:'Password',exact:true}).click();await page.getByLabel('Mobile Phone Number',{exact:true}).fill('9800000000');await page.getByLabel('Account Password').fill('Crisp!River49Ocean');await page.getByRole('button',{name:'Log In',exact:true}).click();
  expect(state.writes.filter(w=>w.path==='customer/auth/login/').map(w=>w.body.method)).toEqual(['PIN','PASSWORD']);
});

test('customized combos retain component choices in QR checkout',async({page})=>{
  const state=await setup(page,true);
  await page.getByRole('button',{name:'Customize',exact:true}).click();
  await page.getByRole('button',{name:/Add.*Cart|Add.*Order|Add Combo/i}).last().click();
  await page.getByRole('button',{name:'Shopping Cart',exact:true}).click();await page.locator('#cart-checkout-btn').click();await receipt(page);
  const submit=page.getByRole('button',{name:/Submit Receipt & Place Order/});await expect(submit).toBeEnabled();await submit.click();
  await expect.poll(()=>state.created).toBe(1);expect(state.lastPayload.items[0].combo_selections).toHaveLength(2);expect(state.lastPayload.items[0].modifier_option_ids).toEqual([]);expect(state.lastPayload.items[0].variant_id).toBeNull();
});

test('rejected checkout keeps the cart and receipt for retry',async({page})=>{
  const state=await setup(page,true);state.failCreate=true;await openCheckout(page);await receipt(page);const submit=page.getByRole('button',{name:/Submit Receipt & Place Order/});await expect(submit).toBeEnabled();await submit.click();
  await expect(page.getByText('Price changed; please review.',{exact:true})).toBeVisible();expect(state.created).toBe(0);await submit.click();await expect.poll(()=>state.created).toBe(1);
});
