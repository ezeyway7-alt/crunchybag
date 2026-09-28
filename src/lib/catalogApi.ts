import { apiClient, DEFAULT_API_BASE } from './api';
import { Product, Category, TimePricingSchedule } from '../types';

export function fromCategory(row: any): Category {
  const item = row?.category || row?.data || row || {};
  return {
    id: String(item.id ?? ''),
    name: item.name || '',
    iconName: item.icon_name || 'Utensils',
    displayOrder: typeof item.display_order === 'number' ? item.display_order : 0,
    isArchived: Boolean(item.is_archived)
  };
}
export function fromProduct(row: any): Product {
  const item = row?.product || row?.data || row || {};
  return {
    id: String(item.id ?? ''),
    categoryId: String(item.category_id || item.category?.id || item.category || ''),
    name: item.name || '',
    description: item.description || '',
    basePrice: Number(item.base_price || 0),
    costPrice: item.cost_price == null ? undefined : Number(item.cost_price),
    images: item.images || [],
    mainImageIndex: item.main_image_index || 0,
    dietary: item.dietary_tags || [],
    isDeliveryEligible: item.is_delivery_eligible !== false,
    isAvailable: item.is_available !== false,
    isWebVisible: item.is_web_visible !== false,
    showOnPos: item.show_on_pos !== false,
    showOnQr: item.show_on_qr !== false,
    discountPercent: Number(item.discount_percent || 0),
    prepTimeMinutes: item.prep_time_minutes || 0,
    calories: item.calories,
    requiresKitchen: item.requires_kitchen !== false,
    isCounterDirect: item.is_counter_direct,
    isDirectInventoryItem: item.is_direct_inventory_item,
    linkedInventoryItemId: item.linked_inventory_item == null ? undefined : String(item.linked_inventory_item),
    isComboPackage: item.is_combo_package,
    comboDiscountType: item.combo_discount_type,
    comboDiscountValue: item.combo_discount_value == null ? undefined : Number(item.combo_discount_value),
    comboOriginalPrice: item.combo_original_price == null ? undefined : Number(item.combo_original_price),
    comboItems: (item.combo_items || []).map((r: any) => ({
      productId: String(r.product_id),
      productName: r.product_name,
      quantity: r.quantity,
      unitPrice: Number(r.unit_price)
    })),
    variants: item.variants?.length
      ? item.variants.map((v: any) => ({ id: String(v.id || ''), name: v.name, price: Number(v.price), isDefault: !!v.is_default }))
      : [{ id: '', name: 'Standard', price: Number(item.base_price || 0), isDefault: true }],
    modifierGroups: (item.modifier_groups || []).map((g: any) => ({
      id: String(g.id || ''),
      name: g.name,
      minSelections: g.min_selections,
      maxSelections: g.max_selections,
      required: g.required,
      options: (g.options || []).map((o: any) => ({
        id: String(o.id || ''),
        name: o.name,
        priceDelta: Number(o.price_delta),
        isDefault: !!o.is_default
      }))
    })),
    recipeIngredients: (item.recipe_ingredients || []).map((r: any) => ({
      id: String(r.id || `ing-${r.inventory_item_id}`),
      inventoryItemId: String(r.inventory_item_id),
      inventoryItemName: r.inventory_item_name || r.inventory_item?.name || `Material #${r.inventory_item_id}`,
      quantityRequired: Number(r.quantity_required),
      unit: r.unit || r.inventory_item?.unit || 'unit'
    })),
  };
}
export function fromSchedule(row: any, outletId: string, products: Product[]): TimePricingSchedule {
  return { id: String(row.id), title: row.name, outletId, startTime: row.start_time.slice(0, 5), endTime: row.end_time.slice(0, 5), daysOfWeek: row.days,
    channels: row.channels?.length ? row.channels : ['web', 'qr', 'pos', 'kiosk'], adjustmentPercentage: row.adjustment_percentage == null ? -Number(row.discount_percentage) : Number(row.adjustment_percentage),
    discountPercentage: Number(row.discount_percentage), productIds: row.product_ids, productNames: products.filter(p => row.product_ids.includes(p.id)).map(p => p.name), isActive: row.is_active };
}
export const catalogPath = (path: string, outletId: string) => {
  const cleanOutletId = /^\d+$/.test(String(outletId)) ? String(outletId) : "1";
  return `/catalog/${path}?outlet_id=${encodeURIComponent(cleanOutletId)}`;
};

