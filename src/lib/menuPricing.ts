/** Read the same public pricing fields in build-time and live catalog shapes. */
export function menuPrice(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0
    ? `NPR ${amount.toLocaleString('en-NP', { maximumFractionDigits: 2 })}` : null;
}

export function productPriceSummary(product: any) {
  return {
    name: String(product.name || '').replace(/\s+/g, ' ').trim(),
    base: menuPrice(product.base_price ?? product.basePrice),
    variants: (product.variants || []).map((variant: any) => ({ name: String(variant.name || 'Option'), price: menuPrice(variant.price) }))
      .filter((variant: any) => variant.price),
    groups: (product.modifier_groups ?? product.modifierGroups ?? []).map((group: any) => ({
      name: String(group.name || 'Extras'),
      required: !!group.required || Number(group.min_selections ?? group.minSelections) > 0,
      options: (group.options || []).map((option: any) => {
        const raw = option.price_delta ?? option.priceDelta;
        const amount = raw === null || raw === undefined || raw === '' ? NaN : Number(raw);
        return { name: String(option.name || 'Option'), adjustment: Number.isFinite(amount)
          ? `${amount < 0 ? '-' : '+'}${menuPrice(Math.abs(amount))}` : null };
      }).filter((option: any) => option.adjustment),
    })).filter((group: any) => group.options.length),
  };
}

export function productMetadata(product: any) {
  const { name, base } = productPriceSummary(product);
  return {
    title: `${name} Price & Options | Crunchy Bag, Imadol`,
    description: `${name}${base ? ` listed base price ${base}` : ''} at Crunchy Bag, Imadol, Lalitpur. Compare portions and extras. Delivery and takeaway 24/7; final total depends on selections.`,
  };
}
