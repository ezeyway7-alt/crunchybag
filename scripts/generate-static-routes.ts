import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RouteSEO {
  path: string;
  title: string;
  h1: string;
  description: string;
}

const STATIC_ROUTES: RouteSEO[] = [
  // Core Storefront Pages
  {
    path: '/menu',
    title: 'Full Online Food Menu | Crunchy Bag Kathmandu',
    h1: 'Explore Our Full Online Menu & Food Specialties',
    description: 'Browse our complete menu of crispy fried chicken, smash burgers, authentic pakodas, fries, grilled sandwiches and drinks in Kathmandu Valley.',
  },
  {
    path: '/combos',
    title: 'Special Value Combos & Deals | Crunchy Bag Kathmandu',
    h1: 'Best Value Combos, Family Bags & Feast Packages',
    description: 'Save big with Crunchy Bag special combo deals, Beast Combos, Duo packages, and Family Bags with fast food delivery across Kathmandu.',
  },
  {
    path: '/delivery',
    title: 'Food Delivery in Kathmandu Valley | Crunchy Bag',
    h1: 'Express Food Delivery Across 35+ Kathmandu Valley Hubs',
    description: 'Order hot crispy fried chicken and burgers online with rapid delivery across Kathmandu, Lalitpur, Bhaktapur, Imadol, Balkumari & Baneshwor.',
  },
  {
    path: '/reserve',
    title: 'Book a Table Online | Crunchy Bag Restaurant Kathmandu',
    h1: 'Table Reservations & Dine-in Hospitality in Durbar Marg',
    description: 'Reserve your dining table online at Crunchy Bag flagship restaurant on Kings Way, Durbar Marg, Kathmandu. Fast booking and instant confirmation.',
  },
  {
    path: '/orders',
    title: 'Live Order Tracking | Crunchy Bag Kathmandu',
    h1: 'Track Your Online Food Order in Real-Time',
    description: 'Track your Crunchy Bag food preparation and rider dispatch status live with your order receipt number or phone number.',
  },
  {
    path: '/profile',
    title: 'Customer Account & Loyalty Points | Crunchy Bag',
    h1: 'Manage Your Crunchy Bag Customer Profile & Rewards',
    description: 'View order history, claim loyalty reward points, and manage saved delivery addresses for Crunchy Bag online food delivery.',
  },
  {
    path: '/table-qr',
    title: 'Table QR Ordering | Crunchy Bag Restaurant',
    h1: 'Contactless Dine-in QR Menu & Instant Table Ordering',
    description: 'Scan your table QR code at Crunchy Bag to browse dishes, customize items, and order directly from your smartphone.',
  },
  {
    path: '/tv',
    title: 'Kitchen Order Status Screen | Crunchy Bag TV Display',
    h1: 'Live Kitchen Display & Customer Pickup Screen',
    description: 'Real-time order preparation and ready-for-pickup queue display for Crunchy Bag Kathmandu dine-in and takeout guests.',
  },

  // Food Categories
  {
    path: '/burger',
    title: 'Gourmet Smash Burgers | Crunchy Bag Kathmandu',
    h1: 'Handcrafted Chicken & Veggie Burgers in Kathmandu',
    description: 'Savor juicy chicken burgers, crispy fried chicken burgers, and golden aloo tikki burgers crafted on warm toasted buns with signature sauces.',
  },
  {
    path: '/fried-chicken',
    title: 'Artisanal Crispy Fried Chicken | Crunchy Bag Nepal',
    h1: 'Pressure-Fried Golden Crispy Chicken & Tenders',
    description: 'Experience Kathmandu Valley’s crunchiest fried chicken, marinated in Himalayan herbs and pressure-fried to seal in maximum flavor and tenderness.',
  },
  {
    path: '/pakoda',
    title: 'Nepali Spiced Pakodas & Snacks | Crunchy Bag',
    h1: 'Authentic Crispy Chicken 65, Paneer & Veg Pakodas',
    description: 'Enjoy traditional spiced Chicken 65 pakodas, paneer pakodas, gobi pakodas, and onion fritters served fresh with spicy mint chutney.',
  },
  {
    path: '/fries',
    title: 'Crispy French Fries & Potatoes | Crunchy Bag',
    h1: 'Golden Salted French Fries & Seasoned Potato Bites',
    description: 'Crispy golden French fries and herb-tossed potato bites served piping hot with creamy mayonnaise, cheese dip, and spicy ketchup.',
  },
  {
    path: '/sandwich',
    title: 'Fresh Grilled Sandwiches | Crunchy Bag Kathmandu',
    h1: 'Toasted Chicken & Fresh Vegetable Grilled Sandwiches',
    description: 'Grilled sandwiches packed with tender chicken, garden-fresh vegetables, melted cheese, and chef dressings, served toasted to perfection.',
  },
  {
    path: '/drink',
    title: 'Cold Coffee, Shakes & Beverages | Crunchy Bag',
    h1: 'Handcrafted Cold Coffee, Oreo Shakes & Sweet Lassi',
    description: 'Cool down with iced cold coffee blended with Oreo, thick chocolate milkshakes, traditional Nepali yogurt lassi, and chilled sodas.',
  },

  // Information & Legal Pages
  {
    path: '/about',
    title: 'About Us | Crunchy Bag Restaurant Kathmandu',
    h1: 'The Story & Culinary Passion Behind Crunchy Bag',
    description: 'Learn about Crunchy Bag’s mission to serve Nepal’s crispiest fried chicken, gourmet smash burgers, and hygienic comfort food with friendly hospitality.',
  },
  {
    path: '/privacy',
    title: 'Customer Privacy Policy | Crunchy Bag Kathmandu',
    h1: 'Privacy Policy & Customer Data Protection',
    description: 'Read how Crunchy Bag protects and safeguards customer personal details, phone numbers, delivery addresses, and payment information.',
  },
  {
    path: '/terms',
    title: 'Terms & Conditions of Service | Crunchy Bag',
    h1: 'Terms and Conditions of Online Ordering & Delivery',
    description: 'Review the official terms of service for placing online food delivery orders, table bookings, digital wallet payments, and refunds.',
  },
  {
    path: '/faq',
    title: 'Help Center & Frequently Asked Questions | Crunchy Bag',
    h1: 'Ordering FAQ, Delivery Times & Payment Support',
    description: 'Find answers to common questions about Crunchy Bag delivery fees, delivery radius, eSewa and FonePay payments, and order customization.',
  },
  {
    path: '/contact',
    title: 'Contact Us & Store Directions | Crunchy Bag Kathmandu',
    h1: 'Get in Touch with Crunchy Bag Customer Support',
    description: 'Contact Crunchy Bag for order inquiries, party catering, and store locations at Kings Way, Durbar Marg, Kathmandu, Nepal.',
  },

  // Kathmandu Valley Delivery Locations (19 Local SEO Hubs)
  {
    path: '/delivery/kathmandu',
    title: 'Online Food Delivery in Kathmandu | Crunchy Bag',
    h1: 'Express Fried Chicken & Burger Delivery in Kathmandu',
    description: 'Order hot crispy fried chicken, burgers, and pakodas with fast doorstep food delivery throughout Kathmandu metropolitan city.',
  },
  {
    path: '/delivery/lalitpur',
    title: 'Online Food Delivery in Lalitpur | Crunchy Bag',
    h1: 'Fast Food Delivery Across Lalitpur & Patan',
    description: 'Order crispy chicken burgers and snacks delivered hot to your door in Lalitpur, Jhamsikhel, Kupondole, Sanepa, and Lagankhel.',
  },
  {
    path: '/delivery/bhaktapur',
    title: 'Online Food Delivery in Bhaktapur | Crunchy Bag',
    h1: 'Rapid Food Delivery Throughout Bhaktapur & Thimi',
    description: 'Craving crunchy fried chicken and burgers in Bhaktapur? Order online from Crunchy Bag with fast delivery and instant eSewa checkout.',
  },
  {
    path: '/delivery/imadol',
    title: 'Food Delivery in Imadol Lalitpur | Crunchy Bag',
    h1: 'Crispy Fried Chicken & Burger Delivery in Imadol',
    description: 'Fast food delivery in Imadol, Lalitpur. Enjoy fresh chicken burgers, crispy fries, and pakoda combos delivered hot to your doorstep.',
  },
  {
    path: '/delivery/balkumari',
    title: 'Food Delivery in Balkumari Lalitpur | Crunchy Bag',
    h1: 'Fresh Hot Food Delivery to Balkumari & Ring Road',
    description: 'Order delicious crispy chicken, smash burgers, and cold drinks with express delivery to Balkumari, Lalitpur from Crunchy Bag.',
  },
  {
    path: '/delivery/koteshwor',
    title: 'Food Delivery in Koteshwor Kathmandu | Crunchy Bag',
    h1: 'Crispy Fried Chicken Delivery in Koteshwor & Jadibuti',
    description: 'Get Kathmandu’s best crispy fried chicken and burgers delivered fast to homes and offices in Koteshwor with eSewa and FonePay support.',
  },
  {
    path: '/delivery/tinkune',
    title: 'Food Delivery in Tinkune Kathmandu | Crunchy Bag',
    h1: 'Express Food Delivery in Tinkune & Subidhanagar',
    description: 'Piping hot burgers, fried chicken buckets, and thick shakes delivered in minutes to Tinkune, Kathmandu by Crunchy Bag.',
  },
  {
    path: '/delivery/baneshwor',
    title: 'Food Delivery in Baneshwor Kathmandu | Crunchy Bag',
    h1: 'Fast Food Delivery in Baneshwor & Shankhamul',
    description: 'Order online for speedy delivery of fried chicken, burgers, and pakoda snacks across Baneshwor, Kathmandu from Crunchy Bag.',
  },
  {
    path: '/delivery/new-baneshwor',
    title: 'Food Delivery in New Baneshwor | Crunchy Bag',
    h1: 'Crispy Burgers & Fried Chicken Delivery in New Baneshwor',
    description: 'Express office and home food delivery in New Baneshwor, Kathmandu. Savor artisan smash burgers and hot crispy tenders with instant tracking.',
  },
  {
    path: '/delivery/thimi',
    title: 'Food Delivery in Thimi & Madhyapur | Crunchy Bag',
    h1: 'Fried Chicken & Burger Delivery in Thimi, Bhaktapur',
    description: 'Hot, crunchy fast food delivery in Thimi and Madhyapur. Order family combo deals and cold drinks with fast digital payment.',
  },
  {
    path: '/delivery/gwarko',
    title: 'Food Delivery in Gwarko Lalitpur | Crunchy Bag',
    h1: 'Fast Food Delivery Across Gwarko & Mahalaxmi',
    description: 'Crispy fried chicken and burger delivery in Gwarko, Lalitpur. Track your order in real time with cashless digital checkout.',
  },
  {
    path: '/delivery/jhamsikhel',
    title: 'Food Delivery in Jhamsikhel Lalitpur | Crunchy Bag',
    h1: 'Gourmet Burgers & Fried Chicken Delivery in Jhamsikhel',
    description: 'Order delicious smash burgers, crispy chicken tenders, and cold coffee in Jhamsikhel, Lalitpur with rapid doorstep service.',
  },
  {
    path: '/delivery/durbar-marg',
    title: 'Food Delivery in Durbar Marg Kathmandu | Crunchy Bag',
    h1: 'Dine-in & Express Food Delivery in Durbar Marg',
    description: 'Direct delivery from our flagship branch on Kings Way, Durbar Marg, Kathmandu. Fresh, crunchy fried chicken and burgers in minutes.',
  },
  {
    path: '/delivery/thamel',
    title: 'Food Delivery in Thamel Kathmandu | Crunchy Bag',
    h1: 'Fast Food & Late Dinner Delivery in Thamel',
    description: 'Looking for food in Thamel? Crunchy Bag delivers crispy fried chicken, smash burgers, and snacks hot to your hotel or apartment.',
  },
  {
    path: '/delivery/chabahil',
    title: 'Food Delivery in Chabahil Kathmandu | Crunchy Bag',
    h1: 'Crispy Chicken & Burger Delivery in Chabahil & Mitrapark',
    description: 'Fast food delivery across Chabahil and surrounding neighborhoods. Order online with instant digital payment and live status tracking.',
  },
  {
    path: '/delivery/bouddha',
    title: 'Food Delivery in Bouddha Kathmandu | Crunchy Bag',
    h1: 'Hot Fried Chicken & Burger Delivery to Bouddha Stupa Area',
    description: 'Enjoy delicious crispy fried chicken, pakodas, and burgers delivered quickly to Bouddha, Kathmandu by Crunchy Bag.',
  },
  {
    path: '/delivery/sanepa',
    title: 'Food Delivery in Sanepa Lalitpur | Crunchy Bag',
    h1: 'Express Burger & Chicken Delivery in Sanepa',
    description: 'Order artisan burgers, crispy chicken tenders, and refreshing drinks delivered fresh to your door in Sanepa, Lalitpur.',
  },
  {
    path: '/delivery/kupandole',
    title: 'Food Delivery in Kupandole Lalitpur | Crunchy Bag',
    h1: 'Fast Food Delivery in Kupandole & Kandevsthan',
    description: 'Doorstep delivery of hot fried chicken and burgers across Kupandole, Lalitpur with eSewa and cash payment options.',
  },
  {
    path: '/delivery/lagankhel',
    title: 'Food Delivery in Lagankhel Lalitpur | Crunchy Bag',
    h1: 'Crispy Fried Chicken Delivery in Lagankhel & Kumaripati',
    description: 'Fast food delivery in Lagankhel, Lalitpur. Handcrafted burgers, family combo packages, and fries delivered straight to your home.',
  },
];

