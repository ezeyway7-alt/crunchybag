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
}

const DEFAULT_METADATA: SEOMetadata = {
  title: 'Crunchy - Crispy Fried Chicken & Burgers in Kathmandu',
  description:
    'Order fresh, crispy fried chicken, smash burgers, and delicious sides online with fast delivery across Kathmandu. Instant eSewa payment supported.',
  canonical: 'https://crunchy.com.np/',
  image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&h=630&q=80',
  noIndex: false,
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
}
