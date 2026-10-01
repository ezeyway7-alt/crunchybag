import {receiptFixture} from './receiptFixture';
import { test, expect, Page } from "@playwright/test";

async function setup(page: Page) {
  const user = {
    id: 1,
    username: "test-owner",
    role: "RESTAURANT_OWNER",
    outlet_id: 1,
    is_active: true,
  };
  const outlet = { id: 1, name: "Test outlet", branch_code: "TEST" };
  await page.addInitScript(
    ({ user, outlet }) => {
      localStorage.setItem("crunchy_access_token", "test-token");
      localStorage.setItem("crunchy_auth_user", JSON.stringify(user));
      localStorage.setItem("crunchy_auth_outlet", JSON.stringify(outlet));
      document.cookie = "csrftoken=abcdefghijklmnopqrstuvwx12345678; path=/";
    },
    { user, outlet },
  );
  const product = {
    id: "burger",
    category: "food",
    name: "Test Burger",
    description: "",
    base_price: "200.00",
    is_available: true,
    show_on_pos: true,
    variants: [],
    modifier_groups: [],
    images: [],
    dietary_tags: [],
    requires_kitchen: true,
  };
  const category = {
    id: "food",
    name: "Food",
    is_archived: false,
    products: [product],
  };
  const state: any = {
    orders: [],
    groups: [],
    tables: [],
    calls: [],
    writes: [],
    sockets: [],
    revision: "initial",
    menuRevision: 0,
    failCreate: false,
    loseCreateResponse: false,
    savedResponses: {},
    receipts: {},
  };
  const money = (value: number) => value.toFixed(2);
  const quote = (subtotal: number, discount = 0) => ({
    subtotal: money(subtotal),
    discount_amount: money(discount),
    service_charge_amount: money((subtotal - discount) * 0.1),
    cash_round_down_savings: "0.00",
    vat_included_amount: "0.00",
    total_payable: money((subtotal - discount) * 1.1),
  });
  function saveReceipt(order: any, kind: string) {
    const id = Object.keys(state.receipts).length + 1;
    const row = { id, number: `${kind}-SAVED-${id}`, kind };
    state.receipts[id] = { ...receiptFixture(order,kind), ...row, created_at: order.created_at, snapshot: { ...JSON.parse(JSON.stringify(order)), seller: { name: 'Registered seller', outlet: 'Test outlet', pan: '123456789', address: 'Actual outlet address' } } };
    order.receipts.push(row);
  }
  await page.routeWebSocket("**/ws/**", (ws) => {
    if (ws.url().includes("/ws/pos/")) {
      state.sockets.push(ws);
      ws.send(JSON.stringify({ event_type: "CONNECTED" }));
      ws.onMessage(() =>
        ws.send(
          JSON.stringify({
            event_type: "HEARTBEAT",
            revision: state.revision,
            menu_revision: state.menuRevision,
          }),
        ),
      );
    }
  });
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    const path = url.pathname.replace("/api/v1/", "");
    state.calls.push(`${request.method()} ${path}`);
    console.log("POS_CALL:", `${request.method()} ${path}`);
    const body = request.method() === "POST" ? request.postDataJSON() : null;
    if (body && !path.endsWith("quote/") && !path.endsWith("socket-ticket/"))
      state.writes.push({
        path,
        body,
        key: request.headers()["idempotency-key"],
      });
    const mutationKey = request.headers()["idempotency-key"];
    if (path === "orders/pos/" && body && state.savedResponses[mutationKey]) {
      await route.fulfill({ json: state.savedResponses[mutationKey] });
      return;
    }
    let result: any = {};
    if (path === "auth/me/") result = { user, outlet };
    else if (path.includes("branches")) result = [outlet];
    else if (path === "catalog/management/")
      result = {
        products: [product],
        categories: [category],
        schedules: [],
        overrides: {},
      };
    else if (path === "catalog/menu/")
      result = {
        categories: [category],
        revision: state.menuRevision,
        valid_until: null,
      };
    else if (path === "orders/pos/socket-ticket/")
      result = { ticket: "test-ticket", path: "/ws/pos/1/" };
    else if (path === "orders/pos/meta/")
      result = {
        outlet_id: 1,
        outlet_name: "Test outlet",
        tables: state.tables,
        inactive_tables: [],
        table_groups: state.groups,
        permissions: {
          orders: true,
          billing: true,
          kitchen: true,
          discount: true,
          refund: true,
        },
        fulfillment_modes: ["TAKEAWAY", "DINE_IN"],
        payment_methods: ["CASH", "CARD", "CREDIT"],
        accepting_orders: true,
      };
    else if (path === "orders/pos/table-groups/") {
      result = { id: state.groups.length + 1, name: body.name };
      state.groups.push(result);
    } else if (path === "orders/pos/tables/") {
      result = {
        id: state.tables.length + 1,
        table_number: body.table_number,
        capacity: body.capacity,
        section: state.groups.find((g) => g.id === body.group_id).name,
        active_order_id: null,
      };
      state.tables.push(result);
    } else if (path === "orders/pos/quote/") {
      const subtotal = body.items.reduce((n, i) => n + i.quantity * 200, 0);
      const prior = state.orders.find((o) => o.id === body.order_id);
      result = {
        ...quote(
          subtotal + Number(prior?.subtotal || 0),
          Number(body.discount_amount || 0),
        ),
        items: body.items.map((i) => ({
          ...i,
          unit_price: "200.00",
          line_total: money(i.quantity * 200),
        })),
        ...(prior ? { order_version: prior.version } : {}),
      };
    } else if (path === "orders/pos/" && body) {
      if (state.failCreate) {
        state.failCreate = false;
        await route.fulfill({
          status: 409,
          json: { detail: "Menu prices changed. Review a fresh quote." },
        });
        return;
      }
      if (!body.items || !body.expected_total) {
        await route.fulfill({
          status: 400,
          json: { detail: "Invalid creation contract" },
        });
        return;
      }
      result = {
        id: state.orders.length + 1,
        outlet_id: 1,
        order_number: "POS-TEST-1",
        version: 1,
        can_append: true,
        status: "ACCEPTED",
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        fulfillment_type: body.fulfillment_type,
        table_id: body.table_id,
        table_number:
          state.tables.find((t) => t.id === body.table_id)?.table_number ||
          null,
        created_at: new Date().toISOString(),
        notes: body.notes,
        delivery_address: "",
        ...quote(
          body.items.reduce((n, i) => n + i.quantity * 200, 0),
          Number(body.discount_amount),
        ),
        paid_amount: "0.00",
        credit_amount: "0.00",
        refunded_amount: "0.00",
        due_amount: body.expected_total,
        unallocated_due: body.expected_total,
        settlement: "UNPAID",
        payment_method: body.payment_method,
        billed_at: null,
        payments: [],
        receipts: [],
        items: body.items.map((i, n) => ({
          id: n + 1,
          product_id: i.product_id,
          product_name: product.name,
          variant_name: "",
          quantity: i.quantity,
          unit_price: "200.00",
          line_total: money(i.quantity * 200),
          requires_kitchen: true,
          kitchen_status: "WAITING",
          round_number: 1,
          item_notes: "",
          is_voided: false,
          modifiers: [],
          combo_components: [],
        })),
      };
      saveReceipt(result, "TOKEN");
      state.orders.push(result);
      state.savedResponses[mutationKey] = JSON.parse(JSON.stringify(result));
      if (state.loseCreateResponse) {
        state.loseCreateResponse = false;
        await route.fulfill({
          status: 503,
          json: { detail: "Response lost after saving" },
        });
        return;
      }
      const table = state.tables.find((t) => t.id === body.table_id);
      if (table) table.active_order_id = result.id;
    } else if (path.startsWith("orders/pos/receipts/")) result = state.receipts[path.split("/")[3]];
    else if (/^orders\/pos\/\d+\//.test(path)) {
      const id = Number(path.split("/")[2]);
      result = state.orders.find((o) => o.id === id);
      if (path.endsWith("/billing-quote/"))
        result = {
          ...quote(Number(result.subtotal), Number(body.discount_amount)),
          due_amount: money(
            (Number(result.subtotal) - Number(body.discount_amount)) * 1.1 -
            Number(result.paid_amount),
          ),
        };
      else if (path.endsWith('/transition/')) { result.status = body.status; result.version++; }
      else if (path.endsWith('/round/')) {
        result.rounds ||= [{number:1,status:result.status,created_at:result.created_at}];
        result.rounds.find((r:any)=>r.number===body.round_number).status=body.status;
        result.items.filter((i:any)=>i.round_number===body.round_number).forEach((i:any)=>i.kitchen_status=body.status);
        result.status=result.rounds.every((r:any)=>r.status==='SERVED')?'COMPLETED':result.rounds.every((r:any)=>['READY','SERVED'].includes(r.status))?'READY':'PREPARING';
        result.version++;
      }
      else if (path.endsWith('/bill/')) { saveReceipt(result, 'BILL'); result.version++; }
      else if (path.endsWith("/append/")) {
        if (
          !body.items ||
          body.version !== result.version ||
          !body.expected_total
        ) {
          await route.fulfill({
            status: 400,
            json: { detail: "Invalid append contract" },
          });
          return;
        }
        Object.assign(
          result,
          quote(
            Number(result.subtotal) +
            body.items.reduce((n, i) => n + i.quantity * 200, 0),
          ),
        );
        result.version++;
        result.due_amount = result.total_payable;
        saveReceipt(result, "TOKEN");
      } else if (path.endsWith("/settle/")) {
        if (body.version !== result.version) {
          await route.fulfill({
            status: 409,
            json: { detail: "Version conflict" },
          });
          return;
        }
        const incoming = body.tenders.reduce((n, t) => n + Number(t.amount), 0);
        result.paid_amount = money(Number(result.paid_amount) + incoming);
        result.due_amount = money(
          Number(result.total_payable) - Number(result.paid_amount),
        );
        result.version++;
        result.settlement =
          Number(result.due_amount) === 0 ? "PAID" : "PARTIAL";
        result.payments.push(
          ...body.tenders.map((t, i) => ({
            id: `${result.version}-${i}`,
            method: t.method,
            amount: t.amount,
            reference: t.reference,
            status: "SUCCESS",
          })),
        );
        saveReceipt(result, "BILL");
      }
    } else if (path === "orders/pos/")
      result = {
        results: url.searchParams.get("kitchen") ? state.orders.filter(o => ["PENDING", "ACCEPTED", "PREPARING", "READY"].includes(o.status)) : state.orders,
        count: state.orders.length,
        page: 1,
        page_size: 25,
        summary: {
          final: money(
            state.orders.reduce((n, o) => n + Number(o.total_payable), 0),
          ),
          paid: money(
            state.orders.reduce((n, o) => n + Number(o.paid_amount), 0),
          ),
          due: money(
            state.orders.reduce((n, o) => n + Number(o.due_amount), 0),
          ),
          credit: "0.00",
          refunded: "0.00",
          methods: {},
        },
        status_counts: {},
      };
    await route.fulfill({ json: result });
  });
  await page.goto("/admin?tab=pos_orders");
  await expect(
    page.getByRole("button", { name: /Test Burger/ }),
  ).toBeVisible();
  await expect(page.getByText("No orders match your filter criteria.")).toBeVisible();
  return state;
}

