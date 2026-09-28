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
    } else if (/^orders\/pos\/\d+\//.test(path)) {
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
      }
    } else if (path === "orders/pos/")
      result = {
        results: state.orders,
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
    page.getByRole("button", { name: "Test Burger NPR 200.00" }),
  ).toBeVisible();
  await expect(page.getByText("No orders match these filters.")).toBeVisible();
  return state;
}

test("idle POS does not poll REST or fall back to sample orders/tables", async ({
  page,
}) => {
  const state = await setup(page);
  await expect(page.getByText("NPR NaN")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add to ongoing", exact: true })
    .click();
  await expect(
    page.getByText("No ongoing orders.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Floor & tables", exact: true })
    .click();
  await expect(
    page.getByText("No tables configured.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("T-01", { exact: true })).toHaveCount(0);
  await page.clock.install();
  const before = state.calls.length;
  await page.clock.fastForward(95000);
  await page.waitForTimeout(500);
  expect(state.calls.length).toBe(before);
  expect(
    state.calls.filter((c) => c.endsWith("socket-ticket/")).length,
  ).toBeLessThanOrEqual(2);
  state.revision = "order-change";
  state.sockets
    .at(-1)
    .send(
      JSON.stringify({ event_type: "ORDER_CREATE", event_id: state.revision }),
    );
  await page.clock.runFor(1000);
  await expect.poll(() => state.calls.length).toBe(before + 3);
  const after = state.calls.length;
  state.sockets
    .at(-1)
    .send(
      JSON.stringify({ event_type: "ORDER_CREATE", event_id: state.revision }),
    );
  await page.clock.runFor(1000);
  expect(state.calls.length).toBe(after);
});

test("create floor/table, take quoted table order, append and settle split payment", async ({
  page,
}) => {
  const state = await setup(page);
  await page
    .getByRole("button", { name: "Floor & tables", exact: true })
    .click();
  await page.getByRole("button", { name: "Manage floors & tables" }).click();
  await page.getByLabel("Group name").fill("First floor");
  await page.getByRole("button", { name: "Save group", exact: true }).click();
  await expect(page.getByRole("option", { name: "First floor" })).toHaveCount(
    1,
  );
  await page
    .getByRole("combobox", { name: "Floor / group", exact: true })
    .selectOption("1");
  await page.getByLabel("Table label").fill("Window A");
  await page.getByLabel("Seats", { exact: true }).fill("6");
  await page.getByRole("button", { name: "Save table", exact: true }).click();
  await page.screenshot({
    path: test.info().outputPath("floor-tables.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "+ Start order", exact: true })
    .click();
  await page.getByRole("button", { name: "Test Burger NPR 200.00" }).click();
  await page.getByRole("button", { name: "Add to order", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Place order", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Place order", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const creation = state.writes.find((w) => w.path === "orders/pos/");
  expect(creation.body).toMatchObject({
    table_id: 1,
    fulfillment_type: "DINE_IN",
    expected_total: "220.00",
    items: [{ product_id: "burger", quantity: 1 }],
  });
  expect(creation.key).toBeTruthy();
  await page.getByRole("button", { name: "Add food", exact: true }).click();
  await page.getByRole("button", { name: "Test Burger NPR 200.00" }).click();
  await page.getByRole("button", { name: "Add to order", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add round to order", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Add round to order", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    state.writes.find((w) => w.path.endsWith("/append/")).body,
  ).toMatchObject({
    version: 1,
    expected_total: "440.00",
    items: [{ product_id: "burger" }],
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Billing & settlement", exact: true })
    .click();
  await expect(page.getByText("Balance due: NPR 440.00")).toBeVisible();
  await page
    .getByRole("button", { name: "Add tender / split payment" })
    .click();
  await page.getByLabel("Amount applied").fill("100");
  await page.getByRole("button", { name: "Record payment / credit" }).click();
  await expect(page.getByText("Balance due: NPR 340.00")).toBeVisible();
  await page
    .getByRole("button", { name: "Add tender / split payment" })
    .click();
  await page.getByLabel("Amount applied").fill("140");
  await page
    .getByRole("button", { name: "Add tender / split payment" })
    .click();
  await page
    .getByRole("combobox", { name: "Payment method", exact: true })
    .nth(1)
    .selectOption("CARD");
  await page.getByLabel("Amount applied").nth(1).fill("200");
  await page.getByRole("button", { name: "Record payment / credit" }).click();
  await expect(
    page.getByText("This bill has no remaining balance."),
  ).toBeVisible();
  expect(state.orders[0].paid_amount).toBe("440.00");
  expect(state.writes.filter((w) => w.path.endsWith("/settle/"))).toHaveLength(
    2,
  );
});

test("failed order keeps cart for review and retry", async ({ page }) => {
  const state = await setup(page);
  state.failCreate = true;
  await page.getByRole("button", { name: "Test Burger NPR 200.00" }).click();
  await page.getByRole("button", { name: "Add to order", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Place order", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Place order", exact: true }).click();
  await expect(
    page.getByText("Menu prices changed. Review a fresh quote.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Quantity Test Burger")).toHaveValue("1");
  expect(state.orders).toHaveLength(0);
});

test("uncertain creation replays the original request key without duplicating the order", async ({
  page,
}) => {
  const state = await setup(page);
  state.loseCreateResponse = true;
  await page.getByRole("button", { name: "Test Burger NPR 200.00" }).click();
  await page.getByRole("button", { name: "Add to order", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Place order", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Place order", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Recover pending order action" }),
  ).toBeVisible();
  expect(state.orders).toHaveLength(1);
  await page
    .getByRole("button", { name: "Recover pending order action" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const attempts = state.writes.filter((w) => w.path === "orders/pos/");
  expect(attempts).toHaveLength(2);
  expect(attempts[0].key).toBe(attempts[1].key);
  expect(attempts[0].body).toEqual(attempts[1].body);
  expect(state.orders).toHaveLength(1);
  await expect(page.getByLabel("Quantity Test Burger")).toHaveCount(0);
});
