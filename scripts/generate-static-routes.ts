import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BLOG_ARTICLES, BlogArticle } from '../src/data/blogData';
import { productPages, escapeHtml } from './product-pages';
import { categoryPages } from './category-pages';
import { informationPages } from './information-pages';
import { LEGACY_FOOD_PATHS } from '../src/data/seo/categories';
import { BLOG_MENU_LINKS } from '../src/data/seo/blogLinks';
import { restaurantSchema } from '../src/data/seo/site';

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

const STATIC_ROUTES: RouteSEO[] = [
  // Core Storefront Pages
  {
    path: '/menu',
    title: 'Full Online Food Menu | Crunchy Bag Kathmandu',
    h1: 'Explore Our Full Online Menu & Food Specialties',
    description: 'Browse burgers, fried chicken, chicken 65 pakoda, fries, sandwiches, momo and drinks. Delivery and takeaway run 24/7 across Kathmandu Valley. No minimum order.',
  },
  {
    path: '/combos',
    title: 'Special Value Combos & Deals | Crunchy Bag Kathmandu',
    h1: 'Best Value Combos, Family Bags & Feast Packages',
    description: 'Compare current chicken combos, duo combos and family bags from Crunchy Bag. View included dishes and prices for 24/7 delivery and takeaway.',
  },
  {
    path: '/reserve',
    title: 'Book a Table Online | Crunchy Bag Restaurant Lalitpur',
    h1: 'Table Reservations & Dine-in Hospitality in Imadol',
    description: 'Plan a dine-in visit to Crunchy Bag at Dhungesadhu Chowk, Imadol, Lalitpur. Dine-in hours are 5 AM to 11 PM daily.',
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
          <p><strong>Crunchy Bag Restaurant:</strong> Imadol, Lalitpur 44700, Nepal (<a href="https://maps.app.goo.gl/f7iDReKabgGHSvrv7" target="_blank" rel="noopener noreferrer" class="text-amber-500 hover:underline">Google Maps</a>)</p>
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
          <p><strong>Data Controller:</strong> Crunchy Bag Restaurant, Imadol, Lalitpur 44700, Nepal (<a href="https://maps.app.goo.gl/f7iDReKabgGHSvrv7" target="_blank" rel="noopener noreferrer" class="text-amber-500 hover:underline">Google Maps</a>)</p>
          <p><strong>Hotline:</strong> <a href="tel:9761503339" class="font-mono text-zinc-300">9761503339</a> | <strong>Email:</strong> hello@crunchybag.com</p>
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
        <p class="text-xs sm:text-sm text-zinc-400">Compare burgers, fried chicken and pakoda, or plan a late-night delivery from our Imadol restaurant.</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${articleCards}
      </div>

      <!-- Consistent NAP Footer -->
      <footer class="pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-2">
        <p><strong>Central Kitchen &amp; Outlet:</strong> Imadol, Lalitpur 44700, Nepal (<a href="https://maps.app.goo.gl/f7iDReKabgGHSvrv7" target="_blank" rel="noopener noreferrer" class="text-amber-500 hover:underline">Google Maps</a>)</p>
        <p><strong>Direct Hotline:</strong> <a href="tel:9761503339" class="font-mono text-zinc-300 hover:underline">9761503339</a> | <strong>Hours:</strong> Delivery & takeaway 24/7; dine-in 5 AM to 11 PM daily</p>
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
          <p class="text-xs font-mono text-amber-400 font-bold">See the menu for current prices and options.</p>
        </div>
      </div>
      <p><a href="${BLOG_MENU_LINKS[article.slug]?.path || '/menu'}" class="text-xs font-bold text-amber-500 hover:underline">${BLOG_MENU_LINKS[article.slug]?.label || 'Browse the current menu'} &rarr;</a></p>
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
        <nav aria-label="Order food from this guide"><a href="${BLOG_MENU_LINKS[article.slug]?.path || '/menu'}">${BLOG_MENU_LINKS[article.slug]?.label || 'Browse the current menu'}</a> · <a href="/takeaway">24/7 takeaway</a> · <a href="/delivery">Delivery information</a></nav>

        <div class="pt-4 border-t border-zinc-800">
          <div class="text-xs text-zinc-500 mb-2 font-bold uppercase">Topics:</div>
          <div>${tagsHtml}</div>
        </div>
      </article>

      <footer class="pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-2">
        <p><strong>Central Kitchen &amp; Outlet:</strong> Imadol, Lalitpur 44700, Nepal (<a href="https://maps.app.goo.gl/f7iDReKabgGHSvrv7" target="_blank" rel="noopener noreferrer" class="text-amber-500 hover:underline">Google Maps</a>)</p>
        <p><strong>Direct Hotline:</strong> <a href="tel:9761503339" class="font-mono text-zinc-300 hover:underline">9761503339</a> | <strong>Hours:</strong> Delivery & takeaway 24/7; dine-in 5 AM to 11 PM daily</p>
        <p><a href="/blogs" class="text-amber-500 hover:underline">&larr; Return to Culinary Blogs Directory</a></p>
      </footer>
    </main>
  `;
}

STATIC_ROUTES.push({
  path: '/blogs',
  title: 'Culinary Journal & Food Guides in Kathmandu | Crunchy Bag Blogs',
  h1: 'Food Guides & 24-Hour Ordering in Kathmandu Valley',
  description: 'Read practical guides to burgers, fried chicken, pakoda and 24-hour food ordering in Kathmandu, Lalitpur and Bhaktapur.',
  image: BLOG_ARTICLES[0]?.image,
  contentHtml: renderBlogListingHtml(),
});

STATIC_ROUTES.push({
  path: '/blog',
  title: 'Culinary Journal & Food Guides in Kathmandu | Crunchy Bag Blogs',
  h1: 'Food Guides & 24-Hour Ordering in Kathmandu Valley',
  description: 'Read practical guides to burgers, fried chicken, pakoda and 24-hour food ordering in Kathmandu, Lalitpur and Bhaktapur.',
  image: BLOG_ARTICLES[0]?.image,
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
      '@type': article.authorType || 'Person',
      name: article.author,
      ...(article.authorType === 'Organization' ? { url: 'https://crunchybag.com/about' } : { jobTitle: article.authorRole }),
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
  const categories = categoryPages(catalog.categories);
  STATIC_ROUTES.push(...catalog.routes, ...categories.routes);
  for (const [alias, canonicalPath] of Object.entries(LEGACY_FOOD_PATHS)) {
    const target = categories.routes.find(route => route.path === canonicalPath);
    if (target) STATIC_ROUTES.push({ ...target, path: alias, canonicalPath });
  }
  STATIC_ROUTES.push(...informationPages(categories.links));
  const baseHtml = fs.readFileSync(distIndexPath, 'utf-8').replace(/<script id="restaurant-schema" type="application\/ld\+json">[\s\S]*?<\/script>/, `<script id="restaurant-schema" type="application/ld+json">${JSON.stringify(restaurantSchema(catalog.categories)).replace(/</g, '\\u003c')}</script>`);
  fs.writeFileSync(distIndexPath, baseHtml);
  fs.writeFileSync(path.join(distDir, '404.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, follow"><title>Page not found | Crunchy Bag</title></head><body><main><h1>Page not found</h1><p>This page is unavailable. Find your food in the current menu or contact our Imadol restaurant.</p><nav><a href="/">Crunchy Bag</a> · <a href="/menu">Food menu</a> · <a href="/delivery">Delivery information</a> · <a href="/contact">Contact</a></nav></main></body></html>`);
  console.log(`[Static Pre-render] Generating ${STATIC_ROUTES.length} routes...`);

  let generatedCount = 0;

  for (const route of STATIC_ROUTES) {
    const canonicalPath = route.canonicalPath || route.path.replace(/^\/blogs\//, '/blog/').replace(/^\/blog$/, '/blogs');
    route.noIndex = route.noIndex || ['/orders', '/profile', '/table-qr', '/tv'].includes(route.path);
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

    // Breadcrumbs describe this page's ancestry, never unrelated sibling pages.
    const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Crunchy Bag', item: 'https://crunchybag.com/' },
      ...(/^\/(product|menu)\//.test(canonicalPath) ? [{ '@type': 'ListItem', position: 2, name: 'Menu', item: 'https://crunchybag.com/menu' }] : []),
      ...(canonicalPath.startsWith('/delivery/') ? [{ '@type': 'ListItem', position: 2, name: 'Delivery', item: 'https://crunchybag.com/delivery' }] : []),
      ...(canonicalPath.startsWith('/blog/') ? [{ '@type': 'ListItem', position: 2, name: 'Blogs', item: 'https://crunchybag.com/blogs' }] : [])];
    crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: route.h1, item: `https://crunchybag.com${canonicalPath}` });
    pageHtml = pageHtml.replace('</head>', `<script id="route-breadcrumbs" type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs }).replace(/</g, '\\u003c')}</script></head>`);

    // 7. Inject route JSON-LD Schema into <head>
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
      // Give each route its own heading and description.
      pageHtml = pageHtml.replace(
        /<main id="app-landing-summary"[\s\S]*?<\/main>/i,
        `<main id="app-landing-summary" class="max-w-4xl mx-auto px-4 py-8 space-y-6 text-zinc-300"><h1>${escapeHtml(route.h1)}</h1><p>${escapeHtml(route.description)}</p><nav><a href="/">Home</a> / <a href="/menu">Food Menu</a> / <a href="/combos">Combos</a> / <a href="/contact">Contact &amp; Directions</a></nav></main>`
      );
    }

    if (route.path === '/menu') {
      pageHtml = pageHtml.replace('</main>', `<nav aria-label="Food categories"><ul>${categories.links}</ul></nav><nav aria-label="Dishes"><ul>${catalog.links}</ul></nav></main>`);
    }
    if (route.noIndex) {
      pageHtml = pageHtml.replace(/(<meta name="(?:robots|googlebot)" content=")[^"]*/g, '$1noindex, follow');
    }
    // Keep informational page content visible after React mounts, too.
    const payload = JSON.stringify({ path: route.path, title: route.title, description: route.description,
      canonical: `https://crunchybag.com${canonicalPath}`, contentHtml: route.contentHtml, noIndex: route.noIndex,
      schema: route.schemaJson ? JSON.parse(route.schemaJson) : undefined }).replace(/</g, '\\u003c');
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
  const sitemap = (paths: string[]) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${[...new Set(paths)].map(url => `  <url><loc>https://crunchybag.com${escapeHtml(url)}</loc>${STATIC_ROUTES.find(route => route.path === url)?.image ? `<image:image><image:loc>${escapeHtml(STATIC_ROUTES.find(route => route.path === url)!.image)}</image:loc></image:image>` : ''}</url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap(canonicalPaths));
  fs.writeFileSync(path.join(distDir, 'sitemap-categories.xml'), sitemap(categories.routes.map(route => route.path)));
  fs.writeFileSync(path.join(distDir, 'sitemap-blog.xml'), sitemap(canonicalPaths.filter(url => url === '/blogs' || url.startsWith('/blog/'))));
  for (const [name, prefix] of [['menu', '/product/'], ['delivery', '/delivery'], ['combos', '/combos']]) {
    fs.writeFileSync(path.join(distDir, `sitemap-${name}.xml`), sitemap(canonicalPaths.filter(url => url.startsWith(prefix))));
  }

  console.log(`[Static Pre-render] Generated ${generatedCount} pages and matching sitemaps.`);
}

generateStaticRoutes().catch(error => { console.error(error); process.exitCode = 1; });