const addBurger = (page: Page) => page.getByRole('button', { name: /Test Burger/ }).click();
const fireOrder = (page: Page) => page.getByRole('button', { name: /FIRE ORDER TO KITCHEN/ });

test('an unchanged cart does not repeat quotes, metadata, or socket tickets while idle', async ({ page }) => {
  const state = await setup(page);
  await addBurger(page);
  await expect(fireOrder(page)).toBeEnabled();
  await page.waitForTimeout(600);
  await page.clock.install();
  const before = [...state.calls];
  const socketCount = state.sockets.length;
  await page.clock.runFor(95000);
  expect(state.calls).toEqual(before);
  expect(state.sockets).toHaveLength(socketCount);
  await expect(fireOrder(page)).toBeEnabled();
  // The server renews authenticated POS sockets after five minutes.
  state.sockets.at(-1).close({ code: 4001 });
  await page.clock.runFor(3000);
  await expect.poll(() => state.sockets.length).toBe(socketCount + 1);
  await page.clock.runFor(1200);
  await expect(fireOrder(page)).toBeEnabled();
  await expect.poll(() => state.calls.filter(c => c === 'POST orders/pos/quote/').length)
    .toBe(before.filter(c => c === 'POST orders/pos/quote/').length + 1);
  const afterReconnect = [...state.calls];
  await page.clock.runFor(95000);
  expect(state.calls).toEqual(afterReconnect);
});

