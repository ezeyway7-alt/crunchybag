import {receiptFixture} from "./receiptFixture";
import {test,expect,Page} from '@playwright/test';

async function setup(page:Page){
  const outlet={id:1,name:'Live Outlet',branch_code:'LIVE',enable_kiosk:true,enable_qr_ordering:true,enable_dine_in:true,enable_takeaway:true,accepting_orders:true};
  const product={id:'burger',category:'food',name:'Live Burger',description:'Burger',base_price:'200.00',variants:[],modifier_groups:[],images:[],dietary_tags:[],is_available:true,show_on_kiosk:true,show_on_qr:true,requires_kitchen:true};
  const state:any={orders:[],sockets:[],writes:[],revision:'0',fail:false};
  await page.addInitScript(()=>{document.cookie='csrftoken=abcdefghijklmnopqrstuvwx12345678; path=/';(window as any).__speech=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},getVoices(){return [];},speak(u:any){(window as any).__speech.push(u.text);}}});});
  await page.routeWebSocket('**/ws/**',socket=>{
    if(socket.url().includes('/display/')){
      state.sockets.push(socket);socket.onMessage(()=>socket.send(JSON.stringify({event_type:'HEARTBEAT',revision:state.revision})));
    }
  });
  await page.route('**/api/v1/**',async route=>{
    const request=route.request(),url=new URL(request.url()),path=url.pathname.replace('/api/v1/','');
    const body=request.method()==='POST' && request.postData()?request.postDataJSON():null;
    let data:any={};
    if(path.includes('branches'))data=[outlet];
    else if(path==='catalog/menu/')data={categories:[{id:'food',name:'Food',products:[product]}],valid_until:null};
    else if(path==='tables/qr/resolve/')data={branch_id:1,branch_name:'Live Outlet',table_id:2,table_number:'A2'};
    else if(path==='orders/self-service/tables/1/')data={tables:[{id:2,table_number:'A2'}]};
    else if(path==='orders/self-service/quote/')data={subtotal:'200.00',total_payable:'200.00',vat_included_amount:'23.01'};
    else if(path==='orders/self-service/checkout/'){
      state.writes.push({body,key:request.headers()['idempotency-key']});
      data=state.orders[0] || {id:5,outlet_id:1,order_number:'KIOSK-1-00000005',version:1,status:'ACCEPTED',fulfillment_type:body.fulfillment_type,order_source:body.order_source,table_number:body.order_source==='TABLE_QR'?'A2':null,customer_name:body.customer_name,customer_phone:body.customer_phone,created_at:new Date().toISOString(),subtotal:'200.00',total_payable:'200.00',paid_amount:'0.00',due_amount:'200.00',discount_amount:'0',credit_amount:'0',refunded_amount:'0',payment_method:'CASH',items:[{id:1,product_name:'Live Burger',quantity:1,unit_price:'200.00',line_total:'200.00',modifiers:[],round_number:1,requires_kitchen:true}],payments:[],receipts:[],tracking_token:'signed-order'};
      state.orders=[data];
      if(state.fail){state.fail=false;await route.abort('failed');return;}
    }else if(path==='orders/self-service/order/')data=state.orders[0];
    else if(path==='orders/self-service/receipt/')data=receiptFixture(state.orders[0]);
    else if(path==='orders/tracking/')data={order_number:state.orders[0].order_number,outlet_id:1,outlet_name:'Saved Branch',status:state.orders[0].status,fulfillment_type:state.orders[0].fulfillment_type,history:[]};
    else if(path==='orders/display/1/')data={tickets:state.orders,revision:state.revision};
    await route.fulfill({json:data});
  });
  return state;
}
const emit=(state:any,type='ORDER_TRANSITION')=>{state.revision=String(Number(state.revision)+1);for(const socket of state.sockets)socket.send(JSON.stringify({type:'display_update',event_type:type,event_id:state.revision,aggregate_id:5,order_number:state.orders[0].order_number,status:state.orders[0].status,fulfillment_type:'TAKEAWAY'}));};

