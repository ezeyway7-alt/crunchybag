import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BLOG_ARTICLES, BlogArticle } from '../src/data/blogData';
import { productPages, escapeHtml } from './product-pages';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RouteSEO {
  path: string;
  canonicalPath?: string;
  noIndex?: boolean;
  title: string;
  h1: string;
  description: string;
  image?: string;
  ogType?: string;
  publishedTime?: string;
  author?: string;
  section?: string;
  schemaJson?: string;
  contentHtml?: string;
}

// 1. Kathmandu Valley Local Delivery Hubs with 100% Unique Local Details (Eliminates Doorway Pages)
const DELIVERY_HUBS = [
  {
    slug: 'baneshwor',
    name: 'Baneshwor',
    title: 'Food Delivery in Baneshwor Kathmandu | Crunchy Bag',
    landmarks: ['New Baneshwor Chowk', 'Shankhamul Bridge', 'Civil Hospital Area', 'Minbhawan', 'Eyeplex Mall'],
  },
  {
    slug: 'new-baneshwor',
    name: 'New Baneshwor',
    title: 'Food Delivery in New Baneshwor | Crunchy Bag',
    landmarks: ['Federal Parliament Complex', 'Devi Nagar', 'Shankhamul Road', 'Aloknagar', 'Madhya Baneshwor'],
  },
  {
    slug: 'thamel',
    name: 'Thamel',
    title: 'Food Delivery in Thamel Kathmandu | Crunchy Bag',
    landmarks: ['Chaksibari Marg', 'Mandala Street', 'Kwahiti', 'Narsingh Chowk', 'Paknajol'],
  },
  {
    slug: 'durbar-marg',
    name: 'Durbar Marg',
    title: 'Food Delivery in Durbar Marg Kathmandu | Crunchy Bag',
    landmarks: ['Narayanhiti Palace Museum Gate', 'Kings Way', 'Hotel Annapurna Area', 'Sherpa Mall', 'Durbarmarg Roundabout'],
  },
  {
    slug: 'jhamsikhel',
    name: 'Jhamsikhel',
    title: 'Food Delivery in Jhamsikhel Lalitpur | Crunchy Bag',
    landmarks: ['Restaurant Street', 'St. Mary’s School Area', 'Sanepa Crossing', 'Dhobighat Road', 'Bhanimandal'],
  },
  {
    slug: 'koteshwor',
    name: 'Koteshwor',
    title: 'Food Delivery in Koteshwor Kathmandu | Crunchy Bag',
    landmarks: ['Koteshwor Chowk', 'Bhatbhateni Superstore Koteshwor', 'Mahadevsthan', 'Jadibuti Road', 'Narephphant'],
  },
  {
    slug: 'tinkune',
    name: 'Tinkune',
    title: 'Food Delivery in Tinkune Kathmandu | Crunchy Bag',
    landmarks: ['Tinkune Park Island', 'Subidhanagar', 'Airport Cargo Gate', 'Gairigaon', 'Bridge to Balkumari'],
  },
  {
    slug: 'imadol',
    name: 'Imadol',
    title: 'Food Delivery in Imadol Lalitpur | Crunchy Bag Home Kitchen',
    landmarks: ['Krishna Mandir Imadol', 'Bojhpokhari', 'Tikathali Crossroad', 'Sital Heights', 'Mahalaxmi Municipality Office'],
  },
  {
    slug: 'balkumari',
    name: 'Balkumari',
    title: 'Food Delivery in Balkumari Lalitpur | Crunchy Bag',
    landmarks: ['Balkumari Bridge', 'CCRC College Area', 'Ring Road Lalitpur', 'Kharibot', 'Tyanglaphant'],
  },
  {
    slug: 'gwarko',
    name: 'Gwarko',
    title: 'Food Delivery in Gwarko Lalitpur | Crunchy Bag',
    landmarks: ['Gwarko Flyover Chowk', 'B&B Hospital Area', 'Kist Medical College Road', 'Imadol Entrance', 'Lalitpur Ring Road'],
  },
  {
    slug: 'sanepa',
    name: 'Sanepa',
    title: 'Food Delivery in Sanepa Lalitpur | Crunchy Bag',
    landmarks: ['Sanepa Chowk', 'British School Area', 'Jhamsikhel Border', 'Star Hospital Area', 'Sagarmatha Complex'],
  },
  {
    slug: 'kupandole',
    name: 'Kupandole',
    title: 'Food Delivery in Kupandole Lalitpur | Crunchy Bag',
    landmarks: ['Kupandole Heights', 'Kandevsthan', 'Bagmati Bridge Crossing', 'Hotel Himalaya Area', 'Pulchowk Road'],
  },
  {
    slug: 'lagankhel',
    name: 'Lagankhel',
    title: 'Food Delivery in Lagankhel Lalitpur | Crunchy Bag',
    landmarks: ['Lagankhel Bus Park', 'Patan Hospital Area', 'Batuk Bhairab', 'Prayag Pokhari', 'Kumaripati Border'],
  },
  {
    slug: 'chabahil',
    name: 'Chabahil',
    title: 'Food Delivery in Chabahil Kathmandu | Crunchy Bag',
    landmarks: ['Chabahil Stupa Chowk', 'KL Tower', 'Mitrapark', 'Pashupati Area North', 'Gopikrishna Cinema Road'],
  },
  {
    slug: 'bouddha',
    name: 'Bouddha',
    title: 'Food Delivery in Bouddha Kathmandu | Crunchy Bag',
    landmarks: ['Boudhanath Stupa Gate', 'Tusal', 'Fulbari', 'Pimaling Area', 'Hyatt Regency Gate'],
  },
  {
    slug: 'thimi',
    name: 'Thimi',
    title: 'Food Delivery in Thimi & Madhyapur | Crunchy Bag',
    landmarks: ['Sankhadhar Chowk', 'Radhe Radhe', 'Madhyapur Hospital', 'Bode Road', 'Purano Thimi'],
  },
  {
    slug: 'bhaktapur',
    name: 'Bhaktapur',
    title: 'Online Food Delivery in Bhaktapur | Crunchy Bag',
    landmarks: ['Sallaghari Chowk', 'Chyamhasingh', 'Bhaktapur Durbar Square Entrance', 'Suryabinayak', 'Kamalbinayak'],
  },
  {
    slug: 'kathmandu',
    name: 'Kathmandu',
    title: 'Online Food Delivery in Kathmandu | Crunchy Bag',
    landmarks: ['Durbar Marg', 'New Road', 'Thamel', 'Lazimpat', 'Baluwatar', 'Baneshwor'],
  },
  {
    slug: 'lalitpur',
    name: 'Lalitpur',
    title: 'Online Food Delivery in Lalitpur | Crunchy Bag',
    landmarks: ['Jhamsikhel', 'Kupondole', 'Sanepa', 'Pulchowk', 'Jawalakhel', 'Lagankhel'],
  },
];