test('restored POS is empty without backend data and stays idle without REST polling', async ({ page }) => {
  const state = await setup(page);
  await expect(page.getByText('NPR NaN')).toHaveCount(0);
  await page.getByRole('button', { name: /Add to Ongoing Tab/ }).click();
  await expect(page.getByText(/No active open orders currently/)).toBeVisible();
  await page.getByRole('button', { name: /Floor Tables/ }).click();
  await expect(page.getByText('No tables configured.')).toBeVisible();
  await expect(page.getByText('T-01', { exact: true })).toHaveCount(0);
  await page.waitForTimeout(600);
  await page.clock.install();
  const before = state.calls.length;
  await page.clock.runFor(95000);
  expect(state.calls.length).toBe(before);
  state.revision = 'changed';
  state.sockets.at(-1).send(JSON.stringify({ event_type: 'ORDER_CREATE', event_id: state.revision }));
  await page.clock.runFor(1200);
  await expect.poll(() => state.calls.length).toBe(before + 3);
  state.sockets.at(-1).send(JSON.stringify({ event_type: 'ORDER_CREATE', event_id: state.revision }));
  await page.clock.runFor(1000);
  expect(state.calls.length).toBe(before + 3);
});

test('original table cards create real orders, append rounds, and settle only the remaining balance', async ({ page }) => {
  const state = await setup(page);
  await page.getByRole('button', { name: /Manage Floors & Tables/ }).click();
  await page.getByLabel('Floor or group name').fill('First floor');
  await page.getByRole('button', { name: 'Add group', exact: true }).click();
  await page.getByLabel('Table group').selectOption('1');
  await page.getByLabel('Table label').fill('Window A');
  await page.getByLabel('Seats', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Add table', exact: true }).click();
  await expect.poll(() => state.tables.length).toBe(1);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: /Floor Tables/ }).click();
  await page.getByRole('button', { name: /Window A Available 6 Seats/ }).click();
  await addBurger(page);
  await expect(fireOrder(page)).toBeEnabled();
  await fireOrder(page).click();
  await expect(page.getByRole('button', { name: 'Close dialog' })).toBeVisible();
  expect(state.writes.find(w => w.path === 'orders/pos/').body).toMatchObject({ table_id: 1, fulfillment_type: 'DINE_IN', expected_total: '220.00', items: [{ product_id: 'burger', quantity: 1 }] });
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: /Add to Ongoing Tab/ }).click();
  await addBurger(page);
  await page.getByRole('button', { name: 'Add Round to Tab' }).click();
  await expect.poll(() => state.orders[0].version).toBe(2);
  expect(state.writes.find(w => w.path.endsWith('/append/')).body).toMatchObject({ version: 1, expected_total: '440.00', items: [{ product_id: 'burger' }] });
  await page.getByRole('button', { name: /Floor Tables/ }).click();
  await page.getByRole('button', { name: 'Bill', exact: true }).first().click();
  await expect(page.getByLabel('Amount applied')).toHaveValue('440');
  await page.getByLabel('Amount applied').fill('100');
  await page.getByRole('button', { name: 'Confirm Settlement & Print Tax Invoice', exact: true }).click();
  await expect.poll(() => state.orders[0].paid_amount).toBe('100.00');
  await expect(page.getByText('Registered seller', { exact: true })).toBeVisible();
  await expect(page.getByText('PAN/VAT: 123456789')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByLabel('Amount applied')).toHaveValue('340');
  await page.getByLabel('Amount applied').fill('140');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByLabel('Payment method', { exact: true }).nth(1).selectOption('CARD');
  await expect(page.getByLabel('Amount applied').nth(1)).toHaveValue('200');
  await page.getByRole('button', { name: 'Confirm Settlement & Print Tax Invoice', exact: true }).click();
  await expect.poll(() => state.orders[0].paid_amount).toBe('440.00');
  const payments = state.writes.filter(w => w.path.endsWith('/settle/'));
  expect(payments).toHaveLength(2);
  expect(payments[1].body.tenders).toEqual([{ method: 'CASH', amount: '140', reference: '' }, { method: 'CARD', amount: '200', reference: '' }]);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('button', { name: 'Confirm Settlement & Print Tax Invoice', exact: true })).toBeDisabled();
  await page.screenshot({ path: test.info().outputPath('original-billing.png'), fullPage: true });
});

