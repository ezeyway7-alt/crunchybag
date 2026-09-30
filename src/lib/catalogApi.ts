import { apiClient, DEFAULT_API_BASE } from './api';
import { Product, Category, TimePricingSchedule } from '../types';

export function fromCategory(row: any): Category {
  const data = row?.category || row?.data || row || {};
  return {
    id: String(data.id ?? ''),
    name: String(data.name || ''),
    iconName: data.icon_name || 'Utensils',
    displayOrder: Number(data.display_order ?? 0),
    isArchived: Boolean(data.is_archived),
  };
}
export function fromProduct(row: any): Product {
  return {
    id: String(row.id), categoryId: String(row.category_id ?? row.category?.id ?? row.category ?? ''),
    name: row.name || '', description: row.description || '', basePrice: Number(row.base_price),
    costPrice: row.cost_price == null ? undefined : Number(row.cost_price), images: row.images || [],
    mainImageIndex: row.main_image_index, dietary: row.dietary_tags || [],
    isDeliveryEligible: row.is_delivery_eligible, isAvailable: row.is_available,
    isWebVisible: row.is_web_visible, showOnPos: row.show_on_pos, showOnQr: row.show_on_qr,
    discountPercent: Number(row.discount_percent), prepTimeMinutes: row.prep_time_minutes,
    calories: row.calories, requiresKitchen: row.requires_kitchen, isCounterDirect: row.is_counter_direct,
    isDirectInventoryItem: row.is_direct_inventory_item,
    linkedInventoryItemId: row.linked_inventory_item == null ? undefined : String(row.linked_inventory_item),
    isComboPackage: row.is_combo_package, comboDiscountType: row.combo_discount_type,
    comboDiscountValue: row.combo_discount_value == null ? undefined : Number(row.combo_discount_value),
    comboOriginalPrice: row.combo_original_price == null ? undefined : Number(row.combo_original_price),
    comboItems: (row.combo_items || []).map((r: any) => ({ productId: String(r.product_id), productName: r.product_name, quantity: r.quantity, unitPrice: Number(r.unit_price) })),
    variants: row.variants?.length ? row.variants.map((v: any) => ({ id: String(v.id), name: v.name, price: Number(v.price), isDefault: v.is_default })) : [{ id: '', name: 'Standard', price: Number(row.base_price), isDefault: true }],
    modifierGroups: (row.modifier_groups || []).map((g: any) => ({ id: String(g.id), name: g.name, minSelections: g.min_selections, maxSelections: g.max_selections, required: g.required, options: (g.options || []).map((o: any) => ({ id: String(o.id), name: o.name, priceDelta: Number(o.price_delta || 0), isDefault: !!o.is_default })) })),
    recipeIngredients: (() => {
      const seen = new Set<string>();
      return (row.recipe_ingredients || [])
        .map((r: any) => {
          const rawInvId = r.inventory_item_id ?? r.inventory_item?.id ?? r.inventory_item;
          const invId = rawInvId != null ? String(rawInvId).replace(/^inv-/, '') : '';
          return {
            id: String(r.id || `ing-${Math.random().toString(36).slice(2, 8)}`),
            inventoryItemId: invId,
            inventoryItemName: r.inventory_item_name || r.inventory_item?.name || '',
            quantityRequired: Number(r.quantity_required || 1),
            unit: r.unit || r.inventory_item?.unit || 'unit',
          };
        })
        .filter((r: any) => {
          if (!r.inventoryItemId || seen.has(r.inventoryItemId)) return false;
          seen.add(r.inventoryItemId);
          return true;
        });
    })(),
  };
}
export function fromSchedule(row: any, outletId: string, products: Product[]): TimePricingSchedule {
  return {
    id: String(row.id),
    title: row.name || 'Schedule',
    outletId,
    startTime: (row.start_time || '').slice(0, 5),
    endTime: (row.end_time || '').slice(0, 5),
    daysOfWeek: row.days || [],
    channels: row.channels?.length ? row.channels : ['web', 'qr', 'pos', 'kiosk'],
    adjustmentPercentage: row.adjustment_percentage == null ? -Number(row.discount_percentage || 0) : Number(row.adjustment_percentage),
    discountPercentage: Number(row.discount_percentage || 0),
    productIds: row.product_ids || [],
    productNames: (products || []).filter(p => (row.product_ids || []).includes(p.id)).map(p => p.name),
    isActive: Boolean(row.is_active),
  };
}
export const catalogPath = (path: string, outletId: string) => `/catalog/${path}?outlet_id=${encodeURIComponent(outletId)}`;

export async function productPayload(product: Partial<Product>, outletId: string) {
  const fields: Record<string, string> = { categoryId: 'category', name: 'name', description: 'description', basePrice: 'base_price', costPrice: 'cost_price', images: 'images', mainImageIndex: 'main_image_index', dietary: 'dietary_tags', isDeliveryEligible: 'is_delivery_eligible', isAvailable: 'is_available', isWebVisible: 'is_web_visible', showOnPos: 'show_on_pos', showOnQr: 'show_on_qr', discountPercent: 'discount_percent', prepTimeMinutes: 'prep_time_minutes', calories: 'calories', requiresKitchen: 'requires_kitchen', isCounterDirect: 'is_counter_direct', isDirectInventoryItem: 'is_direct_inventory_item', linkedInventoryItemId: 'linked_inventory_item', isComboPackage: 'is_combo_package', comboDiscountType: 'combo_discount_type', comboDiscountValue: 'combo_discount_value' };
  const body: any = {};
  for (const [key, value] of Object.entries(product)) if (fields[key]) body[fields[key]] = value ?? null;
  if ('linkedInventoryItemId' in product) {
    const rawLinked = String(product.linkedInventoryItemId || '').replace(/^inv-/, '').trim();
    const numLinked = Number(rawLinked);
    body.linked_inventory_item = !isNaN(numLinked) && numLinked > 0 ? numLinked : null;
  }
  if (product.images) body.images = await Promise.all(product.images.map(async url => {
    if (!url.startsWith('data:')) return url;
    const blob = await (await fetch(url)).blob();
    const form = new FormData(); form.append('image', blob, 'menu-image');
    return (await apiClient.post<{url: string}>(catalogPath('images/', outletId), form)).url;
  }));
  if (product.variants) body.variants = product.variants.map(v => ({ ...(v.id ? { id: v.id } : {}), name: v.name, price: v.price, is_default: !!v.isDefault }));
  if (product.modifierGroups) body.modifier_groups = product.modifierGroups.map(g => ({ id: String(g.id), name: g.name, min_selections: g.minSelections, max_selections: g.maxSelections, required: g.required, options: g.options.map(o => ({ id: String(o.id), name: o.name, price_delta: o.priceDelta, is_default: !!o.isDefault })) }));
  if (product.comboItems) body.combo_items = product.comboItems.map(r => ({ product_id: r.productId, quantity: r.quantity }));
  if (product.recipeIngredients) {
    const seenPayload = new Set<number>();
    body.recipe_ingredients = product.recipeIngredients
      .map(r => {
        const rawId = String(r.inventoryItemId || '').replace(/^inv-/, '').trim();
        const numId = Number(rawId);
        return {
          inventory_item_id: !isNaN(numId) && numId > 0 ? numId : null,
          quantity_required: Number(r.quantityRequired) || 1,
        };
      })
      .filter((r): r is { inventory_item_id: number; quantity_required: number } => {
        if (r.inventory_item_id === null || seenPayload.has(r.inventory_item_id)) return false;
        seenPayload.add(r.inventory_item_id);
        return true;
      });
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
    comboItems: p.comboItems || [],
  }));
}