// These are delivery areas, not additional physical outlets.
function generateDeliveryHubHtml(hub: typeof DELIVERY_HUBS[0]): string {
  return `<main id="app-landing-summary" class="max-w-4xl mx-auto px-4 py-8 space-y-6 text-zinc-300">
    <nav><a href="/">Crunchy Bag</a> / <a href="/delivery">Delivery</a></nav>
    <h1>Crunchy Bag delivery enquiries for ${escapeHtml(hub.name)}</h1>
    <p>Our only restaurant and kitchen is in Imadol, Lalitpur.${hub.slug === 'imadol' ? ' Visit us for dine-in or takeaway.' : ` Contact this outlet for delivery enquiries to ${escapeHtml(hub.name)}.`}</p>
    <h2>Planning an order to ${escapeHtml(hub.name)}</h2>
    <p>Provide your full address and a nearby landmark when ordering. Contact the Imadol outlet to confirm coverage, delivery charges and an estimated arrival time before placing your order.</p>
    <p>Local landmarks include ${hub.landmarks.map(escapeHtml).join(', ')}.</p>
    <p><a href="/menu">See the current menu and prices</a></p>
    <p><a href="tel:+9779761503339">Call +977 9761503339</a> or <a href="https://share.google/wJPKlrcMJueR0EmvX">find our Imadol restaurant on Google Maps</a>.</p>
  </main>`;
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
    h1: 'Food Delivery from Crunchy Bag, Imadol',
    description: 'Contact our Imadol restaurant to confirm delivery coverage, charges and arrival time for your address in Kathmandu Valley.',
    contentHtml: `<main id="app-landing-summary" class="max-w-4xl mx-auto px-4 py-8 space-y-6 text-zinc-300">
      <h1>Food delivery from Crunchy Bag, Imadol</h1>
      <p>We operate one restaurant in Imadol, Lalitpur. Call <a href="tel:+9779761503339">+977 9761503339</a> to confirm delivery availability, fees and arrival time for your address.</p>
      <p><a href="/menu">Browse our current food menu</a></p>
      <h2>Delivery area enquiries</h2><ul>${DELIVERY_HUBS.map(hub => `<li><a href="/delivery/${hub.slug}">${hub.name}</a></li>`).join('')}</ul>
    </main>`,
  },
  {
    path: '/reserve',
    title: 'Book a Table Online | Crunchy Bag Restaurant Lalitpur',
    h1: 'Table Reservations & Dine-in Hospitality in Imadol',
    description: 'Reserve your dining table online at Crunchy Bag central restaurant in Imadol, Lalitpur, Nepal. Fast booking and instant confirmation.',
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

  // Legal & Information Pages (Rendered with Full Authentic Text, Not Copied Homepage)
  {
    path: '/terms',
    title: 'Terms & Conditions of Service | Crunchy Bag',
    h1: 'Terms and Conditions of Online Ordering & Delivery',
    description: 'Review the official terms of service for placing online food delivery orders, table bookings, digital wallet payments, and refunds.',
    contentHtml: `
      <main id="app-landing-summary" class="max-w-4xl mx-auto px-4 py-8 space-y-6 text-zinc-300">
        <header class="space-y-2 border-b border-zinc-800 pb-4">
          <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Terms and Conditions of Service</h1>
          <p class="text-xs text-zinc-500">Effective Date: October 1, 2026 | Governing Law: Nepal Consumer Protection & Electronic Transaction Act</p>
        </header>

        <section class="space-y-4 text-xs leading-relaxed text-zinc-300">
          <div>
            <h2 class="font-bold text-white text-sm">1. Introduction & Acceptance</h2>
            <p>Welcome to Crunchy Bag Restaurant ("Crunchy Bag", "we", "our"). By browsing, placing orders through our website (https://crunchybag.com), reserving tables, or scanning in-store QR codes, you agree to comply with and be bound by these Terms and Conditions.</p>
          </div>
          <div>
            <h2 class="font-bold text-white text-sm">2. Ordering & Kitchen Dispatch</h2>
            <p>Orders submitted online are sent directly to our central kitchen in Imadol, Lalitpur. Preparation begins immediately. Please ensure delivery addresses and contact phone numbers are accurate to avoid delivery delays.</p>
          </div>
          <div>
            <h2 class="font-bold text-white text-sm">3. Pricing & Payment Gateways</h2>
            <p>All prices are listed in Nepalese Rupees (NPR) and include applicable local taxes. We accept digital payments via eSewa, FonePay QR code scan on delivery, and Cash on Delivery (COD).</p>
          </div>
          <div>
            <h2 class="font-bold text-white text-sm">4. Cancellation & Refund Policy</h2>
            <p>Due to the perishable nature of freshly prepared hot fast food, cancellations are only accepted if made before the kitchen begins frying your order. In the event of a damaged package or incorrect item, contact our customer hotline at 9761503339 for an immediate replacement or digital wallet refund.</p>
          </div>
        </section>

        <footer class="pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-1">
          <p><strong>Crunchy Bag Restaurant:</strong> Imadol, Lalitpur 44700, Nepal (<a href="https://share.google/wJPKlrcMJueR0EmvX" target="_blank" rel="noopener noreferrer" class="text-amber-500 hover:underline">Google Maps</a>)</p>
          <p><strong>Hotline:</strong> <a href="tel:9761503339" class="font-mono text-zinc-300">9761503339</a> | <strong>Email:</strong> hello@crunchybag.com</p>
          <p><a href="/" class="text-amber-500 hover:underline">&larr; Return to Crunchy Bag Home</a></p>
        </footer>
      </main>
    `,
  },
  {
    path: '/privacy',
    title: 'Customer Privacy Policy | Crunchy Bag Kathmandu',
    h1: 'Privacy Policy & Customer Data Protection',
    description: 'Read how Crunchy Bag protects and safeguards customer personal details, phone numbers, delivery addresses, and payment information.',
    contentHtml: `
      <main id="app-landing-summary" class="max-w-4xl mx-auto px-4 py-8 space-y-6 text-zinc-300">
        <header class="space-y-2 border-b border-zinc-800 pb-4">
          <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Customer Privacy Policy</h1>
          <p class="text-xs text-zinc-500">In accordance with the Individual Privacy Act (2075) of Nepal | Last Updated: October 2026</p>
        </header>

        <section class="space-y-4 text-xs leading-relaxed text-zinc-300">
          <div>
            <h2 class="font-bold text-white text-sm">1. Information We Collect</h2>
            <p>Crunchy Bag collects minimal customer information strictly necessary to process food delivery orders and table reservations: your name, contact phone number, delivery address/landmark, and optional email.</p>
          </div>
          <div>
            <h2 class="font-bold text-white text-sm">2. Use of Information</h2>
            <p>Your details are used solely to fulfill your meal order, route riders to your location, communicate delivery status via SMS/WhatsApp, and verify electronic payments with eSewa or FonePay.</p>
          </div>
          <div>
            <h2 class="font-bold text-white text-sm">3. Data Security & Third Parties</h2>
            <p>We do NOT sell, rent, or trade your personal data. Electronic payment processing occurs securely through licensed payment service providers in Nepal. All server communications utilize 256-bit TLS encryption with strict HSTS enforcement.</p>
          </div>
          <div>
            <h2 class="font-bold text-white text-sm">4. Data Deletion Requests</h2>
            <p>Customers can request deletion of their account history and contact data anytime by emailing hello@crunchybag.com or calling 9761503339.</p>
          </div>
        </section>

        <footer class="pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-1">
          <p><strong>Data Controller:</strong> Crunchy Bag Restaurant, Imadol, Lalitpur 44700, Nepal (<a href="https://share.google/wJPKlrcMJueR0EmvX" target="_blank" rel="noopener noreferrer" class="text-amber-500 hover:underline">Google Maps</a>)</p>
          <p><strong>Hotline:</strong> <a href="tel:9761503339" class="font-mono text-zinc-300">9761503339</a> | <strong>Email:</strong> hello@crunchybag.com</p>
          <p><a href="/" class="text-amber-500 hover:underline">&larr; Return to Crunchy Bag Home</a></p>
        </footer>
      </main>
    `,
  },
  {
    path: '/about',
    title: 'About Us | Crunchy Bag Restaurant Kathmandu',
    h1: 'The Story & Culinary Passion Behind Crunchy Bag',
    description: 'Learn about Crunchy Bag’s mission to serve Nepal’s crispiest fried chicken, gourmet smash burgers, and hygienic comfort food with friendly hospitality.',
    contentHtml: `
      <main id="app-landing-summary" class="max-w-4xl mx-auto px-4 py-8 space-y-6 text-zinc-300">
        <header class="space-y-2 border-b border-zinc-800 pb-4">
          <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">About Crunchy Bag Restaurant</h1>
          <p class="text-sm text-amber-500 font-semibold">Crafting Nepal’s Premier Crispy Fried Chicken & Smash Burgers</p>
        </header>

        <section class="space-y-4 text-xs leading-relaxed text-zinc-300">
          <p>Founded with a passion for uncompromising crunch and bold flavors, Crunchy Bag is Kathmandu Valley’s premier fast-food kitchen. Located in Imadol, Lalitpur, we set out with a simple promise: to elevate comfort dining in Nepal through freshly sourced local poultry, authentic Himalayan herb marinades, and proprietary pressure-frying culinary technology.</p>
          <p>Unlike standard fast food, every portion of our crispy fried chicken, hand-smashed burger patties, and local pakoda snacks is prepared fresh to order. We pride ourselves on clean kitchen hygiene, cashless digital innovation with eSewa and FonePay, and ultra-fast thermal delivery across 35+ Kathmandu Valley neighborhoods.</p>
        </section>

        <footer class="pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-1">
          <p><strong>Central Kitchen &amp; Outlet:</strong> Imadol, Lalitpur 44700, Nepal (<a href="https://share.google/wJPKlrcMJueR0EmvX" target="_blank" rel="noopener noreferrer" class="text-amber-500 hover:underline">Google Maps</a>)</p>
          <p><strong>Hotline:</strong> <a href="tel:9761503339" class="font-mono text-zinc-300">9761503339</a> | <strong>Hours:</strong> 10:00 AM – 11:30 PM Daily</p>
          <p><a href="/" class="text-amber-500 hover:underline">&larr; Return to Crunchy Bag Home</a></p>
        </footer>
      </main>
    `,
  },
  {
    path: '/faq',
    title: 'Help Center & Frequently Asked Questions | Crunchy Bag',
    h1: 'Ordering FAQ, Delivery Times & Payment Support',
    description: 'Find answers to common questions about Crunchy Bag delivery fees, delivery radius, eSewa and FonePay payments, and order customization.',
    contentHtml: `
      <main id="app-landing-summary" class="max-w-4xl mx-auto px-4 py-8 space-y-6 text-zinc-300">
        <header class="space-y-2 border-b border-zinc-800 pb-4">
          <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Ordering FAQ & Customer Support</h1>
          <p class="text-xs text-zinc-400">Everything you need to know about ordering online, delivery timings, and digital payments.</p>
        </header>

        <section class="space-y-4 text-xs leading-relaxed text-zinc-300">
          <div>
            <h2 class="font-bold text-white text-sm">Where does Crunchy Bag deliver?</h2>
            <p>We deliver across Kathmandu, Lalitpur, and Bhaktapur, covering over 35 neighborhoods including Durbar Marg, Thamel, Baneshwor, Koteshwor, Imadol, Balkumari, Jhamsikhel, Sanepa, and Chabahil.</p>
          </div>
          <div>
            <h2 class="font-bold text-white text-sm">What are your operating hours?</h2>
            <p>Our kitchen operates daily from 10:00 AM to 11:30 PM, Monday through Sunday.</p>
          </div>
          <div>
            <h2 class="font-bold text-white text-sm">Which digital payment methods do you accept?</h2>
            <p>We natively accept eSewa digital wallet online, FonePay QR code scan on delivery, and Cash on Delivery (COD).</p>
          </div>
          <div>
            <h2 class="font-bold text-white text-sm">How long does food delivery take?</h2>
            <p>Central Kathmandu deliveries take 20 to 30 minutes; Lalitpur and east valley hubs take approximately 30 to 45 minutes.</p>
          </div>
        </section>

        <footer class="pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-1">
          <p><strong>Hotline Support:</strong> <a href="tel:9761503339" class="font-mono text-zinc-300">9761503339</a> | <strong>Email:</strong> hello@crunchybag.com</p>
          <p><strong>Location:</strong> Imadol, Lalitpur (<a href="https://share.google/wJPKlrcMJueR0EmvX" target="_blank" rel="noopener noreferrer" class="text-amber-500 hover:underline">Google Maps</a>)</p>
          <p><a href="/" class="text-amber-500 hover:underline">&larr; Return to Crunchy Bag Home</a></p>
        </footer>
      </main>
    `,
  },
  {
    path: '/contact',
    title: 'Contact Us & Store Directions | Crunchy Bag Kathmandu',
    h1: 'Get in Touch with Crunchy Bag Customer Support',
    description: 'Contact Crunchy Bag for order inquiries, party catering, and store locations at Imadol, Lalitpur, Kathmandu Valley, Nepal.',
    contentHtml: `
      <main id="app-landing-summary" class="max-w-4xl mx-auto px-4 py-8 space-y-6 text-zinc-300">
        <header class="space-y-2 border-b border-zinc-800 pb-4">
          <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Contact Crunchy Bag Restaurant</h1>
          <p class="text-xs text-zinc-400">Reach our team for dining reservations, bulk catering orders, delivery support, and corporate feedback.</p>
        </header>

        <section class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed text-zinc-300">
          <div class="p-4 bg-[#14161C] border border-zinc-800 space-y-2">
            <h2 class="font-bold text-white text-sm">Central Outlet &amp; Kitchen</h2>
            <p><strong>Address:</strong> Imadol, Lalitpur 44700, Nepal</p>
            <p><strong>Hotline / Order:</strong> <a href="tel:9761503339" class="font-mono text-amber-400">9761503339</a></p>
            <p><strong>Email:</strong> hello@crunchybag.com</p>
            <p><strong>Hours:</strong> 10:00 AM – 11:30 PM Daily</p>
          </div>
          <div class="p-4 bg-[#14161C] border border-zinc-800 space-y-2">
            <h2 class="font-bold text-white text-sm">Direct Online Channels</h2>
            <p><strong>Website:</strong> https://crunchybag.com</p>
            <p><strong>Google Maps:</strong> <a href="https://share.google/wJPKlrcMJueR0EmvX" target="_blank" rel="noopener noreferrer" class="text-amber-400 hover:underline">Imadol, Lalitpur Hub Directions</a></p>
            <p><strong>Catering &amp; Parties:</strong> Contact hotline at least 3 hours in advance</p>
            <p><strong>Payment Support:</strong> Instant eSewa &amp; FonePay QR resolution</p>
          </div>
        </section>

        <footer class="pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-1">
          <p>© 2026 Crunchy Bag Restaurant. All rights reserved.</p>
          <p><a href="/" class="text-amber-500 hover:underline">&larr; Return to Crunchy Bag Home</a></p>
        </footer>
      </main>
    `,
  },
];

