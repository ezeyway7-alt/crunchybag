import {test,expect,Page} from '@playwright/test';

async function harness(page:Page, failFirst=false){
  page.on('pageerror',error=>console.log(error.message));
  let requests=0;
  await page.route('**/customer/tracking-config/**',async route=>{
    requests++;
    if(failFirst&&requests===1)return route.fulfill({status:503,json:{}});
    await new Promise(resolve=>setTimeout(resolve,350));
    return route.fulfill({json:{enabled:true,token:'phc_test',host:'https://us.i.posthog.com',replay:false}});
  });
  // Mock only the external SDK transport; exercise our actual module and hook.
  await page.route(/\/posthog-js(?:\.js)?(?:\?|$)/,route=>route.fulfill({contentType:'application/javascript',body:`
    window.captured=[];
    export default {init(token,config){
      const session=crypto.randomUUID();
      return {get_session_id:()=>session,stopSessionRecording(){},startSessionRecording(){},opt_out_capturing(){},opt_in_capturing(){},
        capture(event,properties,options){const row=config.before_send({event,properties});if(row)window.captured.push({...row,options});}};
    }};
  `}));
  await page.route('**/tracking-harness',route=>route.fulfill({contentType:'text/html',body:`
    <div id="root"></div><script type="module" src="/tests/trackingHarness.ts"></script>`}));
  await page.goto('/tracking-harness');
  await expect(page.getByText('Ready',{exact:true})).toBeVisible();
  return ()=>requests;
}

test('slow initialization retains exactly one pageview and landing session',async({page})=>{
  await harness(page);
  await expect.poll(()=>page.evaluate(()=>(window as any).captured.filter(e=>e.event==='$pageview').length)).toBe(1);
  const rows=await page.evaluate(()=>(window as any).captured);
  expect(rows.filter(e=>e.event==='landing_page_view')).toHaveLength(1);
  expect(rows.filter(e=>e.event==='session_start')).toHaveLength(1);
  expect(rows.find(e=>e.event==='$pageview').options.send_instantly).toBe(true);
  expect(rows.find(e=>e.event==='$pageview').options.uuid).toBeTruthy();
});

test('configuration failure retries the original landing without duplicating it',async({page})=>{
  const requests=await harness(page,true);
  await expect.poll(()=>requests()).toBeGreaterThan(1);
  await expect.poll(()=>page.evaluate(()=>(window as any).captured.filter(e=>e.event==='$pageview').length)).toBe(1);
  expect(await page.evaluate(()=>(window as any).captured.filter(e=>e.event==='landing_page_view').length)).toBe(1);
});

test('returning from a disabled tracker resumes capture and still respects privacy',async({page})=>{
  await harness(page);
  await expect.poll(()=>page.evaluate(()=>(window as any).captured.filter(e=>e.event==='$pageview').length)).toBe(1);
  await page.evaluate(async()=>{
    const t=(window as any).tracker;t.configureTracking('1',false);t.configureTracking('1',true);
    t.trackEvent('add_to_cart',{product_id:'burger'});await t.flushTracking();
  });
  await expect.poll(()=>page.evaluate(()=>(window as any).captured.filter(e=>e.event==='add_to_cart').length)).toBe(1);
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'doNotTrack',{value:'1',configurable:true});
    (window as any).tracker.configureTracking('1',true);(window as any).tracker.trackEvent('checkout_start');
  });
  expect(await page.evaluate(()=>(window as any).captured.some(e=>e.event==='checkout_start'))).toBe(false);
});
