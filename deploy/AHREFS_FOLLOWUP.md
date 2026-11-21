# Ahrefs follow-up — 31 October 2026

These changes address the seven CSV exports from the 5:50 PM crawl. They are prepared locally; this task has not deployed files, changed the VPS, purged Cloudflare or submitted URLs to search engines.

## Code fixes prepared

| Export | Reported | Change |
| --- | ---: | --- |
| Orphan pages | 3 | Crawlable links to `/privacy`, `/terms` and `/faq` in generated public pages and the visible storefront footer. |
| Only one incoming dofollow link | 8 | Shared links to About and Reservations; related-guide links across all six blog articles. Related guides rotate so later articles also receive links. |
| Description too long | 44 | Shared product description template shortened, preserving current base prices, options and the fact that extras affect the total. Reported pages now have descriptions of 124–142 characters in this build. |
| Description too short | 5 | Expanded individual blog descriptions to explain the actual article and local service. |
| Title too long | 3 | Shortened the pakoda, dietary-request and 24-hour-delivery search titles while preserving their URLs and article headings. |
| Low word count | 2 | Useful combo-selection and dine-in planning guidance for `/combos` and `/reserve`, visible before and after React loads. No fabricated booking confirmation, ingredients or delivery guarantees. |
| Changed pages not submitted to IndexNow | 135 | Optional preparation and submission commands added. Nothing submitted. The fresh sitemap has 136 canonical URLs, including the homepage. |

The optional IndexNow command submits the current canonical sitemap in one batch. It is intended for this broad release; do not run it repeatedly when nothing has changed. Receipt of a submission does not guarantee crawling or indexing. Documentation: https://www.indexnow.org/documentation

## What the owner needs to do on the VPS

Transfer the changed source through your normal release workflow, including `public/indexnow-key.txt` if using the locally prepared key. No dependency installation or backend migration is needed for these SEO changes. Back up the current release before replacing it.

On the existing frontend checkout:

```sh
cd /opt/crunchybag
npm run lint
npm run build
npm run indexnow:prepare
```

Use the current public catalog for production builds. Do not set `SEO_CATALOG_FILE` to an old snapshot. If your host serves another release directory, publish the complete resulting `dist` directory there through your existing release process. The key file must be published along with the pages and assets. Keep `public/indexnow-key.txt` for subsequent builds rather than generating a new key each release. These commands do not submit URLs.

## Server status and checks

Read-only live checks in this task confirmed:

- `/menu/pakoda`: direct HTTP 200, slashless self-canonical.
- `/delivery/kathmandu`: direct HTTP 200, slashless self-canonical.
- `/privacy`: direct HTTP 200, correct canonical.
- `/seo-nonexistent-check`: HTTP 404.
- `/indexnow-key.txt`: HTTP 404 before this deployment, as expected for the new key.

The old slash-redirect problem is therefore fixed on these sampled routes. No additional Nginx edit or service restart is indicated for this release. Do not replace the live configuration merely because the older CSV showed redirects. If the new key file is 404 after publishing `dist`, first check the active document root and whether `dist/indexnow-key.txt` exists there; retain the existing API, WebSocket and private-route configuration.

After deployment:

```sh
curl -I https://crunchybag.com/menu/pakoda
curl -I https://crunchybag.com/reserve
curl -I https://crunchybag.com/seo-nonexistent-check
curl -f https://crunchybag.com/indexnow-key.txt
```

Expected: 200, 200, 404 and a text key matching `public/indexnow-key.txt`. Check the footer links, the reservation guidance, a product description and a blog title in the browser and raw HTML. If old HTML remains cached at Cloudflare, purge the affected pages, then verify again. No Cloudflare account changes were made here.

## Optional IndexNow submission, after deployment

```sh
cd /opt/crunchybag
npm run indexnow:submit
```

The script first fetches the live verification file and refuses to submit if the key does not match. It validates the sitemap host and submits only sitemap URLs. HTTP 200 means received; HTTP 202 means received with verification pending. A 403 or key mismatch requires checking deployment, not blindly repeating the command. Do not publish private/order-tracking URLs to clear an audit notice.

## Search Console and Ahrefs account work

1. In Search Console, verify `https://crunchybag.com/sitemap.xml` is successfully read. Resubmit if needed; there is no canonical URL migration in this release.
2. Inspect representative URLs: `/menu/pakoda`, a real product, a blog, `/reserve`, `/faq`, `/terms` and `/privacy`. Check fetched HTML, indexing eligibility and Google's selected canonical. Request indexing of a few important updated pages where useful.
3. In Ahrefs, start a fresh crawl after deployment/cache clearing. Use the newly crawled URLs rather than the earlier 5:00 PM redirect export. Confirm the orphan, incoming-link, title, description and content reports reflect the new HTML.
4. IndexNow notices may depend on Ahrefs submission tracking. Keep the submission response and check participating search-engine tools; do not change working URLs just to remove a notice.
5. Monitor Search Console impressions, clicks, indexing and Core Web Vitals. Ahrefs score improvement is not a ranking or traffic guarantee. The production build still warns about a large main JavaScript bundle; mobile performance measurement and further code splitting are a separate next task.

Account actions above require your Search Console, Ahrefs or Cloudflare access and have not been performed by this task.

## Local validation

The live-catalog build emitted 201 route files and a sitemap containing 136 canonical URLs. `artifacts/ahrefs-fixes-validation.json` records affected URLs and new metadata lengths. The SEO regression suite checks incoming links from distinct pages, the affected metadata templates, useful content on the sparse pages, and visibility after React mounts.

```sh
npm run lint
npm run test:seo
```

If using installed Chrome rather than Playwright's browser download, set `PLAYWRIGHT_BROWSER_CHANNEL=chrome` when invoking tests (PowerShell: `$env:PLAYWRIGHT_BROWSER_CHANNEL='chrome'`).

Final local verification: TypeScript passed, production build passed, and all 17 SEO tests passed using installed Chrome. IndexNow script syntax checked; live submission has not been performed.