function renderBlogListingHtml(): string {
  const articleCards = BLOG_ARTICLES.map(
    (a) => `
    <article class="p-4 bg-[#14161C] border border-zinc-800 space-y-3">
      <a href="/blog/${a.slug}" class="block overflow-hidden bg-zinc-900 aspect-video">
        <img src="${a.image}" alt="${a.title}" class="w-full h-full object-cover" />
      </a>
      <div class="space-y-1">
        <div class="text-[11px] font-mono text-amber-500 uppercase font-bold">${a.category} • ${a.readTime}</div>
        <h2 class="text-base font-bold text-white hover:text-amber-400">
          <a href="/blog/${a.slug}">${a.title}</a>
        </h2>
        <p class="text-xs text-zinc-400 leading-relaxed">${a.excerpt}</p>
      </div>
      <div class="pt-2 border-t border-zinc-800 text-xs flex justify-between items-center text-zinc-500">
        <span>By ${a.author}</span>
        <a href="/blog/${a.slug}" class="text-amber-500 hover:underline font-bold">Read Story &rarr;</a>
      </div>
    </article>
  `
  ).join('');

  return `
    <main id="app-landing-summary" class="max-w-6xl mx-auto px-4 py-8 space-y-8 text-zinc-300">
      <header class="space-y-2 border-b border-zinc-800 pb-4 text-center max-w-3xl mx-auto">
        <div class="inline-block px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono font-bold uppercase tracking-wider">
          The Crunchy Culinary Journal
        </div>
        <h1 class="text-2xl sm:text-4xl font-bold text-white tracking-tight">Stories, Food Science &amp; Kathmandu Kitchen Secrets</h1>
        <p class="text-xs sm:text-sm text-zinc-400">From our 18-hour cold brining technique in Imadol to Himalayan Timur peppercorn sourcing across Kavre and Chitwan, explore the passion behind Nepal’s premier crunch.</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${articleCards}
      </div>

      <!-- Consistent NAP Footer -->
      <footer class="pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-2">
        <p><strong>Central Kitchen &amp; Outlet:</strong> Imadol, Lalitpur 44700, Nepal (<a href="https://share.google/wJPKlrcMJueR0EmvX" target="_blank" rel="noopener noreferrer" class="text-amber-500 hover:underline">Google Maps</a>)</p>
        <p><strong>Direct Hotline:</strong> <a href="tel:9761503339" class="font-mono text-zinc-300 hover:underline">9761503339</a> | <strong>Hours:</strong> 10:00 AM – 11:30 PM Daily (Mon–Sun)</p>
        <p><a href="/" class="text-amber-500 hover:underline">&larr; Return to Crunchy Bag Home</a></p>
      </footer>
    </main>
  `;
}

