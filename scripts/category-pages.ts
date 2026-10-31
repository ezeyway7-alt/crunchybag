import { categoryMetadata, categoryPath, FOOD_COLLECTIONS, matchesFoodCollection } from '../src/data/seo/categories';
import { productPath } from '../src/lib/productRoutes';
import { escapeHtml } from './product-pages';
import { productPriceSummary } from '../src/lib/menuPricing';

export function categoryPages(categories: any[]) {
  const activeCategories = categories.filter(category => !category.is_archived);
  const products = activeCategories.flatMap(category => category.products || []).filter((product: any) => product.is_web_visible !== false);
  const collections = FOOD_COLLECTIONS.map(collection => ({ ...collection, products: products.filter((product: any) => matchesFoodCollection(collection.id, product.name)) }));
  const publicCategories = [...new Map([...activeCategories, ...collections].filter(category => category.products?.some((product: any) => product.is_web_visible !== false)).map(category => [categoryPath(category), category])).values()];
  const links = publicCategories.map(category => `<li><a href="${categoryPath(category)}">${escapeHtml(category.name)}</a></li>`).join('');
  const routes = publicCategories.map(category => {
    const meta = categoryMetadata(category);
    const products = category.products.filter((product: any) => product.is_web_visible !== false);
    const items = products.map((product: any) => `<li><a href="${productPath(product)}">${escapeHtml(product.name)}</a>${product.description ? `<p>${escapeHtml(product.description)}</p>` : ''}<p>Base price: NPR ${escapeHtml(product.base_price)}. Options may change the total.</p></li>`).join('');
    const priceGuide = `<details><summary>Compare ${escapeHtml(category.name.toLowerCase())} prices, portions &amp; extras</summary><table><caption>Listed base prices in Nepalese rupees. Portion choices and extras may change the total.</caption><thead><tr><th scope="col">Food</th><th scope="col">Base price</th><th scope="col">Portion options</th></tr></thead><tbody>${products.map((product: any) => {
      const price = productPriceSummary(product);
      return `<tr><th scope="row"><a href="${productPath(product)}">${escapeHtml(price.name)}</a></th><td>${escapeHtml(price.base || 'Check item')}</td><td>${escapeHtml(price.variants.map((variant: any) => `${variant.name}: ${variant.price}`).join('; ') || 'See item for available choices')}</td></tr>`;
    }).join('')}</tbody></table><p>Check the selected options and delivery charge before confirming your order.</p></details>`;
    return {
      ...meta,
      schemaJson: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': meta.canonical,
        name: meta.h1, description: meta.description, url: meta.canonical,
        mainEntity: { '@type': 'ItemList', itemListElement: products.map((product: any, index: number) => ({
          '@type': 'ListItem', position: index + 1, name: product.name, url: `https://crunchybag.com${productPath(product)}`,
        })) },
      }),
      contentHtml: `<main id="app-landing-summary" class="max-w-4xl mx-auto px-4 py-8 space-y-6 text-zinc-300"><nav><a href="/">Home</a> / <a href="/menu">Menu</a></nav><h1>${escapeHtml(meta.h1)}</h1><p>${escapeHtml(meta.intro)}</p><ul>${items}</ul>${priceGuide}<h2>Takeaway and delivery</h2><p>Our restaurant is in Imadol, Lalitpur. <a href="/takeaway">Plan a pickup</a> or <a href="/delivery">check delivery coverage</a> before ordering.</p><nav aria-label="Food categories"><ul>${links}</ul></nav></main>`,
    };
  });
  return { links, routes };
}
