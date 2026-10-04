import React, { useEffect } from 'react';
import { updatePageSEO } from '../../lib/seo';

export function readStaticInformation(path: string) {
  if (!/^\/(delivery(?:\/|$)|about$|contact$|faq$|terms$|privacy$)/.test(path)) return null;
  const element = document.getElementById('static-route-data');
  if (!element?.textContent) return null;
  try {
    const data = JSON.parse(element.textContent);
    return data.path === path && typeof data.contentHtml === 'string' ? data : null;
  } catch { return null; }
}

export function StaticInformationPage({ data }: { data: NonNullable<ReturnType<typeof readStaticInformation>> }) {
  useEffect(() => { updatePageSEO(data); }, [data.path]);
  // Content is generated from the project's trusted editorial templates at build time.
  return <div dangerouslySetInnerHTML={{ __html: data.contentHtml }} />;
}
