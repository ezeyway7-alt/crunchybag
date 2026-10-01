/**
 * Crunchy SEO Utilities
 * Lightweight helper to dynamically update meta tags, document title, and schema
 * in Single Page Application (SPA) view transitions.
 */

export interface SEOMetadata {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  section?: string;
  tags?: string[];
  schema?: Record<string, unknown>;
}

const DEFAULT_METADATA: SEOMetadata = {
  title: 'Crunchy Bag - Best Crispy Fried Chicken, Burgers & Food Delivery in Kathmandu',
  description:
    "Order Kathmandu's best crispy fried chicken, gourmet smash burgers, crunchy pakodas, and combos online from Crunchy Bag. Express food delivery across Kathmandu, Lalitpur & Bhaktapur with instant eSewa & cash payment.",
  canonical: 'https://crunchybag.com/',
  image: 'https://crunchybag.com/crunchy_logo.png',
  noIndex: false,
  type: 'website',
};

export function updatePageSEO(meta: SEOMetadata) {
  const merged = { ...DEFAULT_METADATA, ...meta };

  // 1. Update Document Title
  if (merged.title) {
    document.title = merged.title;
  }

  // 2. Helper to set or create meta tag
  const setMetaTag = (selector: string, attr: string, value: string) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      const [key, val] = selector.replace(/[\[\]']/g, '').split('=');
      el.setAttribute(key, val);
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  };

  // 3. Update description
  if (merged.description) {
    setMetaTag("meta[name='description']", 'content', merged.description);
    setMetaTag("meta[property='og:description']", 'content', merged.description);
    setMetaTag("meta[name='twitter:description']", 'content', merged.description);
  }

  // 4. Update OpenGraph / Twitter titles
  if (merged.title) {
    setMetaTag("meta[property='og:title']", 'content', merged.title);
    setMetaTag("meta[name='twitter:title']", 'content', merged.title);
  }

  // 5. Update Canonical link
  if (merged.canonical) {
    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', merged.canonical);
    setMetaTag("meta[property='og:url']", 'content', merged.canonical);
  }

  // 6. Update Robots (for internal or staff routes that should never be indexed)
  if (merged.noIndex) {
    setMetaTag("meta[name='robots']", 'content', 'noindex, nofollow');
  } else {
    setMetaTag("meta[name='robots']", 'content', 'index, follow, max-image-preview:large');
  }

  // 7. Update OG Image
  if (merged.image) {
    setMetaTag("meta[property='og:image']", 'content', merged.image);
    setMetaTag("meta[name='twitter:image']", 'content', merged.image);
  }

  // 8. Update OG Type & Article Attributes
  setMetaTag("meta[property='og:type']", 'content', merged.type || 'website');
  if (merged.type === 'article') {
    if (merged.author) setMetaTag("meta[property='article:author']", 'content', merged.author);
    if (merged.publishedTime) setMetaTag("meta[property='article:published_time']", 'content', merged.publishedTime);
    if (merged.section) setMetaTag("meta[property='article:section']", 'content', merged.section);
  }

  // 9. Update Dynamic JSON-LD Schema (e.g. BlogPosting)
  const existingSchema = document.getElementById('dynamic-route-schema');
  if (merged.schema) {
    let scriptEl = existingSchema as HTMLScriptElement;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'dynamic-route-schema';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(merged.schema, null, 2);
  } else if (existingSchema) {
    existingSchema.remove();
  }
}
