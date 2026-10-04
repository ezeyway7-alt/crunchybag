import {receiptFixture} from "./receiptFixture";
import {test,expect,Page} from '@playwright/test';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0x8AAAAASUVORK5CYII=';
async function setup(page:Page, signedIn=false, role='CUSTOMER') {
  // External font availability must not hold up storefront navigation in tests.
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  page.on('pageerror',e=>console.log('BROWSER ERROR',e.stack));
  const user={id:91,username:'web_customer',phone_number:'+9779841234567',email:'',role,is_active:true};
  const outlet={id:1,name:'Web Outlet',branch_code:'WEB',enable_delivery:true,enable_takeaway:true,accepting_orders:true};
  const product={id:'burger',category:'food',name:'Web Burger',description:'Burger',base_price:'200.00',variants:[],modifier_groups:[],images:[`data:image/png;base64,${png}`],dietary_tags:[],is_available:true,is_web_visible:true,is_delivery_eligible:true,requires_kitchen:true};
  const combo={...product,id:'combo',name:'Web Combo',base_price:'350.00',is_combo_package:true,combo_discount_type:'fixed_price',combo_discount_value:'350.00',combo_items:[{product_id:'burger',product_name:'Web Burger',quantity:2,unit_price:'200.00'}]};
  const state:any={user,outlet,orders:[],favorites:[],calls:[],writes:[],sockets:[],created:0,failCreate:false,cart:{items:[],version:0},merges:new Set(),addresses:[]};
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
    else if(path==='customer/cart/') {
      if(req.method()==='PUT') {
        if(state.forceCartConflict){state.forceCartConflict=false;state.cart.items.push({...body.items[0],cartItemId:'another-device'});state.cart.version++;}
        if(body.version!==state.cart.version){await route.fulfill({status:409,json:{detail:'Cart changed'}});return;}
        if(state.blockCartPut){await new Promise<void>(resolve=>{state.releaseCartPut=resolve;});state.blockCartPut=false;}
        state.cart={items:body.items,version:state.cart.version+1};
      }
      if(req.method()==='POST'&&!state.merges.has(body.merge_id)) {
        state.merges.add(body.merge_id);const ids=new Set(state.cart.items.map(i=>i.cartItemId));
        state.cart={items:[...state.cart.items,...body.items.filter(i=>!ids.has(i.cartItemId))],version:state.cart.version+1};
      }
      result=state.cart;
    }
    else if(path==='customer/addresses/') {
      if(req.method()==='POST') {result={id:state.addresses.length+1,is_default:!state.addresses.length,latitude:null,longitude:null,landmark:'',...body};state.addresses.push(result);}
      else result=state.addresses;
    }
    else if(path.startsWith('customer/addresses/')) {
      const id=Number(path.split('/')[2]);
      if(req.method()==='DELETE'){state.addresses=state.addresses.filter(row=>row.id!==id);await route.fulfill({status:204});return;}
      if(body.is_default)state.addresses.forEach(row=>row.is_default=false);
      result=state.addresses.find(row=>row.id===id);Object.assign(result,body);
    }
    else if(path==='customer/profile/')result={name:user.username,phone:user.phone_number,email:'',address:'',member_since:'2026-09-01',favorites:state.favorites};
    else if(path.startsWith('customer/favorites/')){const id=path.split('/')[2];state.favorites=body.selected?[...state.favorites,id]:state.favorites.filter(v=>v!==id);result={favorites:state.favorites};}
    else if(path==='customer/orders/')result={results:state.orders};
    else if(path==='customer/socket-ticket/')result={ticket:'private-ticket',path:'/ws/customer/orders/'};
    else if(path==='customer/checkout/meta/')result={qr_url:`data:image/png;base64,${png}`,merchant:'Registered Merchant',accepting_orders:true,fulfillment_modes:['TAKEAWAY','DELIVERY'],tables:[]};
    else if(path==='customer/checkout/quote/'){
      const subtotal=body.items.reduce((n,i)=>n+(i.product_id==='combo'?350:200)*i.quantity,0);
      result={subtotal:String(subtotal),total_payable:(subtotal+Number(body.tip || 0)).toFixed(2),vat_included_amount:'0.00',items:body.items};
    }else if(path==='customer/checkout/'){
      if(state.failCreate){state.failCreate=false;await route.fulfill({status:409,json:{detail:'Price changed; please review.'}});return;}
      const raw=req.postData()!; const payload=JSON.parse(raw.match(/name="payload"\r?\n\r?\n([^\r\n]+)/)![1]);
      state.created++;state.lastPayload=payload;
      state.cart={items:state.cart.items.filter(row=>!payload.cart_line_ids?.includes(row.cartItemId)),version:state.cart.version+1};
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

test('cart rebases a stale version without losing another device or in-flight edits',async({page})=>{
  const state=await setup(page,true);
  await expect.poll(()=>state.calls.includes('GET customer/cart/')).toBe(true);
  state.forceCartConflict=true;state.blockCartPut=true;
  await page.getByRole('button',{name:'Add Web Burger',exact:true}).click();
  await expect.poll(()=>typeof state.releaseCartPut).toBe('function');
  await page.getByRole('button',{name:'Add Web Burger',exact:true}).click();
  state.releaseCartPut();
  await expect.poll(()=>state.cart.items.length).toBe(3);
  expect(state.cart.items.some(row=>row.cartItemId==='another-device')).toBe(true);
  await page.reload();
  await page.getByRole('button',{name:'Shopping Cart',exact:true}).click();
  await expect(page.getByText('3 items',{exact:true}).first()).toBeVisible();
});

test('denied location access never saves a sample address or default map point',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:(_success:any,failure:any,options:any)=>{
    (window as any).requestedGeoOptions=options;failure({code:1});
  }}}));
  await setup(page,true);await page.goto('/profile');
  await page.getByRole('button',{name:'Add address',exact:true}).click();
  await page.getByRole('button',{name:'Choose on map',exact:true}).click();
  await page.getByRole('button',{name:'Current location',exact:true}).click();
  await expect(page.getByText('Allow location access or choose a point on the map.',{exact:true})).toBeVisible();
  await expect(page.getByLabel('House / Street / Tole Address')).toHaveValue('');
  await expect(page.getByRole('button',{name:'Save location',exact:true})).toBeDisabled();
  expect(await page.evaluate(()=>(window as any).requestedGeoOptions)).toMatchObject({maximumAge:0,enableHighAccuracy:true});
});

