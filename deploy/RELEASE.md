# Deploy this SEO update on the existing VPS

The owner will deploy this release. No remote deployment or Google account changes were performed.

The source archive contains only the changed frontend files and new SEO modules. It does not contain credentials, node_modules, the local catalog snapshot or dist. Back up your existing checkout or commit its current state before applying it. Extract the archive into `/opt/crunchybag`, preserving the archive paths. Alternatively, transfer these changes through your usual Git workflow; local changes have not been pushed by this task.

On the VPS:

```sh
cd /opt/crunchybag
npm run lint
npm run build
```

Dependencies have not changed. A standard build fetches the current public menu and emits the complete `dist` tree, including category, product, blog, delivery and takeaway pages. Do not set SEO_CATALOG_FILE in production unless deliberately using a fresh, verified public menu snapshot. Nginx already serves `/opt/crunchybag/dist`; a frontend-only build needs no service restart.

For real 404 responses and legacy-food redirects, review `deploy/nginx-seo.conf` against your active `/etc/nginx/sites-available/crunchybag.com` configuration (confirm the active file path first). It is a server-block fragment, not a complete config. Replace the existing broad SPA `location /` and retain the API, WebSocket, backend-admin, media, static assets and TLS blocks. Do not blindly overwrite the active configuration.

After editing the Nginx config:

```sh
sudo nginx -t
sudo systemctl reload nginx
```

Only reload if validation succeeds. Test the homepage, `/menu/pakoda`, `/menu/sandwiches`, `/menu/fried-chicken`, a real product, `/takeaway`, `/delivery/kathmandu`, a blog, checkout, tracking and staff login. An unknown URL must return HTTP 404. Check that legacy `/pakoda` redirects to `/menu/pakoda`. Verify that the first-order discount shown in checkout agrees with the configured offer; no live loyalty configuration was changed here.

In Search Console, submit `https://crunchybag.com/sitemap.xml`, then inspect the homepage and representative category/product/city pages. Update the Google Business Profile to explain 24/7 delivery/takeaway separately from 5 AM–11 PM dine-in hours. Both phone numbers, map pin and official social profiles are in `src/data/seo/site.ts`.

See `SEO_IMPLEMENTATION.md` for the full implementation and remaining external checks.
