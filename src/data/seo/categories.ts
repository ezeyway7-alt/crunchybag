/** Shared by the storefront and build. Keep existing URLs stable when catalog names change. */
export function categorySlug(category: { id: string; name: string }): string {
  if (category.id.startsWith('collection:')) return category.id.slice('collection:'.length);
  const known: Record<string, string> = {
    'cat-burger-sandwich-f6f4a4e52b5b': 'burgers',
    'cat-crunchy-fried-chicken-9edcce2efb22': 'fried-chicken',
    'cat-drinks-5493c0ec1baf': 'drinks',
    'cat-fries-crispy-0ebc7a494c41': 'fries',
    'cat-momo-sausages-51d777771cf0': 'momo-sausages',
    'cat-offer-37badfc8cd3c': 'offers',
    'cat-sauces-841daa4b5d18': 'sauces',
  };
  return known[category.id] || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || category.id;
}

export const categoryPath = (category: { id: string; name: string }) => `/menu/${encodeURIComponent(categorySlug(category))}`;

export const LEGACY_FOOD_PATHS: Record<string, string> = {
  '/burger': '/menu/burgers', '/fried-chicken': '/menu/fried-chicken',
  '/pakoda': '/menu/pakoda', '/fries': '/menu/fries',
  '/sandwich': '/menu/sandwiches', '/drink': '/menu/drinks',
};

const introductions: Record<string, string> = {
  pakoda: 'Compare chicken 65 pakoda, classic chicken pakoda, vegetable pakoda, onion pakoda and paneer pakoda. View current prices and portions, then order for 24/7 takeaway or delivery.',
  sandwiches: 'Browse chicken and vegetarian sandwiches from Crunchy Bag at Dhungesadhu Chowk, Imadol. Compare fillings and current prices for delivery or takeaway, available 24/7.',
  momo: 'Choose chicken or vegetable momo from the current Crunchy Bag menu. Open a dish for its description, price and available options before ordering delivery or takeaway.',
  burgers: 'Compare burgers and sandwiches from Crunchy Bag in Imadol, Lalitpur. Open each dish to check its filling, portion options and current price before ordering for takeaway or enquiring about delivery.',
  'fried-chicken': 'Browse our fried chicken menu and compare the available portions. Choose a dish to see its current price and options, then add sides or drinks from the menu.',
  drinks: 'Find a drink to accompany your meal or order on its own. Check each item for its current size options, ingredients and price.',
  fries: 'Explore fries and crispy snacks for a side dish or a shared order. Compare individual items and choose the portions that suit your meal.',
  'momo-sausages': 'Browse the available momo and sausage dishes from our Imadol kitchen. Open each item to see its description, options and current price.',
  offers: 'Explore the offers currently listed on our menu. Check the items included and the final total when ordering, as options and availability can change.',
  sauces: 'Choose a sauce to accompany chicken, burgers or snacks. Open each item for its description and available serving options.',
};

export const FOOD_COLLECTIONS = [
  { id: 'collection:pakoda', name: 'Pakoda', match: 'pakoda' },
  { id: 'collection:sandwiches', name: 'Sandwiches', match: 'sandwich' },
  { id: 'collection:momo', name: 'Momo', match: 'momo' },
] as const;

export function matchesFoodCollection(id: string, name: string) {
  const collection = FOOD_COLLECTIONS.find(item => item.id === id);
  return !!collection && name.toLowerCase().includes(collection.match);
}

export function categoryMetadata(category: { id: string; name: string }) {
  const path = categoryPath(category);
  return {
    path,
    title: `${category.name} Menu & Delivery | Crunchy Bag, Lalitpur`,
    h1: `${category.name} Menu`,
    description: introductions[categorySlug(category)] || `Browse ${category.name} at Crunchy Bag, Imadol, Lalitpur. View dishes, prices and ordering options for takeaway and delivery enquiries.`,
    canonical: `https://crunchybag.com${path}`,
  };
}