function renderBlogDetailHtml(article: BlogArticle): string {
  const paragraphsHtml = article.content
    .map((p) => `<p class="leading-relaxed mb-4">${p}</p>`)
    .join('');

  const tagsHtml = article.tags
    .map((t) => `<span class="px-2 py-0.5 bg-zinc-800 text-zinc-300 font-mono text-[11px] mr-1.5 mb-1.5 inline-block">#${t}</span>`)
    .join('');

  const relatedDishHtml = article.relatedDish
    ? `
    <div class="p-4 bg-zinc-900 border border-amber-500/40 rounded space-y-2 my-6">
      <div class="text-xs font-mono font-bold uppercase text-amber-400">Taste The Story</div>
      <div class="flex items-center gap-3">
        <img src="${article.relatedDish.image}" alt="${article.relatedDish.name}" class="w-16 h-16 object-cover border border-zinc-700 shrink-0" />
        <div>
          <h3 class="text-sm font-bold text-white">${article.relatedDish.name}</h3>
          <p class="text-xs text-zinc-400">${article.relatedDish.description}</p>
          <p class="text-xs font-mono text-amber-400 font-bold">NPR ${article.relatedDish.price}</p>
        </div>
      </div>
      <p><a href="/menu" class="text-xs font-bold text-amber-500 hover:underline">${article.relatedDish.actionLabel} &rarr;</a></p>
    </div>
  `
    : '';

  return `
    <main id="app-landing-summary" class="max-w-4xl mx-auto px-4 py-8 space-y-6 text-zinc-300">
      <nav aria-label="Breadcrumb" class="text-xs text-zinc-500 space-x-1">
        <a href="/" class="hover:underline">Home</a> &gt;
        <a href="/blogs" class="hover:underline">Culinary Blogs</a> &gt;
        <span class="text-zinc-300">${article.title}</span>
      </nav>

      <article class="space-y-6">
        <header class="space-y-3 border-b border-zinc-800 pb-4">
          <div class="flex items-center gap-2 text-xs font-mono">
            <span class="px-2 py-0.5 bg-amber-500 text-black font-black uppercase text-[10px]">${article.category}</span>
            <span class="text-zinc-500">•</span>
            <span class="text-zinc-400">${article.readTime}</span>
            <span class="text-zinc-500">•</span>
            <time datetime="${article.isoDate}" class="text-zinc-400">${article.date}</time>
          </div>
          <h1 class="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">${article.title}</h1>
          <p class="text-xs text-zinc-400">By <strong>${article.author}</strong> (${article.authorRole}) • Crunchy Bag Culinary Lab</p>
        </header>

        <div class="overflow-hidden border border-zinc-800">
          <img src="${article.image}" alt="${article.title}" class="w-full h-64 sm:h-80 object-cover" />
        </div>

        <blockquote class="p-4 bg-amber-500/10 border-l-4 border-amber-500 text-zinc-200 text-sm sm:text-base font-medium italic">
          "${article.excerpt}"
        </blockquote>

        <section class="text-xs sm:text-sm leading-relaxed text-zinc-300 space-y-4">
          ${paragraphsHtml}
        </section>

        ${relatedDishHtml}

        <div class="pt-4 border-t border-zinc-800">
          <div class="text-xs text-zinc-500 mb-2 font-bold uppercase">Topics:</div>
          <div>${tagsHtml}</div>
        </div>
      </article>

      <footer class="pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-2">
        <p><strong>Central Kitchen &amp; Outlet:</strong> Imadol, Lalitpur 44700, Nepal (<a href="https://share.google/wJPKlrcMJueR0EmvX" target="_blank" rel="noopener noreferrer" class="text-amber-500 hover:underline">Google Maps</a>)</p>
        <p><strong>Direct Hotline:</strong> <a href="tel:9761503339" class="font-mono text-zinc-300 hover:underline">9761503339</a> | <strong>Hours:</strong> 10:00 AM – 11:30 PM Daily (Mon–Sun)</p>
        <p><a href="/blogs" class="text-amber-500 hover:underline">&larr; Return to Culinary Blogs Directory</a></p>
      </footer>
    </main>
  `;
}