test('TV receives preparation, ready, call and completion without navigation and reconnects',async({page})=>{
  const state=await setup(page);
  state.orders=[{id:5,order_number:'KIOSK-1-00000005',status:'ACCEPTED',fulfillment_type:'TAKEAWAY',created_at:new Date().toISOString()}];
  await page.goto('/tv?outlet_id=1');
  await expect(page.getByText('KIOSK-1-00000005',{exact:true}).first()).toBeVisible();
  let navigations=0;page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
  state.orders[0].status='PREPARING';emit(state);
  state.orders[0].status='READY';emit(state);
  await expect(page.locator('#tv-calling-spotlight-card')).toContainText('KIOSK-1-00000005');
  await page.getByTitle('Dismiss announcement').click();
  emit(state,'ORDER_CALL');
  await expect(page.locator('#tv-calling-spotlight-card')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>(window as any).__speech.length)).toBeGreaterThan(0);
  await page.getByTitle('Dismiss announcement').click();
  state.orders[0].status='COMPLETED';emit(state);
  await expect(page.getByText('No Orders Waiting')).toBeVisible();
  const count=state.sockets.length;state.sockets.at(-1).close({code:1001});
  await expect.poll(()=>state.sockets.length).toBe(count+1);
  expect(navigations).toBe(0);
});

test('kiosk persists the tray and contact details and retries a lost response with the same key',async({page})=>{
  const state=await setup(page);state.fail=true;
  await page.goto('/kiosk?outlet_id=1');await page.getByText('Takeaway Go',{exact:true}).click();
  await page.getByPlaceholder('Mobile #').fill('9800000000');await page.getByPlaceholder('Guest Name').fill('Suraj');
  await page.getByTitle('Quick Add 1 Item').first().click();
  await page.getByRole('button',{name:'Pay & Order',exact:true}).click();
  const confirm=page.getByRole('button',{name:/Confirm Order/});await expect(confirm).toBeEnabled();await confirm.click();
  await expect(page.getByRole('alert')).toBeVisible();await confirm.click();
  await expect(page.getByText('KIOSK-1-00000005',{exact:true}).first()).toBeVisible();
  await expect(page.getByRole('article',{name:'Order receipt'})).toContainText('Saved Street, Kathmandu');
  await expect(page.getByRole('article',{name:'Order receipt'})).toHaveAttribute('data-receipt-format','compact-v1');
  await expect(page.getByRole('link',{name:'Track this order'})).toHaveAttribute('href',/track\?token=receipt-signed/);
  expect(state.writes).toHaveLength(2);expect(state.writes[0].key).toBe(state.writes[1].key);
  expect(state.writes[0].body).toMatchObject({order_source:'KIOSK',customer_name:'Suraj',customer_phone:'9800000000',items:[{product_id:'burger',quantity:1}],expected_total:'200.00'});
  state.orders[0].status='READY';emit(state);
  await expect(page.getByRole('status').filter({hasText:'Order status: READY'}).last()).toBeVisible();
});

test('signed table QR places a real table order and receives its live status',async({page})=>{
  const state=await setup(page);
  await page.goto('/table-qr?outlet_id=1&token=signed-table');
  await expect(page.getByText('Live Burger',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Add',exact:true}).click();
  await page.getByRole('button',{name:'Review & Order',exact:true}).first().click();
  await page.getByRole('button',{name:'Send Order to Kitchen',exact:true}).click();
  expect(state.writes[0].body).toMatchObject({order_source:'TABLE_QR',qr_token:'signed-table',fulfillment_type:'DINE_IN'});
  await expect(page.getByText('A2 Order Confirmed!')).toBeVisible();
  await expect(page.getByRole('article',{name:'Order receipt'})).toContainText('Saved Kitchen Pvt Ltd');
  await expect(page.getByRole('article',{name:'Order receipt'})).toHaveAttribute('data-receipt-format','compact-v1');
  state.orders[0].status='READY';emit(state);
  await page.getByRole('button',{name:'Track Live Order & Review (QR Slip)'}).click();
  await expect(page.getByText('Live Burger',{exact:true}).last()).toBeVisible();
});


test('scanned receipt URL opens only its order and follows live status without navigation',async({page})=>{
  const state=await setup(page);state.orders=[{id:5,order_number:'K-05',status:'PREPARING',fulfillment_type:'TAKEAWAY'}];
  await page.goto('/track?token=receipt-signed');
  await expect(page.getByRole('heading',{name:'K-05',exact:true})).toBeVisible();
  await expect(page.getByRole('status').filter({hasText:'Preparing'})).toBeVisible();
  let navigations=0;page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
  state.orders[0].status='READY';emit(state);
  await expect(page.getByRole('status').filter({hasText:'Ready for pickup'})).toBeVisible();
  expect(navigations).toBe(0);
  await page.screenshot({path:test.info().outputPath('receipt-tracking.png'),fullPage:true});
});
