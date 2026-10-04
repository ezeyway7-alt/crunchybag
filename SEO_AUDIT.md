# Crunchy Bag SEO audit — 3 October 2026

Scope: frontend source and unauthenticated HTTP checks of https://crunchybag.com.
The owner confirmed that **Imadol, Lalitpur is the only physical outlet**.
This audit does not have Google Search Console access and cannot establish why Google ranked a particular query at a particular position.

## Confirmed findings and local changes

| Finding | Evidence before changes | Local fix |
| --- | --- | --- |
| Product URLs returned homepage HTML | `/product/prod-cold-coffee-469955c644d4` returned HTTP 200, the homepage title and H1, and canonical `https://crunchybag.com/` | Build actual product HTML from the public web catalog, with individual titles, descriptions and canonical URLs |
| Product discovery depended on clicks | Product cards used a `div` click handler | Product names are real links; descriptive URLs retain stable catalog identifiers; legacy ID URLs still work |
| Product navigation did not behave like page navigation | Opening replaced the current history entry; deep-link handling only reran when products changed | Opening adds a history entry; Back and Forward synchronize the selected product; closing restores the menu canonical |
| Blog routes already existed | `/blog/secret-to-kathmandus-crispiest-chicken` returned its own title, H1 and canonical | Preserve those URLs; make blog modal cards link to article pages; canonicalize `/blogs/:slug` aliases to `/blog/:slug` |
| Missing metadata could be created with the wrong attributes | Metadata helper parsed `meta[property=...]` into an invalid attribute name | Correct creation of `name`/`property` metadata; reuse one route schema script and clear article metadata when leaving an article |
| Sitemaps advertised unbuilt pages and account routes | Hand-maintained sitemap was copied into `dist` regardless of generated routes | Generate all four sitemap files from built, canonical, indexable routes; exclude profile/order and operational pages |
| Delivery pages claimed a nonexistent branch | Thamel and Durbar Marg content described a Kings Way flagship; hardcoded times, distances and delivery fees were unverified | Remove these claims; clearly identify the single Imadol outlet; ask visitors to confirm coverage and charges |
| Informational HTML disappeared when React mounted | Build output placed informational text inside the React root but the runtime showed the generic storefront | Preserve generated informational content in the visible React page |
| Googlebot-specific robots rules bypassed generic exclusions | Separate `Googlebot: Allow /` and `Bingbot: Allow /` groups | Use the shared crawler rules instead |

The homepage title and primary heading now identify **Crunchy Bag, Imadol, Lalitpur**.
HTTP and HTTPS `www` variants already redirect to `https://crunchybag.com/`; no redirect change was necessary.

## Build and release

1. Run `npm run lint` and `npm run test:seo`.
2. Deploy the **entire `dist` directory**, including generated subdirectories and sitemap files. Deploying only `index.html` and `assets` loses product/blog HTML.
3. The build reads the public web menu from `https://crunchybag.com/api/v1/catalog/menu/?outlet_id=1&channel=web`. Override `SEO_CATALOG_URL` for a different deployment/outlet. For an offline build, set `SEO_CATALOG_FILE` to a saved public menu JSON response. An unavailable or empty catalog fails the build instead of silently publishing missing product pages.
4. Rebuild when public catalog items or descriptions change. Checkout continues to use live prices; generated product prose deliberately does not hardcode a price or stock promise.
5. Inspect the raw response and rendered page for the homepage, `/menu`, a product, a blog and `/delivery/imadol`. Product canonicals must identify the product, not the homepage. Old product ID routes should identify the new canonical product URL.
6. The local Vite preview needs a trailing slash to serve generated directory HTML directly, such as `/delivery/imadol/`. Production must resolve both directory routes and links correctly. The repository's Nginx `try_files $uri $uri/ ...` supports directory pages; verify the deployed configuration rather than assuming a source file is active.

These changes are local. No server deployment or Google submission was performed.

Validation: production build, TypeScript check and all four production SEO tests passed. After isolating a stalled Google Fonts request in the test fixture, the broader customer suite passed four tests, then stopped at two failures: the `/profile` heading and a returning-customer login button expectation. Seven tests were not run in that attempt. The full customer suite is not being reported as passing; these profile/login failures remain to be investigated.

## Remaining hosting and content work

- **Real 404 responses:** `/not-a-real-page-seo-check` currently returns HTTP 200 and the homepage. Replace the blanket SPA fallback with explicit supported application-route fallbacks and return 404 for unknown public pages. Preserve operational routes, receipt tracking and backend `/api` routes. Test the actual Nginx configuration before reloading it. Do not simply remove the fallback: that would break app-only routes.
- **Thin delivery pages:** correcting false claims does not make each neighborhood page a strong search landing page. Confirm actual service coverage, fees and delivery arrangements, then add genuinely useful area-specific information. Consolidate areas that cannot support distinct useful content. Do not invent extra branches or guaranteed delivery times for keywords.
- **Editorial accuracy:** confirm blog authors, sourcing stories, payment capabilities, opening hours and other business claims. Existing schema/menu data in `index.html` includes manually maintained information; reconcile that data against the real business and current menu.
- **Legacy category links:** the homepage contains `/menu/...` category URLs that are not all generated as separate category pages. Map these to supported categories or build matching category pages before tightening the 404 policy.
- **Performance:** the production JavaScript bundle is about 1.96 MB before compression because operational portals are bundled into the storefront. Route-level lazy loading and measured mobile performance work remain worthwhile. No Core Web Vitals failure is asserted without field data.

## Search Console checks after deployment

1. Inspect the homepage and representative product/blog URLs. Check indexing status, last crawl, rendered HTML, and **Google-selected canonical versus user-declared canonical**.
2. Submit `https://crunchybag.com/sitemap.xml`. The generated file now describes built pages. Request indexing for the homepage and a small set of important changed pages.
3. Review Pages reports for duplicate canonical selection, soft 404s, crawled-but-not-indexed pages and blocked resources. Check Manual Actions and Security Issues rather than assuming a penalty.
4. Review Performance queries for `crunchy bag`, `crunchybag`, `crunchy bag imadol`, and relevant food/location queries. Track impressions and clicks over time; one personal search is not a complete rank report.
5. Keep the Google Business Profile name, Imadol address, phone, opening hours, menu and website consistent. Ask real customers for honest reviews without incentives. Link the actual website from official social profiles.

Three or four days is too early to infer a final ranking outcome. Indexing eligibility, indexing and ranking are separate. Nobody can promise first place for every search containing the generic word “crunchy.” Prioritize exact brand searches and relevant local food searches.

## Official references

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [How Google chooses robots.txt groups](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec)
- [Google Business Profile local ranking](https://support.google.com/business/answer/7091)