function generateStaticRoutes() {
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  const distIndexPath = path.join(distDir, 'index.html');
  const publicDir = path.join(rootDir, 'public');

  if (!fs.existsSync(distIndexPath)) {
    console.warn(`[Static Pre-render] dist/index.html not found. Skipping static generation.`);
    return;
  }

  const baseHtml = fs.readFileSync(distIndexPath, 'utf-8');
  console.log(`[Static Pre-render] Generating ${STATIC_ROUTES.length} static routes for Semrush & Google SEO...`);

  let generatedCount = 0;

  for (const route of STATIC_ROUTES) {
    // 1. Substitute title tag
    let pageHtml = baseHtml.replace(
      /<title>.*?<\/title>/i,
      `<title>${route.title}</title>`
    );

    // 2. Substitute meta description
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta name="description" content="${route.description}" />`
    );

    // 3. Substitute OpenGraph and Twitter tags
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta property="og:title" content="${route.title}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta property="og:description" content="${route.description}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta property="og:url" content="https://crunchybag.com${route.path}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta name="twitter:title" content="${route.title}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta name="twitter:description" content="${route.description}" />`
    );

    // 4. Substitute Canonical URL
    pageHtml = pageHtml.replace(
      /<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i,
      `<link rel="canonical" href="https://crunchybag.com${route.path}" />`
    );

    // 5. Substitute H1 tag to be 100% unique per page
    pageHtml = pageHtml.replace(
      /<h1>.*?<\/h1>/i,
      `<h1>${route.h1}</h1>`
    );

    // 6. Write output into dist/[route]/index.html
    const targetDir = path.join(distDir, route.path.replace(/^\//, ''));
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'index.html'), pageHtml, 'utf-8');

    generatedCount++;
  }

  console.log(`[Static Pre-render] Successfully generated ${generatedCount} individual static pages with unique Title, H1, description, and canonical tags!`);
}

generateStaticRoutes();