// Append all 19 Delivery Hubs to STATIC_ROUTES with 100% Unique Localized Content
for (const hub of DELIVERY_HUBS) {
  STATIC_ROUTES.push({
    path: `/delivery/${hub.slug}`,
    title: hub.title,
    h1: `Crunchy Bag delivery enquiries for ${hub.name}`,
    description: `Contact Crunchy Bag in Imadol, Lalitpur about food delivery to ${hub.name}. Confirm coverage, delivery charges and arrival time with our outlet.`,
    contentHtml: generateDeliveryHubHtml(hub),
  });
}

// Append Blogs Listing Portal
STATIC_ROUTES.push({
  path: '/blogs',
  title: 'Culinary Journal & Food Guides in Kathmandu | Crunchy Bag Blogs',
  h1: 'Stories, Food Science & Kathmandu Kitchen Secrets',
  description: 'Explore kitchen secrets, Himalayan spice sourcing, and crispy fried chicken food guides in Kathmandu from Crunchy Bag culinary team.',
  image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=80',
  contentHtml: renderBlogListingHtml(),
});

STATIC_ROUTES.push({
  path: '/blog',
  title: 'Culinary Journal & Food Guides in Kathmandu | Crunchy Bag Blogs',
  h1: 'Stories, Food Science & Kathmandu Kitchen Secrets',
  description: 'Explore kitchen secrets, Himalayan spice sourcing, and crispy fried chicken food guides in Kathmandu from Crunchy Bag culinary team.',
  image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=80',
  contentHtml: renderBlogListingHtml(),
});