test('rejected create preserves the original ticket for review', async ({ page }) => {
  const state = await setup(page); state.failCreate = true;
  await addBurger(page); await fireOrder(page).click();
  await expect(page.getByText('Menu prices changed. Review a fresh quote.', { exact: true })).toBeVisible();
  expect(state.orders).toHaveLength(0);
  await expect(fireOrder(page)).toBeEnabled();
  await fireOrder(page).click();
  await expect.poll(() => state.orders.length).toBe(1);
  expect(state.writes.filter(w => w.path === 'orders/pos/')[1].body.items).toHaveLength(1);
});

test('lost response recovers the same request without a duplicate order', async ({ page }) => {
  const state = await setup(page); state.loseCreateResponse = true;
  await addBurger(page); await fireOrder(page).click();
  await page.getByRole('button', { name: 'Recover pending order action' }).click();
  await expect(page.getByRole('button', { name: 'Close dialog' })).toBeVisible();
  const writes = state.writes.filter(w => w.path === 'orders/pos/');
  expect(writes).toHaveLength(2); expect(writes[0].key).toBe(writes[1].key);
  expect(writes[0].body).toEqual(writes[1].body); expect(state.orders).toHaveLength(1);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(fireOrder(page)).toBeDisabled();
});


test('restored kitchen cards use actual orders and backend transitions', async ({ page }) => {
  const state = await setup(page);
  await addBurger(page); await fireOrder(page).click();
  await expect.poll(() => state.orders.length).toBe(1);
  await page.goto('/admin?tab=kitchen');
  await expect(page.getByText('Test Burger', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /START COOKING/ }).click();
  await expect.poll(() => state.orders[0].status).toBe('PREPARING');
  await page.getByRole('button', { name: 'MARK READY FOR PICKUP' }).click();
  await expect.poll(() => state.orders[0].status).toBe('READY');
  await page.getByRole('button', { name: 'HAND OVER ROUND' }).click();
  await expect(page.getByText('Test Burger', { exact: true })).toHaveCount(0);
  expect(state.orders[0].status).toBe('COMPLETED');
  expect(state.writes.filter(w => w.path.endsWith('/round/')).map(w => w.body.version)).toEqual([1, 2, 3]);
});

