import {test,expect} from '@playwright/test';

test('TV menu fits eight products in two rows with compact header and footer',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.routeWebSocket('**/ws/**',()=>{});
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    let data:any={};
    if(path.includes('branches'))data=[{id:1,name:'TV Outlet',branch_code:'TV'}];
    else if(path.endsWith('/catalog/menu/'))data={categories:[{id:'food',name:'Food',products:Array.from({length:12},(_,i)=>({id:`item-${i}`,category:'food',name:`Menu item ${i+1}`,description:'Fresh food',base_price:'200.00',variants:[],modifier_groups:[],images:[],dietary_tags:[],is_available:true,is_web_visible:true}))}]};
    else if(path.includes('/orders/display/'))data={tickets:[]};
    await route.fulfill({json:data});
  });
  await page.goto('/tv');
  await expect(page.getByRole('heading',{name:'Our Menu',exact:true})).toBeVisible();
  const first=page.locator('.tv-menu-page').first();
  await expect(first.locator('article')).toHaveCount(8);
  for(const size of [{width:1920,height:1080},{width:1366,height:768}]){
    await page.setViewportSize(size);
    const boxes=await first.locator('article').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
    expect(new Set(boxes.map(r=>Math.round(r.top))).size).toBe(2);
    const header=await page.locator('header').boundingBox();
    const footer=await page.locator('footer').boundingBox();
    for(const box of boxes){expect(box.top).toBeGreaterThanOrEqual(header!.y+header!.height);expect(box.bottom).toBeLessThanOrEqual(footer!.y);}
  }
  await expect(page.locator('.tv-menu-screen')).not.toContainText(/Tihar|Chhath|Diwali/i);
});