test('guest refresh, account cart merge, checkout validation and signed-in persistence',async({page})=>{
  const state=await setup(page);
  await page.getByRole('button',{name:'Add Web Burger',exact:true}).click();
  const guest=await page.evaluate(()=>JSON.parse(localStorage.getItem('crunchy-cart-v1:guest:1')!));
  expect(guest.items).toHaveLength(1);
  state.cart={items:[{...guest.items[0],cartItemId:'existing-account-line'}],version:1};
  await page.reload();
  await page.getByRole('button',{name:'Shopping Cart',exact:true}).click();
  await expect(page.locator('#cart-checkout-btn')).toBeVisible();
  await page.locator('#cart-checkout-btn').click();
  
  await page.getByLabel('Mobile Phone Number',{exact:true}).fill('9800000000');
  await page.getByLabel('Account Password or PIN').fill('Crisp!River49Ocean');
  await page.getByRole('button',{name:'Sign In',exact:true}).click();
  await expect(page.getByAltText('Merchant payment QR')).toBeVisible();
  expect(state.cart.items).toHaveLength(2);
  expect(await page.evaluate(()=>localStorage.getItem('crunchy-cart-v1:guest:1'))).toBeNull();
  await expect(page.getByText('Rider Tip',{exact:true})).toHaveCount(0);
  await expect(page.getByText('Receipt must be smaller than 5 MB.',{exact:true})).toHaveCount(0);
  await page.getByLabel('Payment receipt').setInputFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(5*1024*1024+1)});
  await expect(page.getByText('Receipt must be smaller than 5 MB.',{exact:true})).toBeVisible();
  await receipt(page);
  await expect(page.getByText('Receipt must be smaller than 5 MB.',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:/Submit Receipt & Place Order/})).toBeEnabled();
  await page.reload();
  await expect(page.getByRole('button',{name:'Add Web Burger',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Shopping Cart',exact:true}).click();
  await page.locator('#cart-checkout-btn').click();
  await expect(page.getByAltText('Merchant payment QR')).toBeVisible();
  expect(state.cart.items).toHaveLength(2);
  expect(state.merges.size).toBe(1);
});

test('profile page saves multiple addresses with live GPS and checkout reuses the default',async({page,context})=>{
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:27.681234,longitude:85.321987,accuracy:12});
  const state=await setup(page,true);
  await page.goto('/profile');
  await expect(page.getByRole('heading',{name:'My profile',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Add address',exact:true}).click();
  await page.getByRole('button',{name:'Choose on map',exact:true}).click();
  await expect(page.getByRole('button',{name:'Save location',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Current location',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'27.681234, 85.321987'})).toBeVisible();
  await expect(page.getByLabel('House / Street / Tole Address')).toHaveValue('');
  await page.getByLabel('House / Street / Tole Address').fill('House 9, My street');
  await page.getByLabel('Nearest Landmark',{exact:true}).fill('Blue gate');
  await page.getByRole('button',{name:'Save location',exact:true}).click();
  await page.getByRole('button',{name:'Save address',exact:true}).click();
  await expect.poll(()=>state.addresses.length).toBe(1);
  expect(state.addresses[0]).toMatchObject({latitude:'27.6812340',longitude:'85.3219870',landmark:'Blue gate'});
  await page.getByRole('button',{name:'Add address',exact:true}).click();
  await page.getByLabel('Address label',{exact:true}).fill('Work');
  await page.getByLabel('Address',{exact:true}).fill('Office street');
  await page.getByRole('button',{name:'Save address',exact:true}).click();
  await expect.poll(()=>state.addresses.length).toBe(2);
  await page.reload();
  await expect(page.getByText('Office street',{exact:true})).toBeVisible();
  await page.goto('/menu');await openCheckout(page);
  await expect(page.getByLabel('Saved delivery address')).toHaveValue('1');
  await expect(page.getByText('House 9, My street',{exact:true})).toBeVisible();
  await page.getByLabel('Payment receipt').setInputFiles({name:'receipt.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await page.getByRole('button',{name:/Submit Receipt & Place Order/}).click();
  await expect.poll(()=>state.created).toBe(1);
  expect(state.lastPayload.delivery_location).toEqual({lat:27.681234,lng:85.321987,landmark:'Blue gate'});
});

test('guest signup resumes cart checkout and real tracking without required add-ons',async({page})=>{
  const state=await setup(page);await openCheckout(page);
  await page.getByRole('button',{name:'Sign Up',exact:true}).click();
  await page.getByLabel('Mobile Phone Number',{exact:true}).fill('9841234567');await page.getByRole('button',{name:'Get OTP Verification Code',exact:true}).click();
  for(const [index,digit] of [...'4821'].entries())await page.getByLabel(`Code digit ${index+1}`).fill(digit);
  await page.getByRole('button',{name:'Verify & Continue'}).click();
  await page.getByLabel('Full name',{exact:true}).fill('web_customer');await page.getByLabel('Set Password').fill('Crisp!River49Ocean');await page.getByLabel('New 4-Digit Quick PIN').fill('1234');
  await page.getByRole('button',{name:'Complete & Continue to Checkout'}).click();
  await expect(page.getByAltText('Merchant payment QR')).toBeVisible();
  const submit=page.getByRole('button',{name:/Submit Receipt & Place Order/});await expect(submit).toBeDisabled();
  await receipt(page);await expect(submit).toBeEnabled();await submit.click();
  await expect(page.getByText('WEB-REAL-7',{exact:false}).first()).toBeVisible();
  expect(state.created).toBe(1);expect(state.lastPayload.items).toEqual([{product_id:'burger',quantity:1,variant_id:null,modifier_option_ids:[]}]);
  expect(state.writes.find(w=>w.path==='customer/checkout/').key).toBeTruthy();
  state.orders[0].status='PREPARING';state.orders[0].version++;
  state.sockets.at(-1).send(JSON.stringify({type:'orders_changed'}));
  await expect(page.getByText('In kitchen',{exact:true}).first()).toBeVisible();
  await page.goto('/menu');await page.getByRole('button',{name:'Add Web Burger',exact:true}).click();await page.getByRole('button',{name:'Shopping Cart',exact:true}).click();await page.locator('#cart-checkout-btn').click();
  await expect(page.getByAltText('Merchant payment QR')).toBeVisible();await expect(page.getByText('Customer Sign In',{exact:true})).toHaveCount(0);
});

test('returning customer can use mobile and PIN or password; favourites persist',async({page})=>{
  const state=await setup(page);await page.getByRole('button',{name:'User Account Profile'}).click();await page.getByRole('button',{name:'Sign In / Sign Up',exact:true}).click();
  await page.getByLabel('Mobile Phone Number',{exact:true}).fill('9800000000');await page.getByLabel('Account Password or PIN').fill('1234');
  await page.getByRole('button',{name:'Sign In',exact:true}).click();
  await page.goto('/menu');await page.getByTitle('Save to favorites').first().click();await expect.poll(()=>state.favorites.length).toBe(1);
  await page.reload();await expect(page.getByTitle('Remove favorite').first()).toBeVisible();
  await page.getByRole('button',{name:'User Account Profile'}).click();await page.locator('#menu-logout-btn').click();
  await page.getByRole('button',{name:'User Account Profile'}).click();await page.getByRole('button',{name:'Sign In / Sign Up',exact:true}).click();
  await page.getByLabel('Mobile Phone Number',{exact:true}).fill('9800000000');await page.getByLabel('Account Password or PIN').fill('Crisp!River49Ocean');await page.getByRole('button',{name:'Sign In',exact:true}).click();
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

test('order selection survives live updates and delivery has dispatch, maps, copy and mobile sharing',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'share',{configurable:true,value:async(value:any)=>{(window as any).sharedDelivery=value;}});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value:string)=>{(window as any).copiedDelivery=value;}}});
  });
  const state=await setup(page,true);await openCheckout(page);await receipt(page);
  await page.getByRole('button',{name:/Submit Receipt & Place Order/}).click();
  await expect.poll(()=>state.created).toBe(1);
  const delivery={...state.orders[0],id:8,order_number:'WEB-DELIVERY-8',status:'OUT_FOR_DELIVERY',fulfillment_type:'DELIVERY',delivery_address:'House 9, Test Street',delivery_location:{lat:27.681234,lng:85.321987,landmark:'Blue gate'},notes:'Call at the gate'};
  state.orders.push(delivery);
  state.sockets.at(-1).send(JSON.stringify({type:'orders_changed'}));
  await page.getByRole('button',{name:'View order WEB-DELIVERY-8',exact:true}).click();
  await expect(page.getByRole('button',{name:'View order WEB-DELIVERY-8',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByTestId('tracking-step-OUT_FOR_DELIVERY')).toHaveAttribute('aria-current','step');
  const destination=page.getByRole('region',{name:'Delivery details'});
  await expect(destination.getByRole('link',{name:'Open in Maps',exact:true})).toHaveAttribute('href','https://www.google.com/maps/search/?api=1&query=27.681234%2C85.321987');
  await destination.getByRole('button',{name:'Copy delivery details',exact:true}).click();
  const copied=await page.evaluate(()=>(window as any).copiedDelivery);
  expect(copied).toContain('House 9, Test Street');expect(copied).toContain('+9779841234567');expect(copied).toContain('Blue gate');expect(copied).toContain('Call at the gate');
  await destination.getByRole('button',{name:'Share delivery details',exact:true}).click();
  expect(await page.evaluate(()=>(window as any).sharedDelivery)).toMatchObject({title:'Delivery WEB-DELIVERY-8',url:'https://www.google.com/maps/search/?api=1&query=27.681234%2C85.321987'});
  delivery.status='COMPLETED';delivery.version++;
  state.sockets.at(-1).send(JSON.stringify({type:'orders_changed'}));
  await expect(page.getByTestId('tracking-step-COMPLETED')).toHaveAttribute('aria-current','step');
  await expect(page.getByTestId('tracking-step-COMPLETED')).toContainText('Delivered');
  await expect(page.getByRole('button',{name:'View order WEB-DELIVERY-8',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'View order WEB-REAL-7',exact:true}).click();
  await expect(page.getByRole('button',{name:'View order WEB-REAL-7',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByTestId('tracking-step-OUT_FOR_DELIVERY')).toHaveCount(0);
  await expect(page.getByTestId('tracking-step-COMPLETED')).toContainText('Completed');
  await page.getByRole('button',{name:'View order WEB-DELIVERY-8',exact:true}).click();
  await expect(destination).toContainText('House 9, Test Street');
});

test('delivery sharing falls back to selectable text when clipboard access is denied',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Denied');}}});
  });
  const state=await setup(page,true);await openCheckout(page);await receipt(page);
  await page.getByRole('button',{name:/Submit Receipt & Place Order/}).click();await expect.poll(()=>state.created).toBe(1);
  Object.assign(state.orders[0],{fulfillment_type:'DELIVERY',delivery_address:'My street\nhttps://maps.google.com/?q=27.7,85.3',status:'READY'});
  state.sockets.at(-1).send(JSON.stringify({type:'orders_changed'}));
  await page.getByRole('button',{name:'Share delivery details',exact:true}).click();
  await expect(page.getByLabel('Delivery details to copy')).toHaveValue(/Coordinates: 27\.7, 85\.3/);
  await expect(page.getByRole('link',{name:'Open in Maps',exact:true})).toHaveAttribute('href','https://www.google.com/maps/search/?api=1&query=27.7%2C85.3');
});


test('web receipt uses the saved outlet compact format and prints only the same slip with its QR',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const state=await setup(page,true);await openCheckout(page);await receipt(page);
  await page.getByRole('button',{name:/Submit Receipt & Place Order/}).click();await expect.poll(()=>state.created).toBe(1);
  await page.route('**/api/v1/orders/customer/7/slip/',route=>route.fulfill({json:receiptFixture(state.orders[0])}));
  await page.getByRole('button',{name:'Print Token Slip',exact:true}).click();
  const paper=page.getByRole('article',{name:'Order receipt'});
  await expect(paper).toHaveAttribute('data-receipt-format','compact-v1');await expect(paper).toContainText('Saved Street, Kathmandu');
  await expect(paper.getByTestId('receipt-order-number')).toHaveText('WEB-REAL-7');
  await expect(paper.getByRole('img',{name:'Scan to track this order'})).toBeVisible();
  const size=await paper.boundingBox();expect(size!.width).toBeLessThanOrEqual(288);
  await page.screenshot({path:test.info().outputPath('compact-web-receipt.png'),fullPage:true});
  const popupPromise=page.waitForEvent('popup');await page.locator('#print-receipt-btn').click();const popup=await popupPromise;
  await expect(popup.getByRole('article',{name:'Order receipt'})).toHaveAttribute('data-receipt-format','compact-v1');
  await expect(popup.getByRole('link',{name:'Track this order'})).toHaveAttribute('href','http://127.0.0.1:4173/track?token=receipt-signed');
  await expect(popup.getByRole('button')).toHaveCount(0);await popup.close();
});


test('SMS recovery verifies the code before resetting password and PIN without displaying an OTP',async({page})=>{
  const state=await setup(page);const writes:any[]=[];
  await page.route('**/api/v1/customer/auth/recovery-start/',route=>{writes.push(route.request().postDataJSON());return route.fulfill({json:{challenge_id:'recovery-1',resend_after:60,delivery_status:'QUEUED'}});});
  await page.route('**/api/v1/customer/auth/recovery-verify/',route=>{expect(route.request().postDataJSON()).toEqual({challenge_id:'recovery-1',code:'4821'});return route.fulfill({json:{reset_token:'verified-reset'}});});
  await page.route('**/api/v1/customer/auth/reset/',route=>{writes.push(route.request().postDataJSON());return route.fulfill({json:{access:'test-access',refresh:'test-refresh',user:state.user,outlet:state.outlet}});});
  await page.goto('/menu');await page.getByRole('button',{name:'User Account Profile'}).click();
  await page.getByRole('button',{name:'Sign In / Sign Up',exact:true}).click();
  await page.getByRole('button',{name:'Forgot Password or MPIN? Recover with SMS'}).click();
  await page.getByPlaceholder('98XXXXXXXX').last().fill('9841234567');
  await page.getByRole('button',{name:'Send Recovery Code'}).click();
  await expect(page.getByText('Test OTP Code:',{exact:false})).toHaveCount(0);
  for(const [index,digit] of [...'4821'].entries())await page.getByLabel(`Login code digit ${index+1}`).fill(digit);
  await page.getByRole('button',{name:'Verify Recovery Code',exact:true}).click();
  await page.getByLabel('New Password',{exact:true}).fill('New-Passphrase-8*Forest');await page.getByLabel('New 4-Digit Quick PIN',{exact:true}).fill('9274');
  await page.getByRole('button',{name:'Save New Credentials & Sign In'}).click();
  await expect.poll(()=>writes.length).toBe(2);expect(writes[1]).toMatchObject({reset_token:'verified-reset',password:'New-Passphrase-8*Forest',pin:'9274'});
});

test('website traffic records page views without query strings or personal data',async({page})=>{
  const state=await setup(page);await page.goto('/menu?token=private-test');
  await expect.poll(()=>state.writes.filter(w=>w.path==='customer/traffic/'&&w.body.path==='/menu').length).toBe(1);
  const visit=state.writes.find(w=>w.path==='customer/traffic/'&&w.body.path==='/menu').body;expect(visit.path).toBe(new URL(page.url()).pathname);expect(JSON.stringify(visit)).not.toContain('private-test');expect(visit).not.toHaveProperty('phone');
  await page.reload();await expect.poll(()=>state.writes.filter(w=>w.path==='customer/traffic/'&&w.body.path==='/menu').length).toBe(2);
  const second=state.writes.filter(w=>w.path==='customer/traffic/'&&w.body.path==='/menu')[1].body;expect(second.visitor_id).toBe(visit.visitor_id);expect(second.session_id).toBe(visit.session_id);expect(second.event_id).not.toBe(visit.event_id);
});


test('guest login moves to signup without a second credential attempt',async({page})=>{
  await setup(page); await openCheckout(page);
  let attempts=0;
  await page.route('**/api/v1/customer/auth/login/',route=>{
    attempts++;
    return route.fulfill({status:400,json:{code:'signup_required',next_action:'signup',detail:'Verify your mobile number to create or activate your web account.'}});
  });
  await page.getByLabel('Mobile Phone Number',{exact:true}).fill('+977 9841234567');
  await expect(page.getByLabel('Mobile Phone Number',{exact:true})).toHaveValue('9841234567');
  await page.getByLabel('Account Password or PIN').fill('9274');
  await page.getByRole('button',{name:'Sign In',exact:true}).click();
  await expect(page.getByRole('button',{name:'Get OTP Verification Code',exact:true})).toBeVisible();
  expect(attempts).toBe(1);
});

test('guest recovery completes signup instead of returning to the login loop',async({page})=>{
  const state=await setup(page); await openCheckout(page);
  await page.route('**/api/v1/customer/auth/recovery-start/',route=>route.fulfill({json:{next_action:'signup',exists:false,challenge_id:'guest-signup',resend_after:60}}));
  await page.getByLabel('Mobile Phone Number',{exact:true}).fill('9841234567');
  await page.getByRole('button',{name:'Forgot PIN?',exact:true}).click();
  await expect(page.getByText('Verify Mobile Number',{exact:true})).toBeVisible();
  for(const [index,digit] of [...'4821'].entries())await page.getByLabel(`Code digit ${index+1}`).fill(digit);
  await page.getByRole('button',{name:'Verify & Continue'}).click();
  await page.getByLabel('Full name',{exact:true}).fill('guest_customer');
  await page.getByLabel('Set Password').fill('Crisp!River49Ocean');
  await page.getByLabel('New 4-Digit Quick PIN').fill('9274');
  await page.getByRole('button',{name:'Complete & Continue to Checkout'}).click();
  await expect(page.getByAltText('Merchant payment QR')).toBeVisible();
  expect(state.writes.find(w=>w.path==='customer/auth/verify/').body.challenge_id).toBe('guest-signup');
  expect(state.writes.some(w=>w.path==='customer/auth/recovery-verify/')).toBe(false);
});

test('signup field conflicts keep profile details and never claim the phone is registered',async({page})=>{
  await setup(page); await openCheckout(page);
  await page.getByRole('button',{name:'Sign Up',exact:true}).click();
  await page.getByLabel('Mobile Phone Number',{exact:true}).fill('9841234567');
  await page.getByRole('button',{name:'Get OTP Verification Code',exact:true}).click();
  for(const [index,digit] of [...'4821'].entries())await page.getByLabel(`Code digit ${index+1}`).fill(digit);
  await page.getByRole('button',{name:'Verify & Continue'}).click();
  await page.getByLabel('Full name',{exact:true}).fill('existing_name');
  await page.getByLabel('Set Password').fill('Crisp!River49Ocean');
  await page.getByLabel('New 4-Digit Quick PIN').fill('9274');
  let attempts=0;
  await page.route('**/api/v1/customer/auth/register/',route=>{
    attempts++;
    return route.fulfill({status:400,json:attempts===1 ? {username:'This username is taken. Please choose another.'} : {email:'This email is already registered. Use another email or leave it blank.'}});
  });
  await page.getByRole('button',{name:'Complete & Continue to Checkout'}).click();
  await expect(page.getByRole('alert')).toContainText('This email is already registered');
  await expect(page.getByLabel('Full name',{exact:true})).toHaveValue('existing_name');
  await expect(page.getByText('Customer Sign In',{exact:true})).toHaveCount(0);
  expect(attempts).toBe(2);
});

test('password login preserves spaces and sends only one failed request',async({page})=>{
  await setup(page); await openCheckout(page);
  const attempts:any[]=[];
  await page.route('**/api/v1/customer/auth/login/',route=>{
    attempts.push(route.request().postDataJSON());
    return route.fulfill({status:403,json:{detail:'Mobile number or credentials are incorrect.'}});
  });
  await page.getByLabel('Mobile Phone Number',{exact:true}).fill('9841234567');
  await page.getByLabel('Account Password or PIN').fill('  Crisp!River49Ocean  ');
  await page.getByRole('button',{name:'Sign In',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Mobile number or credentials are incorrect.');
  expect(attempts).toEqual([expect.objectContaining({method:'PASSWORD',credential:'  Crisp!River49Ocean  '})]);
});


test('staff can sign in on storefront and place a personal order without changing role',async({page})=>{
  const state=await setup(page,false,'CASHIER');
  await openCheckout(page);
  await page.getByLabel('Mobile Phone Number',{exact:true}).fill('9841234567');
  await page.getByLabel('Account Password or PIN').fill('Staff-password99');
  await page.getByRole('button',{name:'Sign In',exact:true}).click();
  await expect(page.getByAltText('Merchant payment QR')).toBeVisible();
  await receipt(page);
  await page.getByRole('button',{name:/Submit Receipt & Place Order/}).click();
  await expect.poll(()=>state.created).toBe(1);
  await expect(page.getByText('WEB-REAL-7',{exact:false}).first()).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('crunchy_auth_user')!).role)).toBe('CASHIER');
  expect(state.writes.filter(w=>w.path==='customer/auth/login/').map(w=>w.body.method)).toEqual(['PASSWORD']);
  await page.goto('/profile');
  await expect(page.getByRole('heading',{name:'My Profile',exact:true})).toBeVisible();
  await expect(page.getByText('Customer Sign In',{exact:true})).toHaveCount(0);
  await expect.poll(()=>state.calls.includes('GET customer/addresses/')).toBe(true);
});

test('already signed-in staff can restore their cart and checkout without signing in again',async({page})=>{
  const state=await setup(page,true,'RESTAURANT_OWNER');
  await expect.poll(()=>state.calls.includes('GET customer/cart/')).toBe(true);
  await page.getByRole('button',{name:'Add Web Burger',exact:true}).click();
  await expect.poll(()=>state.cart.items.length).toBe(1);
  await page.reload();
  await page.getByRole('button',{name:'Shopping Cart',exact:true}).click();
  await page.locator('#cart-checkout-btn').click();
  await expect(page.getByAltText('Merchant payment QR')).toBeVisible();
  await expect(page.getByText('Customer Sign In',{exact:true})).toHaveCount(0);
  expect(state.writes.filter(w=>w.path==='customer/auth/login/')).toHaveLength(0);
});


test('customer order tracking updates over websocket and resyncs after reconnect without reload', async ({page}) => {
  const state = await setup(page, true);
  await openCheckout(page);
  await receipt(page);
  await page.getByRole('button', {name: /Submit Receipt & Place Order/}).click();
  await expect.poll(() => state.created).toBe(1);
  await expect(page).toHaveURL(/\/orders/);
  await expect(page.getByRole('heading', {name: 'Order #WEB-REAL-7'})).toBeVisible();
  let navigations = 0;
  page.on('framenavigated', frame => {if (frame === page.mainFrame()) navigations++;});
  state.orders[0].status = 'PREPARING';
  state.orders[0].version++;
  state.sockets.at(-1).send(JSON.stringify({type: 'orders_changed'}));
  await expect(page.getByText('In kitchen', {exact: true}).first()).toBeVisible();
  const connections = state.sockets.length;
  state.sockets.at(-1).close({code: 4001, reason: 'Renew connection'});
  state.orders[0].status = 'READY';
  state.orders[0].version++;
  await expect.poll(() => state.sockets.length).toBeGreaterThan(connections);
  await expect(page.getByTestId('tracking-step-READY')).toHaveAttribute('aria-current', 'step');
  expect(navigations).toBe(0);
});
