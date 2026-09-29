import { BlogArticle } from "../data/blogs";

export interface PageSeoConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogType?: "website" | "article" | "restaurant";
  ogImage?: string;
  ogImageAlt?: string;
  publishedTime?: string;
  authorName?: string;
  article?: BlogArticle;
}

const DEFAULT_SEO: PageSeoConfig = {
  title: "Crunchy Bag | Best Fried Chicken, Smash Burgers & Momos in Kathmandu",
  description:
    "Order Kathmandu's crispiest double-dredged fried chicken, smash burgers, and crunchy momos. Fast food delivery across Kathmandu & Lalitpur. Pay with eSewa.",
  keywords: [
    "crunchy bag",
    "fried chicken kathmandu",
    "smash burger kathmandu",
    "crunchy momo",
    "food in kathmandu",
    "best burger kathmandu",
    "food delivery kathmandu",
    "durbar marg restaurant"
  ],
  canonicalUrl: "https://crunchybag.com/",
  ogType: "website",
  ogImage: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&h=630&q=80",
  ogImageAlt: "Crunchy Bag Fried Chicken & Smash Burgers Kathmandu"
};

/**
 * Updates document meta tags, canonical link, and JSON-LD schemas dynamically for client-side navigation.
 */
export function applyPageSeo(config: Partial<PageSeoConfig> = {}): () => void {
  if (typeof document === "undefined") return () => {};

  const title = config.title ? `${config.title} | Crunchy Bag` : DEFAULT_SEO.title;
  const description = config.description || DEFAULT_SEO.description;
  const canonicalUrl = config.canonicalUrl || DEFAULT_SEO.canonicalUrl!;
  const ogType = config.ogType || (config.article ? "article" : "website");
  const ogImage = config.ogImage || (config.article ? config.article.featuredImage : DEFAULT_SEO.ogImage!);
  const ogImageAlt = config.ogImageAlt || (config.article ? config.article.title : DEFAULT_SEO.ogImageAlt!);
  const keywords = config.keywords && config.keywords.length > 0 ? config.keywords.join(", ") : DEFAULT_SEO.keywords!.join(", ");

  // 1. Update Title
  document.title = title;

  // 2. Helper to set or create meta tags
  const setMeta = (name: string, content: string, isProperty = false) => {
    const attr = isProperty ? "property" : "name";
    let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute(attr, name);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  };

  // 3. Set standard and crawler meta tags
  setMeta("description", description);
  setMeta("keywords", keywords);
  setMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  setMeta("googlebot", "index, follow");

  // 4. OpenGraph tags
  setMeta("og:title", title, true);
  setMeta("og:description", description, true);
  setMeta("og:url", canonicalUrl, true);
  setMeta("og:type", ogType, true);
  setMeta("og:image", ogImage, true);
  setMeta("og:image:alt", ogImageAlt, true);
  setMeta("og:site_name", "Crunchy Bag Kathmandu", true);

  if (config.publishedTime) {
    setMeta("article:published_time", config.publishedTime, true);
  }
  if (config.authorName) {
    setMeta("article:author", config.authorName, true);
  }

  // 5. Twitter Card tags
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", title);
  setMeta("twitter:description", description);
  setMeta("twitter:image", ogImage);

  // 6. Update Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalLink) {
    canonicalLink = document.createElement("link");
    canonicalLink.setAttribute("rel", "canonical");
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute("href", canonicalUrl);

  // 7. Dynamic JSON-LD Structured Data
  const jsonLdId = "dynamic-page-jsonld";
  let jsonLdScript = document.getElementById(jsonLdId) as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement("script");
    jsonLdScript.id = jsonLdId;
    jsonLdScript.type = "application/ld+json";
    document.head.appendChild(jsonLdScript);
  }

  const schemas: any[] = [];

  // Breadcrumbs schema for all pages
  if (config.article) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://crunchybag.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://crunchybag.com/blog"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": config.article.title,
          "item": canonicalUrl
        }
      ]
    });

    // BlogPosting schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "headline": config.article.title,
      "description": config.article.metaDescription,
      "image": [config.article.featuredImage],
      "datePublished": config.article.isoDate,
      "dateModified": config.article.isoDate,
      "author": {
        "@type": "Person",
        "name": config.article.author.name,
        "jobTitle": config.article.author.role
      },
      "publisher": {
        "@type": "Organization",
        "name": "Crunchy Bag",
        "logo": {
          "@type": "ImageObject",
          "url": "https://crunchybag.com/favicon.svg"
        }
      },
      "keywords": config.article.keywords.join(", ")
    });

    // FAQ schema if article has FAQs
    if (config.article.faqs && config.article.faqs.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": config.article.faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      });
    }
  } else {
    // Default WebSite & Organization schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FastFoodRestaurant",
      "@id": "https://crunchybag.com/#restaurant",
      "name": "Crunchy Bag",
      "image": ["https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1200&q=80"],
      "telephone": "+977 1-4229988",
      "url": "https://crunchybag.com/",
      "priceRange": "NPR 150 - NPR 1800",
      "servesCuisine": ["Fried Chicken", "Smash Burgers", "Crunchy Momos", "Fast Food"],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Kings Way, Durbar Marg",
        "addressLocality": "Kathmandu",
        "addressRegion": "Bagmati Province",
        "postalCode": "44600",
        "addressCountry": "NP"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 27.7125,
        "longitude": 85.3175
      },
      "paymentAccepted": "eSewa, Cash",
      "currenciesAccepted": "NPR"
    });
  }

  jsonLdScript.textContent = JSON.stringify(schemas);

  // Send virtual pageview to Google Analytics (GA4) or GTM if loaded
  if (typeof window !== "undefined") {
    const w = window as any;
    if (typeof w.gtag === "function") {
      w.gtag("event", "page_view", {
        page_title: title,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }
  }

  // Cleanup function restores defaults if component unmounts
  return () => {
    // Optionally restore title or leave as-is until next route
  };
}
