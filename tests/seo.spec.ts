import fs from 'node:fs';
import path from 'node:path';
import { test, expect, Page } from '@playwright/test';
import { BLOG_ARTICLES } from '../src/data/blogData';
import { categoryPages } from '../scripts/category-pages';
import { menuPrice, productMetadata, productPriceSummary } from '../src/lib/menuPricing';

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

  // Query parameter product navigation
  await page.goto(`/?product=${productId}`);
  await expect(page).toHaveURL(new RegExp(`${productUrl}$`));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://crunchybag.com${productUrl}`);

  // Query parameter location navigation
  await page.goto('/?location=gwarko');
  await expect(page).toHaveURL(/\/delivery\/gwarko$/);

  // Query parameter page navigation
  await page.goto('/?page=menu');
  await expect(page).toHaveURL(/\/menu$/);
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


test('brand icons and product metadata are present without JavaScript', () => {
  const home = fs.readFileSync('dist/index.html', 'utf8');
  expect(home).toContain('href="/favicon-96.png"');
  expect(home).not.toContain('"@type": "BreadcrumbList"');
  for (const icon of ['favicon-96.png', 'apple-touch-icon.png', 'icon-512.png', 'favicon.ico']) {
    expect(fs.statSync(`dist/${icon}`).size).toBeGreaterThan(100);
  }
  const html = fs.readFileSync(`dist${productUrl}/index.html`, 'utf8');
  const schema = JSON.parse(html.match(/id="dynamic-route-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
  expect(schema['@type']).toBe('Product');
  expect(schema.name).toBeTruthy();
  expect(schema.image.length).toBeGreaterThan(0);
  expect(schema.url).toBe(`https://crunchybag.com${productUrl}`);
  expect(html).toContain('Base price: NPR');
  expect(fs.readFileSync('dist/sitemap-menu.xml', 'utf8')).toContain('<image:loc>');
});

test('category generation excludes private dishes and empty or archived categories', () => {
  const publicDish = { id: 'public', name: 'Public drink', base_price: '100.00' };
  const privateDish = { id: 'private', name: 'Staff-only drink', is_web_visible: false };
  const generated = categoryPages([
    { id: 'drinks', name: 'Drinks', products: [publicDish, privateDish] },
    { id: 'hidden', name: 'Hidden', products: [privateDish] },
    { id: 'archived', name: 'Archived', is_archived: true, products: [publicDish] },
  ]);
  expect(generated.routes).toHaveLength(1);
  expect(generated.routes[0].contentHtml).toContain('Public drink');
  expect(generated.routes[0].contentHtml).not.toContain('Staff-only drink');
  const schema = JSON.parse(generated.routes[0].schemaJson);
  expect(schema.mainEntity.itemListElement).toHaveLength(1);
  expect(generated.links).not.toContain('Archived');
});

test('category pages have crawlable products and dedicated collection schema before JavaScript', () => {
  const sitemap = fs.readFileSync('dist/sitemap-categories.xml', 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
  expect(urls.length).toBeGreaterThan(0);
  for (const url of urls) {
    const html = fs.readFileSync(path.join('dist', url.pathname, 'index.html'), 'utf8');
    expect(html).toContain(`href="${url.href}"`);
    expect(html).toContain('href="/product/');
    expect(html).toContain('"@type":"CollectionPage"');
    expect(html).not.toContain('content="noindex');
  }
});

test('category navigation, direct loading and back navigation preserve the selected food page', async ({ page }) => {
  await mockStore(page);
  await page.goto('/menu');
  await page.getByRole('link', { name: 'Drinks', exact: true }).click();
  await expect(page).toHaveURL(/\/menu\/drinks$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Drinks Menu');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://crunchybag.com/menu/drinks');
  await page.goBack();
  await expect(page).toHaveURL(/\/menu$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://crunchybag.com/menu');
  await page.goto('/menu/drinks/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Drinks Menu');
  await expect(page.getByRole('link', { name: 'Cold Coffee', exact: true })).toBeVisible();
  await expect(page.locator('#dynamic-route-schema')).toHaveCount(1);
});

test('takeaway content and metadata survive storefront mounting', async ({ page }) => {
  await mockStore(page);
  await page.goto('/takeaway/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('24/7 Food Takeaway from Crunchy Bag, Imadol');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://crunchybag.com/takeaway');
  await expect(page.locator('#app-landing-summary')).toContainText('7–15 minutes');
  await expect(page.locator('#app-landing-summary')).toContainText('5 AM–11 PM');
  await expect(page.locator('#app-landing-summary')).toContainText('no minimum order');
});

test('business schema separates dine-in hours from 24-hour services', () => {
  const home = fs.readFileSync('dist/index.html', 'utf8');
  const schema = JSON.parse(home.match(/id="restaurant-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
  expect(schema.address.streetAddress).toBe('Dhungesadhu Chowk, Imadol');
  expect(schema.openingHoursSpecification[0]).toMatchObject({ opens: '05:00', closes: '23:00' });
  expect(schema.hasOfferCatalog.itemListElement[0].itemOffered.hoursAvailable).toMatchObject({ opens: '00:00', closes: '23:59' });
  expect(schema.areaServed.map((area: any) => area.name)).toEqual(['Kathmandu', 'Lalitpur', 'Bhaktapur']);
  expect(fs.readFileSync('dist/404.html', 'utf8')).toContain('noindex, follow');
});

test('pakoda and sandwich collections contain the relevant dishes and preserve legacy canonical links', () => {
  const categories = [{ id: 'snacks', name: 'Snacks', products: [
    { id: 'pakoda-test', name: 'Chicken 65 Pakoda', base_price: '100' },
    { id: 'sandwich-test', name: 'Chicken Grilled Sandwich', base_price: '120' },
    { id: 'fries-test', name: 'French Fries', base_price: '80' },
  ] }];
  const generated = categoryPages(categories);
  const pakoda = generated.routes.find(route => route.path === '/menu/pakoda')!;
  expect(JSON.parse(pakoda.schemaJson).mainEntity.itemListElement.map((item: any) => item.name)).toEqual(['Chicken 65 Pakoda']);
  const sandwich = generated.routes.find(route => route.path === '/menu/sandwiches')!;
  expect(JSON.parse(sandwich.schemaJson).mainEntity.itemListElement.map((item: any) => item.name)).toEqual(['Chicken Grilled Sandwich']);
  const legacy = fs.readFileSync('dist/pakoda/index.html', 'utf8');
  expect(legacy).toContain('rel="canonical" href="https://crunchybag.com/menu/pakoda"');
  expect(fs.readFileSync('dist/sitemap.xml', 'utf8')).not.toContain('<loc>https://crunchybag.com/pakoda</loc>');
});

test('price summaries preserve actual variant prices and required extra charges without inventing missing amounts', () => {
  const product = { name: 'Chicken Cheese Burger', base_price: '200', variants: [{ name: 'Double', price: '300' }], modifier_groups: [{
    name: 'Cheese', min_selections: 1, options: [{ name: 'Extra cheese', price_delta: '25' }, { name: 'No cheese', price_delta: '-10' }, { name: 'Unknown price' }],
  }] };
  const summary = productPriceSummary(product);
  expect(summary.base).toBe('NPR 200');
  expect(summary.variants).toEqual([{ name: 'Double', price: 'NPR 300' }]);
  expect(summary.groups[0].required).toBe(true);
  expect(summary.groups[0].options).toEqual([{ name: 'Extra cheese', adjustment: '+NPR 25' }, { name: 'No cheese', adjustment: '-NPR 10' }]);
  expect(menuPrice(null)).toBeNull();
  expect(menuPrice('invalid')).toBeNull();
  expect(productMetadata(product).title).toContain('Chicken Cheese Burger Price');
  expect(productMetadata(product).description).toContain('listed base price NPR 200');
});

test('price comparison remains off the homepage and expands on a category page', async ({ page }) => {
  await mockStore(page);
  await page.goto('/');
  await expect(page.getByText('Compare drinks prices, portions & extras', { exact: true })).toHaveCount(0);
  await expect(page.locator('#menu > header')).toHaveCount(0);
  await page.goto('/menu/drinks/');
  await page.getByText('Compare drinks prices, portions & extras', { exact: true }).click();
  await expect(page.getByRole('table')).toContainText('Cold Coffee');
  await expect(page.getByRole('table')).toContainText('NPR 200');
  await expect(page.getByRole('table')).not.toContainText('undefined');
});

test('homepage and contact location maps load keyless tiles and display attribution', async ({ page }) => {
  await mockStore(page);
  const tileRequests: string[] = [];
  await page.route('https://tile.openstreetmap.org/**', async route => {
    tileRequests.push(route.request().url());
    await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#ddd"/></svg>' });
  });
  for (const url of ['/', '/contact/']) {
    tileRequests.length = 0;
    await page.goto(url);
    const map = page.locator('footer .leaflet-container');
    await map.scrollIntoViewIfNeeded();
    await expect(map.locator('.leaflet-tile-loaded').first()).toBeVisible();
    await expect(map.locator('.leaflet-control-attribution a[href="https://www.openstreetmap.org/copyright"]')).toBeVisible();
    expect(tileRequests.length).toBeGreaterThan(0);
    expect(tileRequests.every(url => !new URL(url).search)).toBe(true);
    await expect(map.locator('img[src*="cartocdn"]')).toHaveCount(0);
  }
});
