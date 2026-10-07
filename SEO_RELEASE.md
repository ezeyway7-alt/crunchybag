# Search appearance release

Deploy the complete `npm run build` output, including prerendered route directories, PNG/ICO icons and generated sitemaps. Serve each route directory index before the SPA fallback.

After deployment:
- Confirm `/favicon-96.png` returns a PNG (96 x 96), not HTML; confirm `/favicon.ico` and `/apple-touch-icon.png` work.
- Inspect `/`, `/menu`, `/combos`, `/contact` and a `/product/` URL in Google Search Console. Request indexing of the homepage and key pages.
- Submit `https://crunchybag.com/sitemap.xml`. Product sitemaps now include real catalog image URLs.
- Use Google Rich Results Test on a simple product page. Configurable products deliberately omit an exact Offer when choices affect the total; no ratings or reviews are invented.
- Rebuild when catalog prices, images or availability change; prerendered information is a build-time snapshot.

Google selects favicons, images, snippets and sitelinks. Publishing valid markup does not guarantee their display or a deadline. Sitelinks depend on the site's navigation and Google's assessment; they cannot be manually enabled.

References:
- https://developers.google.com/search/docs/appearance/favicon-in-search
- https://developers.google.com/search/docs/appearance/sitelinks
- https://developers.google.com/search/docs/appearance/structured-data/product-snippet