test('delivery kitchen handover dispatches instead of completing the order',async({page})=>{
  const state=await setup(page);await addBurger(page);await fireOrder(page).click();
  await expect.poll(()=>state.orders.length).toBe(1);
  Object.assign(state.orders[0],{fulfillment_type:'DELIVERY',status:'READY'});
  await page.goto('/admin?tab=kitchen');
  await page.getByRole('button',{name:'DISPATCH ORDER',exact:true}).click();
  await expect.poll(()=>state.orders[0].status).toBe('OUT_FOR_DELIVERY');
  await expect(page.getByText('Test Burger',{exact:true})).toHaveCount(0);
  const command=state.writes.find(w=>w.path.endsWith('/transition/'));
  expect(command.key).toBeTruthy();expect(command.body.status).toBe('OUT_FOR_DELIVERY');
});


test('staff token and settled bill use the same saved compact receipt and tracking QR',async({page})=>{
  const state=await setup(page);await addBurger(page);await expect(fireOrder(page)).toBeEnabled();await fireOrder(page).click();
  const paper=page.getByRole('article',{name:'Order receipt'});
  await expect(paper).toHaveAttribute('data-receipt-format','compact-v1');
  await expect(paper).toContainText('Actual outlet address');
  await expect(paper.getByTestId('receipt-order-number')).toHaveText(state.orders[0].order_number);
  const tracking=await paper.getByRole('link',{name:'Track this order'}).getAttribute('href');
  await page.getByRole('button',{name:'Close dialog'}).click();
  await page.getByRole('button',{name:'Bill',exact:true}).first().click();
  await expect(page.getByLabel('Amount applied')).toHaveValue('220');
  await page.getByRole('button',{name:'Confirm Settlement & Print Tax Invoice',exact:true}).click();
  await expect(paper).toHaveAttribute('data-receipt-format','compact-v1');
  await expect(paper).toContainText('Tax invoice');await expect(paper).toContainText('PAN/VAT: 123456789');
  await expect(paper.getByRole('link',{name:'Track this order'})).toHaveAttribute('href',tracking!);
  await expect.poll(()=>state.orders[0].paid_amount).toBe('220.00');
  await page.screenshot({path:test.info().outputPath('compact-staff-bill.png'),fullPage:true});
});