export async function productPayload(product: Partial<Product>, outletId: string) {
  const fields: Record<string, string> = { categoryId: 'category', name: 'name', description: 'description', basePrice: 'base_price', costPrice: 'cost_price', images: 'images', mainImageIndex: 'main_image_index', dietary: 'dietary_tags', isDeliveryEligible: 'is_delivery_eligible', isAvailable: 'is_available', isWebVisible: 'is_web_visible', showOnPos: 'show_on_pos', showOnQr: 'show_on_qr', discountPercent: 'discount_percent', prepTimeMinutes: 'prep_time_minutes', calories: 'calories', requiresKitchen: 'requires_kitchen', isCounterDirect: 'is_counter_direct', isDirectInventoryItem: 'is_direct_inventory_item', linkedInventoryItemId: 'linked_inventory_item', isComboPackage: 'is_combo_package', comboDiscountType: 'combo_discount_type', comboDiscountValue: 'combo_discount_value' };
  const body: any = {};
  for (const [key, value] of Object.entries(product)) if (fields[key]) body[fields[key]] = value ?? null;
  if (product.images) body.images = await Promise.all(product.images.map(async url => {
    if (!url.startsWith('data:')) return url;
    const blob = await (await fetch(url)).blob();
    const form = new FormData(); form.append('image', blob, 'menu-image');
    return (await apiClient.post<{url: string}>(catalogPath('images/', outletId), form)).url;
  }));
  if (product.variants) body.variants = product.variants.map(v => ({ ...(v.id ? { id: v.id } : {}), name: v.name, price: v.price, is_default: !!v.isDefault }));
  if (product.modifierGroups) body.modifier_groups = product.modifierGroups.map(g => ({ id: g.id, name: g.name, min_selections: g.minSelections, max_selections: g.maxSelections, required: g.required, options: g.options.map(o => ({ id: o.id, name: o.name, price_delta: o.priceDelta, is_default: !!o.isDefault })) }));
  if (product.comboItems) body.combo_items = product.comboItems.map(r => ({ product_id: r.productId, quantity: r.quantity }));
  if (product.recipeIngredients) {
    body.recipe_ingredients = product.recipeIngredients
      .filter(r => r.inventoryItemId && !isNaN(Number(String(r.inventoryItemId).replace(/^inv-/, ''))))
      .map(r => ({
        inventory_item_id: Number(String(r.inventoryItemId).replace(/^inv-/, '')),
        quantity_required: Number(r.quantityRequired) || 1
      }));
  }
  if (body.linked_inventory_item != null) {
    const rawLinked = String(body.linked_inventory_item).replace(/^inv-/, '').trim();
    body.linked_inventory_item = rawLinked && !isNaN(Number(rawLinked)) ? Number(rawLinked) : null;
  }
  return body;
}
export function schedulePayload(s: TimePricingSchedule) {
  return { name: s.title, start_time: s.startTime, end_time: s.endTime, days: s.daysOfWeek, channels: s.channels,
    adjustment_percentage: s.adjustmentPercentage ?? -s.discountPercentage, product_ids: s.productIds, is_active: s.isActive };
}
export function menuSocket(outletId: string) {
  const configured = (import.meta as any).env.VITE_MENU_WS_ORIGIN;
  const base = new URL(configured || DEFAULT_API_BASE, window.location.origin);
  base.protocol = base.protocol === 'https:' || base.protocol === 'wss:' ? 'wss:' : 'ws:';
  base.pathname = `/ws/outlets/${encodeURIComponent(outletId)}/menu/`; base.search = '';
  return base.toString();
}
export function comboDefinitions(products: Product[]) {
  return products.filter(p => p.isComboPackage && p.isAvailable).map(p => ({
    id: p.id, title: p.name, subtitle: p.description, badge: 'Combo', badgeType: 'deal' as const,
    promoText: '', buttonLabel: 'Customize', targetCategory: p.categoryId, bgGradient: 'from-amber-600 via-amber-500 to-yellow-500',
    image: p.images[p.mainImageIndex || 0] || '', basePrice: p.basePrice, originalPrice: p.comboOriginalPrice ?? p.basePrice,
    includedProductIds: (p.comboItems || []).flatMap(item => Array(item.quantity).fill(item.productId)),
  }));
}
