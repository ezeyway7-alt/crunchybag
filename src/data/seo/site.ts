/** Owner-confirmed service information, 31 October 2026. */
export const SEO_SITE = {
  origin: 'https://crunchybag.com',
  name: 'Crunchy Bag',
  phone: '+9779761503339',
  additionalPhone: '+9779768382318',
  deliveryFee: 'Delivery is charged separately using the applicable Yango or Pathao rate for your route. Confirm the charge before placing your order.',
  socialProfiles: ['https://www.facebook.com/crunchybag1/', 'https://www.instagram.com/crunchybag1/', 'https://www.youtube.com/@crunchybag1', 'https://www.tiktok.com/@crunchybag1'],
  address: 'Dhungesadhu Chowk, Imadol, Lalitpur, Nepal',
  mapsUrl: 'https://maps.app.goo.gl/f7iDReKabgGHSvrv7',
  latitude: 27.6615375,
  longitude: 85.3506956,
  serviceHours: 'Delivery & takeaway: 24/7. Dine-in: 5 AM–11 PM daily.',
  preparation: 'Usually 7–15 minutes, depending on order size. Delivery travel time is additional and depends on your address and traffic.',
  minimumOrder: 'No minimum order.',
  cities: ['Kathmandu', 'Lalitpur', 'Bhaktapur'],
  firstOrderOffer: '10% off your first website order. Check the discount and final payable amount at checkout before confirming.',
} as const;

export function restaurantSchema(categories: { name: string }[]) {
  return {
    '@context': 'https://schema.org', '@type': 'FastFoodRestaurant',
    '@id': `${SEO_SITE.origin}/#restaurant`, name: SEO_SITE.name,
    url: `${SEO_SITE.origin}/`, telephone: SEO_SITE.phone,
    contactPoint: [SEO_SITE.phone, SEO_SITE.additionalPhone].map(telephone => ({ '@type': 'ContactPoint', telephone, contactType: 'customer service' })),
    sameAs: [...SEO_SITE.socialProfiles],
    image: `${SEO_SITE.origin}/crunchy_logo.png`,
    logo: `${SEO_SITE.origin}/icon-512.png`,
    alternateName: 'CrunchyBag',
    address: { '@type': 'PostalAddress', streetAddress: 'Dhungesadhu Chowk, Imadol', addressLocality: 'Lalitpur', addressRegion: 'Bagmati', addressCountry: 'NP' },
    hasMap: SEO_SITE.mapsUrl, hasMenu: `${SEO_SITE.origin}/menu`,
    geo: { '@type': 'GeoCoordinates', latitude: SEO_SITE.latitude, longitude: SEO_SITE.longitude },
    currenciesAccepted: 'NPR', servesCuisine: categories.map(category => category.name),
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '05:00', closes: '23:00' }],
    areaServed: SEO_SITE.cities.map(name => ({ '@type': 'City', name })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog', name: '24-hour food delivery and takeaway',
      itemListElement: ['Food delivery', 'Food takeaway'].map(name => ({ '@type': 'Offer', itemOffered: {
        '@type': 'Service', name, provider: { '@id': `${SEO_SITE.origin}/#restaurant` },
        hoursAvailable: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '00:00', closes: '23:59' },
      } })),
    },
  };
}
