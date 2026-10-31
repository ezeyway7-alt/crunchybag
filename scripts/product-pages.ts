import { productSEO } from '../src/lib/productSEO';
import fs from 'node:fs';
import { productPath } from '../src/lib/productRoutes';
import { categoryPath } from '../src/data/seo/categories';

export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

export async function productPages() {
  // Use the same public web catalog as the storefront. Never publish staff-only products.
  const endpoint = process.env.SEO_CATALOG_URL || 'https://crunchybag.com/api/v1/catalog/menu/?outlet_id=1&channel=web';
  const snapshot = process.env.SEO_CATALOG_FILE
    ? JSON.parse(fs.readFileSync(process.env.SEO_CATALOG_FILE, 'utf8').replace(/^\uFEFF/, ''))
    : await fetch(endpoint, { signal: AbortSignal.timeout(20000) }).then(async response => {
      if (!response.ok) throw new Error(`SEO catalog returned HTTP ${response.status}`);
      return response.json();
    });
  if (!Array.isArray(snapshot.categories)) throw new Error('Invalid public SEO catalog');
  const categories = snapshot.categories.filter((category: any) => !category.is_archived);
  const products = categories.flatMap((category: any) => category.products || [])
    .filter((product: any) => product.is_web_visible !== false);
  if (!products.length) throw new Error('Public SEO catalog is empty; refusing to publish an empty product sitemap');
  const uniqueProducts = [...new Map<string, any>(products.map((product: any) => [String(product.id), product])).values()];
  const links = uniqueProducts.map(product => `<li><a href="${productPath(product)}">${escapeHtml(product.name)}</a></li>`).join('');
  return { links, categories, routes: uniqueProducts.flatMap(product => {
    const canonicalPath = productPath(product);
    const category = snapshot.categories.find((entry: any) => entry.products?.some((item: any) => String(item.id) === String(product.id)));
    const related = (category?.products || []).filter((item: any) => String(item.id) !== String(product.id) && item.is_web_visible !== false).slice(0, 4);
    const description = product.description || `Order ${product.name} from Crunchy Bag in Imadol, Lalitpur.`;
    const rawImage = product.images?.[product.main_image_index || 0] || product.images?.[0];
    const image = rawImage ? new URL(rawImage, 'https://crunchybag.com').href : undefined;
    const route = {
      path: canonicalPath,
      canonicalPath,
      title: `${product.name} | Crunchy Bag, Imadol`,
      h1: product.name,
      description,
      image,
      schemaJson: JSON.stringify(productSEO(product, `https://crunchybag.com${canonicalPath}`)),
      contentHtml: `<main id="app-landing-summary" class="max-w-4xl mx-auto px-4 py-8 space-y-6 text-zinc-300">
        <nav><a href="/">Crunchy Bag</a> / <a href="/menu">Menu</a>${category ? ` / <a href="${categoryPath(category)}">${escapeHtml(category.name)}</a>` : ''}</nav>
        <h1>${escapeHtml(product.name)}</h1>
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" width="480" />` : ''}
        <p>${escapeHtml(description)}</p>
        <p>Base price: NPR ${escapeHtml(product.base_price)}. Required choices and extras may change the total.</p>
        <p>Prepared at Crunchy Bag, Imadol, Lalitpur. Current options, availability and prices are shown when ordering.</p>
        <a href="/menu">Browse the full menu</a>
        ${related.length ? `<h2>More from ${escapeHtml(category.name)}</h2><ul>${related.map((item: any) => `<li><a href="${productPath(item)}">${escapeHtml(item.name)}</a></li>`).join('')}</ul>` : ''}
        <p><a href="/takeaway">Takeaway from Imadol</a> · <a href="/delivery">Delivery coverage and enquiries</a></p>
      </main>`,
    };
    const legacyPath = `/product/${encodeURIComponent(product.id)}`;
    return canonicalPath === legacyPath ? [route] : [route, { ...route, path: legacyPath }];
  }) };
}
