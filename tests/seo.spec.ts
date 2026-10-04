import fs from 'node:fs';
import path from 'node:path';
import { test, expect, Page } from '@playwright/test';
import { BLOG_ARTICLES } from '../src/data/blogData';

const productId = 'prod-cold-coffee-469955c644d4';
const productUrl = '/product/cold-coffee-469955c644d4';
async function mockStore(page: Page) {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.routeWebSocket('**/ws/**', () => {});
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    let data: any = {};
    if (url.pathname.includes('branches')) data = [{ id: 1, name: 'Imadol', branch_code: 'IMADOL', accepting_orders: true }];
    if (url.pathname.includes('/catalog/menu/')) data = { categories: [{ id: 'drinks', name: 'Drinks', products: [{
      id: productId, category: 'drinks', name: 'Cold Coffee', description: 'Fresh cold coffee', base_price: '200.00',
      variants: [], modifier_groups: [], images: [], dietary_tags: [], is_available: true, is_web_visible: true,
    }] }] };
    await route.fulfill({ json: data });
  });
}

test('sitemap only lists built canonical pages with matching HTML', () => {
  const xml = fs.readFileSync('dist/sitemap.xml', 'utf8');
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
  expect(urls.length).toBeGreaterThan(40);
  for (const url of urls) {
    const html = fs.readFileSync(path.join('dist', url.pathname, 'index.html'), 'utf8');
    expect(html, url.pathname).toContain(`<link rel="canonical" href="${url.href}"`);
    expect(html, url.pathname).not.toContain('content="noindex');
    if (url.pathname.startsWith('/product/')) {
      expect(html).toContain('<h1>');
      expect(html).not.toContain('<title>Crunchy Bag |');
    }
  }
  expect(xml).not.toContain('/profile');
  expect(xml).not.toContain('/blogs/');
  expect(fs.readFileSync(`dist/product/${productId}/index.html`, 'utf8')).toContain(`href="https://crunchybag.com${productUrl}"`);
});

test('product links support click, back, forward and direct legacy URLs', async ({ page }) => {
  await mockStore(page);
  await page.goto('/menu');
  const link = page.getByRole('link', { name: 'Cold Coffee', exact: true });
  await expect(link).toHaveAttribute('href', productUrl);
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${productUrl}$`));
  await expect(page).toHaveTitle(/Cold Coffee/);
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/menu$/);
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://crunchybag.com/menu');
  await page.goForward();
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
  await page.goto(`/product/${productId}`);
  await expect(page).toHaveURL(new RegExp(`${productUrl}$`));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://crunchybag.com${productUrl}`);
});

test('blog navigation creates valid article tags and a single article schema', async ({ page }) => {
  await mockStore(page);
  await page.goto('/blogs');
  const article = BLOG_ARTICLES[0];
  await page.locator(`a[href="/blog/${article.slug}"]`).first().click();
  await expect(page).toHaveTitle(article.metaTitle);
  await expect(page.locator('meta[property="article:author"]')).toHaveAttribute('content', article.author);
  await expect(page.locator('#dynamic-route-schema')).toHaveCount(1);
  await page.goto(`/blog/${article.slug}/`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#dynamic-route-schema')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://crunchybag.com/blog/${article.slug}`);
});

test('delivery information survives React mounting and identifies the real outlet', async ({ page }) => {
  await mockStore(page);
  await page.goto('/delivery/thamel/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app-landing-summary')).toContainText('Our only restaurant and kitchen is in Imadol, Lalitpur.');
  await expect(page.locator('#app-landing-summary')).not.toContainText('Kings Way flagship');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://crunchybag.com/delivery/thamel');
});
