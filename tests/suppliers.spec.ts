import { test, expect, Page } from '@playwright/test';

async function setup(page: Page) {
  const user = { id: 1, username: 'owner', role: 'RESTAURANT_OWNER', outlet_id: 1, is_active: true };
  const outlet = { id: 1, name: 'Test outlet', branch_code: 'TEST' };
  await page.addInitScript(({ user, outlet }) => {
    localStorage.setItem('crunchy_access_token', 'test-token');
    localStorage.setItem('crunchy_auth_user', JSON.stringify(user));
    localStorage.setItem('crunchy_auth_outlet', JSON.stringify(outlet));
    document.cookie = 'csrftoken=abcdefghijklmnopqrstuvwx12345678; path=/';
  }, { user, outlet });
  const supplier = { id: 'sup-1', name: 'Fresh Foods', phone: '9800000011', pan_number: '123456789', email: '', address: 'Kathmandu', is_active: true, opening_balance: '0.00' };
  const state = { payments: [] as any[], keys: [] as string[], saved: {} as Record<string, any>, loseResponse: false, extra: [] as any[], reads: 0 };
  const paid = () => state.payments.filter(row => !row.voided_at).reduce((sum, row) => sum + Number(row.amount), 0);
  const balance = () => 150 - paid();
  const invoice = () => ({ id: 'bill-1', invoice_number: 'INV-RICE', supplier_name: supplier.name, purchase_date: '2026-10-01', total_amount: '200.00', subtotal: '200.00', paid_amount: Math.min(200, 50 + paid()).toFixed(2), due_amount: Math.max(0, balance()).toFixed(2), discount_amount: '0.00', payment_method: 'CASH', payment_status: balance() <= 0 ? 'PAID' : 'PARTIAL', notes: '', items: [{ id: 'line-1', item: 1, item_name: 'Rice', quantity: '2.000', unit: 'KG', unit_cost: '100.00', discount: '0.00', total_cost: '200.00' }] });
  await page.routeWebSocket('**/ws/**', socket => { socket.onMessage(() => socket.send(JSON.stringify({ event_type: 'HEARTBEAT', revision: '1' }))); });
  await page.route('**/api/v1/**', async route => {
    const request = route.request(), url = new URL(request.url()), p = url.pathname.replace('/api/v1/', '');
    const body = request.method() === 'POST' ? request.postDataJSON() : null;
    let result: any = {};
    if (p === 'auth/me/') result = { user, outlet };
    else if (p === 'customer/orders/') result = { results: [] };
    else if (p === 'customer/profile/') result = { favorites: [], member_since: '2026-01-01', name: 'Owner' };
    else if (p === 'orders/pos/') result = { results: [], count: 0, page: 1, page_size: 25, summary: { final: '0', paid: '0', due: '0', credit: '0', refunded: '0', methods: {} }, status_counts: {} };
    else if (p === 'catalog/management/') result = { products: [], categories: [], schedules: [], overrides: {} };
    else if (p === 'catalog/menu/') result = { categories: [], revision: 0, valid_until: null };
    else if (p === 'inventory/items/') result = { status: 'success', data: { count: 0, low_stock_count: 0, total_valuation: 0, results: [] } };
    else if (p === 'inventory/categories/' || p === 'inventory/suppliers/') result = [];
    else if (p === 'inventory/purchases/') result = [invoice()];
    else if (p === 'inventory/supplier-accounts/' && body) { result = { ...body, id: `sup-${state.extra.length + 2}`, credit_balance: body.credit_balance || '0.00', opening_balance: body.credit_balance || '0.00' }; state.extra.push(result); }
    else if (p === 'inventory/supplier-accounts/') { state.reads++; result = { results: [{ ...supplier, credit_balance: String(balance()), purchase_total: '200.00', paid_total: String(50 + paid()), invoice_count: 1 }, ...state.extra] }; }
    else if (p === 'inventory/supplier-accounts/sup-1/') result = { supplier: { ...supplier, credit_balance: String(balance()) }, summary: { purchase_total: '200.00', paid_total: String(50 + paid()), balance: String(balance()), amount_due: String(Math.max(0, balance())), advance: String(Math.max(0, -balance())), opening_balance: '0.00' }, invoices: [invoice()], payments: state.payments, statement: [], items: [] };
    else if (p.includes('/payments/') && body) {
      const key = request.headers()['idempotency-key']; state.keys.push(key);
      if (!state.saved[key]) {
        if (p.endsWith('/void/')) { const id = Number(p.split('/').at(-3)); Object.assign(state.payments.find(row => row.id === id), { voided_at: new Date().toISOString(), void_reason: body.reason }); }
        else state.payments.push({ ...body, id: state.payments.length + 1, recorded_by: 'owner', voided_at: null, void_reason: '' });
        state.saved[key] = { payment_id: state.payments.length, balance: String(balance()) };
      }
      if (state.loseResponse) { state.loseResponse = false; await route.abort(); return; }
      result = state.saved[key];
    }
    await route.fulfill({ json: result });
  });
  await page.goto('/admin?tab=inventory');
  return state;
}

test('supplier account shows prices, records payments, and safely retries an overpayment', async ({ page }) => {
  const state = await setup(page);
  await page.getByRole('button', { name: 'Suppliers', exact: true }).click();
  await page.getByRole('button', { name: 'Fresh Foods', exact: true }).click();
  await expect(page.getByText('Remaining to pay', { exact: true }).locator('..')).toContainText('150.00');
  await page.locator('summary').filter({ hasText: 'INV-RICE' }).click();
  await expect(page.getByRole('cell', { name: 'Rice', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: /100\.00/ })).toBeVisible();
  await page.getByLabel('Amount (NPR)', { exact: true }).fill('75');
  await page.getByRole('button', { name: 'Record payment', exact: true }).click();
  await expect(page.getByText('Remaining to pay', { exact: true }).locator('..')).toContainText('75.00');
  state.loseResponse = true;
  await page.getByLabel('Amount (NPR)', { exact: true }).fill('100');
  await page.getByRole('button', { name: 'Record payment', exact: true }).click();
  await page.getByRole('button', { name: 'Retry saved payment' }).click();
  await expect(page.getByText('Advance / overpaid', { exact: true }).locator('..')).toContainText('25.00');
  expect(state.payments).toHaveLength(2);
  expect(state.keys[1]).toEqual(state.keys[2]);
  await page.getByRole('button', { name: 'Payment history', exact: true }).click();
  await page.getByRole('button', { name: 'Reverse payment #1', exact: true }).click();
  await page.getByLabel('Reason for reversing payment #1').fill('Entered twice');
  await page.getByRole('button', { name: 'Reverse recorded payment', exact: true }).click();
  await expect(page.getByText('Remaining to pay', { exact: true }).locator('..')).toContainText('50.00');
  await page.screenshot({ path: test.info().outputPath('supplier-account.png'), fullPage: true });
  await page.getByRole('button', { name: 'Bills History', exact: true }).click();
  await expect(page.getByText('INV-RICE', { exact: true })).toBeVisible();
});

test('adding a supplier from purchase selection persists it before a bill is submitted', async ({ page }) => {
  const state = await setup(page);
  const field = page.getByRole('textbox', { name: 'Supplier name', exact: true });
  await field.fill('New vendor');
  await page.getByText('+ Add new "New vendor"', { exact: true }).click();
  await expect.poll(() => state.extra.length).toBe(1);
  await page.getByRole('button', { name: 'Suppliers', exact: true }).click();
  await expect(page.getByRole('button', { name: 'New vendor', exact: true })).toBeVisible();
});
