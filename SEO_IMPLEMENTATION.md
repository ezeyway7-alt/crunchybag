# SEO implementation — 31 October 2026

## Implemented locally

- Public catalog generates individual products, seven current categories and three food collections (Pakoda, Sandwiches and Momo). Empty, archived and staff-only collections are excluded. Legacy food URLs point to the appropriate canonical collection. Existing product URLs remain available.
- Shared category routing drives real navigation links, selected products, page headings and metadata. Browser Back and direct category loads are covered by browser tests.
- CollectionPage / ItemList schema, canonical URLs, category and blog sitemaps, contextual breadcrumbs, category-to-product and related-product links.
- Takeaway and delivery pages use owner-confirmed 24/7 service, 5 AM–11 PM dine-in, no minimum order and usual 7–15 minute preparation. Travel time is explicitly additional. Delivery fees use the applicable Yango / Pathao route rate, confirmed before ordering.
- Shared outlet identity includes Dhungesadhu Chowk, Imadol; both telephone/WhatsApp numbers; official social profiles; and coordinates resolved from the owner's Maps link. Restaurant schema separates dine-in hours from delivery/takeaway service hours.
- Six articles were rewritten around the actual menu and confirmed business facts, retaining existing URLs. Removed invented chefs, sourcing partnerships, recipes, ratings and delivery guarantees. Authorship identifies Crunchy Bag as an organization. Articles link to current collections instead of advertising stale prices.
- Operational screens load in separate JavaScript chunks. This is a download optimization, not a measured Core Web Vitals result.
- Generated 404.html plus a proposed Nginx fragment in deploy/nginx-seo.conf. This fragment has NOT been applied or tested with production Nginx.

## Owner-confirmed facts and remaining external work

1. Brand: Crunchy Bag / CrunchyBag. One outlet at Dhungesadhu Chowk, Imadol, Lalitpur. Calls and WhatsApp: 9761503339 and 9768382318.
2. Delivery/takeaway 24/7; dine-in 5 AM–11 PM. City coverage: Kathmandu, Lalitpur and Bhaktapur. No minimum order. Typical preparation 7–15 minutes; travel time varies.
3. The owner confirms live menu prices and a 10% first website order offer. Existing checkout already calculates discounts through backend loyalty rules. No pricing engine or live loyalty configuration was changed; check the eligible first-order quote in production before release.
4. Priority products: burgers, fried chicken, chicken 65 pakoda, fries and sandwiches. No kitchen photos supplied; guides use existing catalog images and make no kitchen-photo claims.
5. The owner has a verified Google Business Profile and Search Console. Access, submission and production hosting changes have not been performed. Request only the needed access or reports; do not share passwords or private keys in chat.
6. Google currently shows a midnight closing time according to the owner's pasted listing. Update the profile to communicate the confirmed service-specific hours consistently with the site. Update service areas and official website/menu links.

## Build and verification

Run `npm run lint` and `npm run test:seo` (Windows PowerShell: `npm.cmd`). The build reads the live public web catalog. An offline verification build may set `SEO_CATALOG_FILE` to a freshly saved public catalog JSON response. A local snapshot is ignored by Git; do not deploy a stale snapshot as the catalog source.

The sitemap root contains all canonical, indexable generated URLs. Category and blog sitemap files are additional subsets. No fabricated lastmod dates or ratings are emitted.

## Production release

1. Build against the current public catalog and deploy the complete dist directory, including route subdirectories, icons, 404.html and all sitemaps.
2. Review deploy/nginx-seo.conf against the active server configuration. Replace the broad SPA location with the supplied public-page and known-app-route handling; retain API, WebSocket, backend admin, uploads, assets and TLS blocks. Run `nginx -t` before reloading. Check `/admin/login` against the existing backend routing before changing that route.
3. Verify HTTP 200 and correct raw HTML/canonical for homepage, menu, each category, a product, a blog, takeaway and each main city. Verify HTTP 404 for nonexistent pages and products. Verify login, order tracking, QR, staff tools and checkout still work. Vite preview does not validate production Nginx behavior.
4. Submit /sitemap.xml in Search Console; inspect representative URLs and their Google-selected canonical. Check Pages, Manual Actions and Security Issues.
5. Update the actual Google Business Profile with confirmed address, hours, menu, website and original photos. Ask real customers for honest reviews without incentives.
6. Monitor relevant food/location queries, impressions, clicks and completed orders. Expand neighbourhood content only when real service details make it useful. Avoid mass-producing food × city × synonym pages.

## Official references

- https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/appearance/structured-data/local-business
- https://developers.google.com/search/docs/essentials/spam-policies

Ranking positions, indexing dates and rich-result appearance cannot be guaranteed. Publishing and Search Console / Business Profile changes have not been performed by these local edits.
