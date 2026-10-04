/** Keep the catalog identifier in the URL so renamed dishes keep their links. */
export function productSlug(product: { id: string; name: string }): string {
  if (/^prod-[a-z0-9-]+$/.test(product.id)) return product.id.slice(5);
  const name = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${name || 'item'}--${product.id}`;
}

export function productPath(product: { id: string; name: string }): string {
  return `/product/${encodeURIComponent(productSlug(product))}`;
}

export function matchesProductRoute(product: { id: string; name: string }, value: string): boolean {
  return value === product.id || value === productSlug(product);
}