// Append Individual Blog Detail Routes with Full SEO & Schema.org BlogPosting
for (const article of BLOG_ARTICLES) {
  const schemaObj = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `https://crunchybag.com/blog/${article.slug}#article`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://crunchybag.com/blog/${article.slug}`,
    },
    headline: article.title,
    description: article.excerpt,
    image: [article.image],
    datePublished: article.isoDate,
    dateModified: article.isoDate,
    author: {
      '@type': 'Person',
      name: article.author,
      jobTitle: article.authorRole,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Crunchy Bag',
      logo: {
        '@type': 'ImageObject',
        url: 'https://crunchybag.com/crunchy_logo.png',
      },
    },
    keywords: article.tags.join(', '),
  };

  const blogRoute: RouteSEO = {
    path: `/blog/${article.slug}`,
    title: article.metaTitle,
    h1: article.title,
    description: article.metaDescription,
    image: article.image,
    ogType: 'article',
    publishedTime: article.isoDate,
    author: article.author,
    section: article.category,
    schemaJson: JSON.stringify(schemaObj, null, 2),
    contentHtml: renderBlogDetailHtml(article),
  };

  STATIC_ROUTES.push(blogRoute);

  // Also support /blogs/:slug alias
  STATIC_ROUTES.push({
    ...blogRoute,
    path: `/blogs/${article.slug}`,
  });
}

