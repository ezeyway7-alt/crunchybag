import { RESERVATION_GUIDE_HTML } from '../../data/seo/orderingGuides';
import React, { useEffect } from 'react';
import { updatePageSEO } from '../../lib/seo';

export function readStaticInformation(path: string) {
  if (!/^\/(delivery(?:\/|$)|takeaway$|reserve$|about$|contact$|faq$|terms$|privacy$)/.test(path)) return null;
  const fallback = path === '/reserve' ? {
    path, title: 'Book a Table Online | Crunchy Bag Restaurant Lalitpur',
    description: 'Plan a dine-in visit to Crunchy Bag at Dhungesadhu Chowk, Imadol, Lalitpur. Dine-in hours are 5 AM to 11 PM daily.',
    canonical: 'https://crunchybag.com/reserve',
    contentHtml: `<main id="app-landing-summary" class="max-w-4xl mx-auto px-4 py-8 space-y-4 text-zinc-300"><h1>Plan a dine-in visit to Crunchy Bag</h1>${RESERVATION_GUIDE_HTML}</main>`,
  } : null;
  const element = document.getElementById('static-route-data');
  if (!element?.textContent) return fallback;
  try {
    const data = JSON.parse(element.textContent);
    return data.path === path && typeof data.contentHtml === 'string' ? data : fallback;
  } catch { return fallback; }
}

export function StaticInformationPage({ data }: { data: NonNullable<ReturnType<typeof readStaticInformation>> }) {
  useEffect(() => { updatePageSEO(data); }, [data.path]);
  // Content is generated from the project's trusted editorial templates at build time.
  return <div dangerouslySetInnerHTML={{ __html: data.contentHtml }} />;
}