test('website analytics and customer directory show real scoped data with simple graph and search',async({page})=>{
  await setup(page);
  let trafficReads=0;const sockets:any[]=[];
  await page.routeWebSocket('**/ws/outlets/1/analytics/',ws=>{sockets.push(ws);ws.onMessage(()=>ws.send(JSON.stringify({event_type:'HEARTBEAT',revision:'initial'})));});
  await page.route('**/api/v1/customer/analytics/**',route=>{trafficReads++;return route.fulfill({json:{visitors:12,sessions:15,page_views:25,daily:[{date:'2026-09-29',visitors:5,page_views:10},{date:'2026-09-30',visitors:7,page_views:15}],channels:[{channel:'WEBSITE',page_views:20},{channel:'TABLE_QR',page_views:5}],pages:[{path:'/menu',page_views:25}]}});});
  await page.route('**/api/v1/customer/directory/**',route=>{const search=new URL(route.request().url()).searchParams.get('search');return route.fulfill({json:{count:search==='missing'?0:1,page:1,page_size:25,results:search==='missing'?[]:[{id:1,name:'Suraj',phone:'+9779841234567',email:'',registered:true,sources:['WEBSITE','TABLE_QR','KIOSK'],orders:3,order_total:'600.00',last_seen:'2026-09-30T10:00:00Z',last_login:'2026-09-30T09:00:00Z'}]}});});
  await page.getByRole('button',{name:'Website Analytics',exact:true}).click();
  await expect(page.getByRole('img',{name:'Daily website visitors'})).toBeVisible();
  await expect(page.getByRole('region',{name:'Website Analytics'})).toContainText('12');
  await page.getByLabel('Traffic period').selectOption('7');
  await expect.poll(()=>trafficReads).toBeGreaterThan(1);
  const beforeLive=trafficReads;sockets.at(-1).send(JSON.stringify({event_type:'HEARTBEAT',revision:'new-visit'}));
  await expect.poll(()=>trafficReads).toBeGreaterThan(beforeLive);
  await page.mouse.move(950,400);await page.waitForTimeout(300);await page.screenshot({path:test.info().outputPath('website-analytics.png'),fullPage:true});
  await page.getByRole('button',{name:'Customers',exact:true}).click();
  await expect(page.getByRole('cell',{name:'Suraj',exact:true})).toBeVisible();
  await expect(page.getByRole('cell',{name:'+9779841234567',exact:true})).toBeVisible();
  await page.getByLabel('Search customers').fill('missing');
  await expect(page.getByText('No customers match your search.')).toBeVisible();
  await page.getByLabel('Search customers').fill('Suraj');
  await expect(page.getByRole('cell',{name:'Suraj',exact:true})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:test.info().outputPath('customer-directory-mobile.png'),fullPage:true});
});

