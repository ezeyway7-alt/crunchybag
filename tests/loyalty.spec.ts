import {test, expect, Page} from '@playwright/test';

async function setup(page:Page) {
  const user={id:1,username:'Loyalty owner',role:'RESTAURANT_OWNER',outlet_id:1,is_active:true};
  const outlet={id:1,name:'Real outlet',branch_code:'REAL'};
  const state:any={enabled:false,version:1,tiers:[],can_manage:true,customer_count:0,customers:[],discounts:[]};
  const sockets:any[]=[];
  await page.addInitScript(({user,outlet})=>{
    localStorage.setItem('crunchy_access_token','test-token');
    localStorage.setItem('crunchy_auth_user',JSON.stringify(user));
    localStorage.setItem('crunchy_auth_outlet',JSON.stringify(outlet));
    document.cookie='csrftoken=abcdefghijklmnopqrstuvwx12345678; path=/';
  },{user,outlet});
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.routeWebSocket('**/ws/**',socket=>{sockets.push(socket);});
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    let data:any={};
    if(path.endsWith('/auth/me/'))data=user;
    else if(path.includes('/branches'))data=[outlet];
    else if(path.includes('/organization'))data={name:'Real restaurant'};
    else if(path.endsWith('/customer/profile/'))data={favorites:[],member_since:'2026-01-01'};
    else if(path.endsWith('/customer/orders/'))data={results:[]};
    else if(path.endsWith('/catalog/menu/'))data={categories:[]};
    else if(path.endsWith('/loyalty/')){
      if(route.request().method()==='PUT'){
        const body=route.request().postDataJSON();
        if(body.version!==state.version){await route.fulfill({status:409,json:{detail:'Loyalty rules changed. Reload them before saving.'}});return;}
        Object.assign(state,body,{version:state.version+1});
      }
      data=state;
    }
    await route.fulfill({json:data});
  });
  await page.goto('/admin?tab=loyalty');
  return {state,sockets};
}

test('loyalty starts clean, saves spending tiers, and persists them after reload',async({page})=>{
  const {state}=await setup(page);
  const loyalty=page.getByTestId('loyalty-page');
  await expect(loyalty.getByText('No loyalty tiers yet')).toBeVisible();
  await loyalty.getByRole('button',{name:'Customers',exact:true}).click();
  await expect(loyalty.getByText(/No matching customers/)).toBeVisible();
  await loyalty.getByRole('button',{name:'Applied discounts',exact:true}).click();
  await expect(loyalty.getByText('No loyalty discounts applied yet.')).toBeVisible();
  await loyalty.getByRole('button',{name:'Spending tiers',exact:true}).click();
  await loyalty.getByRole('checkbox',{name:'Enable automatic loyalty discounts'}).check();
  for(const [index,threshold] of ['10000','22000','27000'].entries()){
    await loyalty.getByRole('button',{name:'Add tier',exact:true}).click();
    await loyalty.getByLabel(`Tier ${index+1} name`,{exact:true}).fill(['Silver','Gold','Platinum'][index]);
    await loyalty.getByLabel(`Tier ${index+1} threshold`,{exact:true}).fill(threshold);
    await loyalty.getByLabel(`Tier ${index+1} percent`,{exact:true}).fill(String((index+1)*5));
  }
  await loyalty.getByRole('button',{name:'Save rules',exact:true}).click();
  await expect(loyalty.getByText(/Loyalty rules saved/)).toBeVisible();
  expect(state.tiers.map((t:any)=>t.threshold)).toEqual(['10000','22000','27000']);
  await page.reload();
  await expect(loyalty.getByLabel('Tier 3 threshold',{exact:true})).toHaveValue('27000');
  await expect(loyalty.getByRole('checkbox')).toBeChecked();
  await page.screenshot({path:test.info().outputPath('loyalty-tiers.png'),fullPage:true});
});

test('loyalty customer directory follows real order events without overwriting unsaved rules',async({page})=>{
  const {state,sockets}=await setup(page);
  const loyalty=page.getByTestId('loyalty-page');
  await expect(loyalty.getByText('No loyalty tiers yet')).toBeVisible();
  await loyalty.getByRole('button',{name:'Add tier',exact:true}).click();
  await loyalty.getByLabel('Tier 1 name',{exact:true}).fill('Unsaved tier');
  state.customer_count=1;
  state.customers=[{name:'Actual customer',phone:'+9779800000000',total_spent:'10000',paid_orders:4,tier:null}];
  await expect.poll(()=>sockets.length).toBeGreaterThan(0);
  for(const socket of sockets)if(socket.url().includes('/display/'))socket.send(JSON.stringify({event_type:'ORDER_SETTLE',event_id:'paid-event'}));
  await loyalty.getByRole('button',{name:'Customers',exact:true}).click();
  await expect(loyalty.getByText('Actual customer',{exact:true})).toBeVisible();
  await expect(loyalty.getByText('+9779800000000',{exact:true})).toHaveCount(1);
  await loyalty.getByRole('button',{name:'Spending tiers',exact:true}).click();
  await expect(loyalty.getByLabel('Tier 1 name',{exact:true})).toHaveValue('Unsaved tier');
});
