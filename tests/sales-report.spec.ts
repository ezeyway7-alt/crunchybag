import {test, expect} from '@playwright/test';

test('sales report filters, live updates, errors and mobile layout', async({page})=>{
  const user={id:1,username:'Report owner',role:'RESTAURANT_OWNER',outlet_id:1,is_active:true};
  const outlet={id:1,name:'Report outlet',branch_code:'REPORT'};
  await page.addInitScript(({user,outlet})=>{
    localStorage.setItem('crunchy_access_token','test-token');
    localStorage.setItem('crunchy_auth_user',JSON.stringify(user));
    localStorage.setItem('crunchy_auth_outlet',JSON.stringify(outlet));
  },{user,outlet});
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  const sockets:any[]=[];
  await page.routeWebSocket('**/ws/**',socket=>sockets.push(socket));
  const requests:URL[]=[];let fail=false, sales='1200.00';
  await page.route('**/api/v1/**',async route=>{
    const url=new URL(route.request().url()),path=url.pathname;
    let data:any={};
    if(path.endsWith('/auth/me/'))data=user;
    else if(path.includes('/branches'))data=[outlet];
    else if(path.includes('/organization'))data={name:'Restaurant'};
    else if(path.endsWith('/catalog/menu/'))data={categories:[]};
    else if(path.endsWith('/customer/profile/'))data={favorites:[]};
    else if(path.endsWith('/customer/orders/'))data={results:[]};
    else if(path.endsWith('/orders/pos/'))data={results:[],count:0};
    else if(path.endsWith('/reports/sales/')){
      requests.push(url);
      if(fail){await route.fulfill({status:503,json:{detail:'Reports temporarily unavailable'}});return;}
      const totals={sales,orders:4,average_order_value:'300.00'};
      const item={product_id:1,name:'Burger',quantity:8,item_sales:'1200.00'};
      data={summary:{...totals,average_daily_sales:'171.43',average_daily_orders:0.57},
        timeline:[{...totals,date:url.searchParams.get('start_date')}],
        tables:[{...totals,table_id:1,table__table_number:'A1'},
          {...totals,table_id:2,table__table_number:'A2',orders:9,sales:'900.00'}],top_items:[item],
        channels:['POS','TABLE_QR','KIOSK','WEBSITE'].map(order_source=>({...totals,order_source,top_items:[item]})),
        hourly:Array.from({length:24},(_,hour)=>({...totals,hour,sales:hour===12?'700.00':'0.00',orders:hour===12?14:0,average_sales:hour===12?'100.00':'0.00',average_orders:hour===12?2:0}))};
    }
    await route.fulfill({json:data});
  });
  await page.goto('/admin?tab=sales_reports');
  const report=page.getByRole('region',{name:'Sales Reports'});
  await expect(report.getByRole('heading',{name:'Sales timeline'})).toBeVisible();
  const tableOrders=report.getByRole('region',{name:'Orders by table'});
  await expect(tableOrders.getByRole('listitem').first()).toContainText('Table A2');
  await expect(tableOrders.getByRole('listitem').first()).toContainText('9 completed orders');
  await expect(tableOrders.getByText('Table A1')).toBeVisible();
  await report.getByLabel('Choose month').fill('2026-02');
  await expect.poll(()=>requests.at(-1)?.searchParams.get('end_date')).toBe('2026-02-28');
  await expect.poll(()=>requests.at(-1)?.searchParams.get('start_date')).toBe('2026-02-01');
  await report.getByLabel('From date').fill('2026-03-01');
  await report.getByRole('button',{name:'Apply dates'}).click();
  await expect(report.getByRole('alert')).toContainText('valid start and end date');
  await report.getByRole('button',{name:'Last 7 days'}).click();
  await expect(report.getByLabel('Choose month')).toHaveValue('');
  await expect(report.getByRole('alert')).toHaveCount(0);
  sales='2400.00';
  for(const socket of sockets)if(socket.url().includes('/display/'))socket.send(JSON.stringify({event_type:'ORDER_SETTLE',event_id:'sales-change'}));
  await expect(report.locator('p').filter({hasText:/^NPR 2,400$/})).toBeVisible();
  await report.getByLabel('Hourly metric').selectOption('orders');
  await expect(report.getByRole('img',{name:'Hourly average orders'})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:test.info().outputPath('sales-mobile.png'),fullPage:true});
  fail=true;
  await report.getByRole('button',{name:'Last 30 days'}).click();
  await expect(report.getByRole('alert')).toContainText('Reports temporarily unavailable');
  fail=false;
  await report.getByRole('button',{name:'Retry'}).click();
  await expect(report.getByRole('heading',{name:'Sales timeline'})).toBeVisible();
});
