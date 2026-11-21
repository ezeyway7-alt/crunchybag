import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

// Preparation only writes local files. Submission is an explicit post-deployment step.
const origin = 'https://crunchybag.com';
const publicKey = path.resolve('public/indexnow-key.txt');
const key = process.env.INDEXNOW_KEY || (fs.existsSync(publicKey) ? fs.readFileSync(publicKey, 'utf8').trim() : randomBytes(16).toString('hex'));
if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error('INDEXNOW_KEY must contain 8–128 letters, digits or hyphens.');
const xml = fs.readFileSync('dist/sitemap.xml', 'utf8');
const urlList = [...new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1].replaceAll('&amp;', '&')))];
if (!urlList.length || urlList.length > 10000 || urlList.some(value => new URL(value).origin !== origin)) throw new Error('Invalid or oversized canonical sitemap.');
const keyLocation = `${origin}/indexnow-key.txt`;
const payload = { host: new URL(origin).host, key, keyLocation, urlList };

if (process.argv.includes('--submit')) {
  const verification = await fetch(keyLocation, { signal: AbortSignal.timeout(20000) });
  if (!verification.ok || (await verification.text()).trim() !== key) throw new Error('Deploy dist/indexnow-key.txt before submitting; the live key must match.');
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30000),
  });
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow HTTP ${response.status}: ${await response.text()}`);
  console.log(`IndexNow received ${urlList.length} URLs (HTTP ${response.status}). This does not guarantee indexing.`);
} else {
  fs.writeFileSync(publicKey, `${key}\n`);
  fs.writeFileSync('dist/indexnow-key.txt', `${key}\n`);
  console.log(`Prepared dist/indexnow-key.txt for ${urlList.length} canonical URLs. Deploy the complete dist folder, then run npm run indexnow:submit. No URLs submitted.`);
}