async function generateStaticRoutes() {
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  const distIndexPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(distIndexPath)) {
    console.warn(`[Static Pre-render] dist/index.html not found. Skipping static generation.`);
    return;
  }

  const catalog = await productPages();
  STATIC_ROUTES.push(...catalog.routes);
  const baseHtml = fs.readFileSync(distIndexPath, 'utf-8');
  console.log(`[Static Pre-render] Generating ${STATIC_ROUTES.length} routes...`);

  let generatedCount = 0;

  for (const route of STATIC_ROUTES) {
    const canonicalPath = route.canonicalPath || route.path.replace(/^\/blogs\//, '/blog/').replace(/^\/blog$/, '/blogs');
    route.noIndex = ['/orders', '/profile', '/table-qr', '/tv'].includes(route.path);
    let pageHtml = baseHtml;

    // 1. Substitute title tag
    pageHtml = pageHtml.replace(
      /<title>.*?<\/title>/i,
      `<title>${escapeHtml(route.title)}</title>`
    );

    // 2. Substitute meta description
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(route.description)}" />`
    );

    // 3. Substitute OpenGraph and Twitter tags
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta property="og:title" content="${escapeHtml(route.title)}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta property="og:description" content="${escapeHtml(route.description)}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta property="og:url" content="https://crunchybag.com${canonicalPath}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`
    );

    // 4. Substitute Canonical URL
    pageHtml = pageHtml.replace(
      /<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i,
      `<link rel="canonical" href="https://crunchybag.com${canonicalPath}" />`
    );

    // 5. Update OpenGraph image & Twitter image if specified
    if (route.image) {
      pageHtml = pageHtml.replace(
        /<meta\s+property=["']og:image["']\s+content=["'].*?["']\s*\/?>/i,
        `<meta property="og:image" content="${escapeHtml(route.image)}" />`
      );
      pageHtml = pageHtml.replace(
        /<meta\s+name=["']twitter:image["']\s+content=["'].*?["']\s*\/?>/i,
        `<meta name="twitter:image" content="${escapeHtml(route.image)}" />`
      );
    }

    // 6. Update OpenGraph type if article
    if (route.ogType) {
      pageHtml = pageHtml.replace(
        /<meta\s+property=["']og:type["']\s+content=["'].*?["']\s*\/?>/i,
        `<meta property="og:type" content="${route.ogType}" />`
      );
    }

    // 7. Inject Article JSON-LD Schema into <head>
    if (route.schemaJson) {
      pageHtml = pageHtml.replace(
        /<\/head>/i,
        `  <script id="dynamic-route-schema" type="application/ld+json">\n${route.schemaJson.replace(/</g, '\\u003c')}\n  </script>\n</head>`
      );
    }

    // 8. Replace <main id="app-landing-summary"> with 100% Unique Page Content
    if (route.contentHtml) {
      pageHtml = pageHtml.replace(
        /<main id="app-landing-summary"[\s\S]*?<\/main>/i,
        route.contentHtml.trim()
      );
    } else {
      // For categories, update H1 cleanly
      pageHtml = pageHtml.replace(
        /<h1\b[^>]*>.*?<\/h1>/i,
        `<h1>${escapeHtml(route.h1)}</h1>`
      );
    }

    if (route.path === '/menu') {
      pageHtml = pageHtml.replace('</main>', `<nav aria-label="Dishes"><ul>${catalog.links}</ul></nav></main>`);
    }
    if (route.noIndex) {
      pageHtml = pageHtml.replace(/(<meta name="(?:robots|googlebot)" content=")[^"]*/g, '$1noindex, follow');
    }
    // Keep informational page content visible after React mounts, too.
    const payload = JSON.stringify({ path: route.path, title: route.title, description: route.description,
      canonical: `https://crunchybag.com${canonicalPath}`, contentHtml: route.contentHtml, noIndex: route.noIndex }).replace(/</g, '\\u003c');
    pageHtml = pageHtml.replace('</head>', `<script id="static-route-data" type="application/json">${payload}</script></head>`);

    // 9. Write output into dist/[route]/index.html
    const targetDir = path.join(distDir, route.path.replace(/^\//, ''));
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'index.html'), pageHtml, 'utf-8');

    generatedCount++;
  }

  // Only advertise canonical, indexable routes actually emitted by this build.
  const canonicalPaths = ['/', ...STATIC_ROUTES.filter(route => !route.noIndex &&
    (!route.canonicalPath || route.canonicalPath === route.path) &&
    route.path !== '/blog' && !route.path.startsWith('/blogs/')).map(route => route.path)];
  const sitemap = (paths: string[]) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(paths)].map(url => `  <url><loc>https://crunchybag.com${escapeHtml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap(canonicalPaths));
  for (const [name, prefix] of [['menu', '/product/'], ['delivery', '/delivery'], ['combos', '/combos']]) {
    fs.writeFileSync(path.join(distDir, `sitemap-${name}.xml`), sitemap(canonicalPaths.filter(url => url.startsWith(prefix))));
  }

  console.log(`[Static Pre-render] Generated ${generatedCount} pages and matching sitemaps.`);
}

generateStaticRoutes().catch(error => { console.error(error); process.exitCode = 1; });