test('organization SMS token stays write only and blank keeps existing credential',async({page})=>{
  await setup(page);const writes:any[]=[];
  await page.route('**/api/v1/organization/',route=>{if(route.request().method()==='PATCH')writes.push(route.request().postDataJSON());return route.fulfill({json:{id:1,name:'Kitchen',sms_enabled:true,sms_sender:'Approved',sms_token_configured:true,sms_admin_numbers:'9841234567',sms_keyword:'',sms_shortcode:'',sms_public_base_url:'https://crunchybag.com'}});});
  await page.getByRole('button',{name:'Organization',exact:true}).click();
  await expect(page.getByLabel('Sparrow SMS API Token')).toHaveValue('');
  await expect(page.getByLabel('Sender Identity (From)')).toHaveValue('Approved');
  await page.getByRole('button',{name:'Save SMS Settings'}).click();
  await expect(page.getByText('SMS settings saved',{exact:true})).toBeVisible();expect(writes.at(-1)).not.toHaveProperty('sms_api_token');
  await page.getByLabel('Sparrow SMS API Token').fill('new-secret');
  await page.getByRole('button',{name:'Save SMS Settings'}).click();
  await expect(page.getByLabel('Sparrow SMS API Token')).toHaveValue('');expect(writes.at(-1).sms_api_token).toBe('new-secret');
});


test('kitchen hands over a ready round while the next round keeps its own timer and progress',async({page})=>{
  const state=await setup(page);await addBurger(page);await fireOrder(page).click();
  await expect.poll(()=>state.orders.length).toBe(1);
  const order=state.orders[0],first=new Date(Date.now()-15*60000).toISOString(),second=new Date(Date.now()-2*60000).toISOString();
  order.status='PREPARING';order.items[0].kitchen_status='READY';
  order.items.push({...order.items[0],id:2,round_number:2,kitchen_status:'PREPARING',product_name:'Later Burger'});
  order.rounds=[{number:1,status:'READY',created_at:first},{number:2,status:'PREPARING',created_at:second}];
  await page.goto('/admin?tab=kitchen');
  await expect(page.getByText('Later Burger',{exact:true})).toBeVisible();
  await expect(page.getByText('Test Burger',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'HAND OVER ROUND',exact:true}).click();
  await expect(page.getByText('Test Burger',{exact:true})).toHaveCount(0);
  await expect(page.getByText('Later Burger',{exact:true})).toBeVisible();
  expect(order.status).toBe('PREPARING');expect(order.rounds[1].created_at).toBe(second);
  expect(state.writes.find((w:any)=>w.path.endsWith('/round/')).body).toMatchObject({round_number:1,status:'SERVED',version:1});
  await page.getByRole('button',{name:'MARK READY FOR PICKUP'}).click();
  await page.getByRole('button',{name:'HAND OVER ROUND',exact:true}).click();
  await expect.poll(()=>order.status).toBe('COMPLETED');
  expect(state.writes.filter((w:any)=>w.path.endsWith('/round/')).map((w:any)=>w.body.round_number)).toEqual([1,2,2]);
});
