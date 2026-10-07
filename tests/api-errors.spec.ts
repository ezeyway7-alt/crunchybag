import { test, expect } from '@playwright/test';

test('API errors preserve field, list and nested validation messages for every caller', async ({page}) => {
  await page.route('**/api/v1/**', route => route.fulfill({json:[]}));
  await page.goto('/');
  const messages = await page.evaluate(async () => {
    const path = '/src/lib/api.ts';
    const {ApiError, extractErrorMessage} = await import(path);
    return [
      {discount_reason:['Please provide remarks for the discount.']},
      {error:'Error', errors:{discount_reason:['This field is required.'], customer_phone:['Enter a valid phone number.']}},
      {items:[{}, {quantity:['Must be at least 1.']}]},
      ['The order has already been billed.', 'Refresh the order before editing.'],
      {detail:{message:'Item is out of stock.'}},
      '<HTML><BODY>Internal server traceback</BODY></HTML>',
    ].map(data => extractErrorMessage(new ApiError('Error', 400, data)));
  });
  expect(messages).toEqual([
    'Discount reason: Please provide remarks for the discount.',
    'Discount reason: This field is required.\nCustomer phone: Enter a valid phone number.',
    'Items > Item 2 > Quantity: Must be at least 1.',
    'The order has already been billed.\nRefresh the order before editing.',
    'Item is out of stock.',
    'Please check the entered values and try again.',
  ]);
  await page.route('**/api/v1/error-check/', route => route.fulfill({status:400,json:{discount_reason:['Remarks are required.']}}));
  const message = await page.evaluate(async () => {
    const path = '/src/lib/api.ts';
    const {apiClient} = await import(path);
    try { await apiClient.get('/error-check/', {skipAuth:true}); } catch (error) {return (error as Error).message;}
  });
  expect(message).toBe('Discount reason: Remarks are required.');
});
