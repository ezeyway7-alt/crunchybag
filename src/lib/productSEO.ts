/** Only publish an exact offer when the catalog does not require pricing choices. */
export function productSEO(product: any, url: string) {
  const images = (product.images || []).map((image: string) => new URL(image, 'https://crunchybag.com').href);
  const price = Number(product.base_price ?? product.basePrice);
  const groups = product.modifier_groups ?? product.modifierGroups ?? [];
  const simple = !groups.some((group: any) => group.required || Number(group.min_selections ?? group.minSelections) > 0)
    && !(product.variants || []).some((variant: any) => Number(variant.price) !== price)
    && !Number(product.discount_percent ?? product.discountPercent ?? 0)
    && !(product.is_combo_package ?? product.isComboPackage);
  return {
    '@context': 'https://schema.org', '@type': 'Product', '@id': `${url}#product`,
    name: product.name, description: product.description || `Order ${product.name} from Crunchy Bag in Imadol, Lalitpur.`,
    url, image: images, sku: String(product.id), brand: { '@type': 'Brand', name: 'Crunchy Bag' },
    ...(simple && Number.isFinite(price) && price > 0 ? { offers: {
      '@type': 'Offer', url, price: price.toFixed(2), priceCurrency: 'NPR',
      availability: (product.is_available ?? product.isAvailable) === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: { '@id': 'https://crunchybag.com/#restaurant' },
    }} : {}),
  };
}
