import React, {useEffect, useState} from 'react';
import {ExternalLink, RefreshCw} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {apiClient, extractErrorMessage} from '../../lib/api';
import {todayNepal} from '../../lib/posApi';

type Overview = {
  sales: {
    orders: number;
    cancelled: number;
    order_value: string;
    paid_orders: number;
    received: string;
    refunded: string;
    net_received: string;
  };
  analytics: {
    provider: string;
    configured: boolean;
    replay_enabled: boolean;
    project_url: string;
    can_open: boolean;
    linked_orders: number;
    pending_events: number;
    failed_events: number;
    sent_events: number;
    visitors: {
      available: boolean;
      message: string;
      unique_visitors?: number;
      sessions?: number;
      page_views?: number;
      daily?: {date: string; visitors: number; sessions: number; page_views: number}[];
      top_events?: {event: string; events: number; visitors: number}[];
      top_pages?: {path: string; page_views: number; visitors: number}[];
    };
  };
  scope: string;
};

const panel = 'bg-[#121214] border border-zinc-800 rounded-lg p-4';

function money(value: string) {
  return `NPR ${Number(value || 0).toLocaleString('en-NP', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function Metric({label, value, note}: {label: string; value: string; note?: string}) {
  return <article className={`${panel} min-w-0`}>
    <p className="text-xs text-zinc-400">{label}</p>
    <p className="mt-2 break-words text-xl font-semibold text-amber-400">{value}</p>
    {note && <p className="mt-1 text-[11px] text-zinc-500">{note}</p>}
  </article>;
}

function VisitorChart({rows}: {rows: NonNullable<Overview['analytics']['visitors']['daily']>}) {
  const width = Math.max(640, rows.length * 72);
  const height = 200;
  const chartTop = 20;
  const chartBottom = 150;
  const max = Math.max(1, ...rows.map(row => row.visitors));
  const step = rows.length ? width / rows.length : width;
  const barWidth = Math.min(32, step * 0.55);
  return <div className="overflow-x-auto">
    <svg role="img" aria-label="Anonymous visitors by day" viewBox={`0 0 ${width} ${height}`} className="h-52 w-full min-w-[640px]">
      <line x1="0" y1={chartBottom} x2={width} y2={chartBottom} stroke="#52525b"/>
      {rows.map((row, index) => {
        const barHeight = Math.max(row.visitors ? 3 : 0, row.visitors / max * (chartBottom - chartTop));
        const x = index * step + (step - barWidth) / 2;
        const y = chartBottom - barHeight;
        return <g key={row.date}>
          <title>{`${row.date}: ${row.visitors} visitors, ${row.sessions} visits, ${row.page_views} page views`}</title>
          <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" fill="#f59e0b"/>
          <text x={x + barWidth / 2} y={Math.max(13, y - 5)} textAnchor="middle" fill="#f4f4f5" fontSize="10">{row.visitors}</text>
          <text x={x + barWidth / 2} y="174" textAnchor="middle" fill="#a1a1aa" fontSize="10">{row.date.slice(5)}</text>
        </g>;
      })}
    </svg>
  </div>;
}

export function PostHogAnalyticsTab() {
  const {currentOutlet} = useApp();
  const outlet = String(currentOutlet?.id || '');
  const [endDate, setEndDate] = useState(todayNepal());
  const [startDate, setStartDate] = useState(() => {
    const [year, month, day] = todayNepal().split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day - 6)).toISOString().slice(0, 10);
  });
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState<{scope: string; data: Overview | null; error: string}>({
    scope: '',
    data: null,
    error: '',
  });
  const valid = /^\d+$/.test(outlet);
  const datesValid = Boolean(startDate && endDate && startDate <= endDate);
  const scope = `${outlet}:${startDate}:${endDate}`;

  useEffect(() => {
    if (!valid || !datesValid) return;
    const controller = new AbortController();
    let active = true;
    setState({scope, data: null, error: ''});
    const query = new URLSearchParams({outlet_id: outlet, start_date: startDate, end_date: endDate});
    apiClient.get<Overview>(`/customer/reporting-overview/?${query}`, {signal: controller.signal})
      .then(data => { if (active) setState({scope, data, error: ''}); })
      .catch(error => {
        if (active) setState({scope, data: null, error: extractErrorMessage(error)});
      });
    return () => { active = false; controller.abort(); };
  }, [valid, datesValid, scope, refresh]);

  const data = state.scope === scope ? state.data : null;
  const error = state.scope === scope ? state.error : '';
  const analytics = data?.analytics;
  const visitors = analytics?.visitors;

  return <section className="space-y-4" aria-label="Analytics">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-amber-500">One clear source for each number</p>
        <h1 className="mt-1 text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-xs text-zinc-400">{currentOutlet?.name || 'Select an outlet'} · Nepal time</p>
      </div>
      <button className="flex items-center gap-2 rounded border border-zinc-700 px-3 py-2 text-xs hover:border-amber-500 disabled:opacity-40"
        onClick={() => setRefresh(value => value + 1)} disabled={!valid || !datesValid}>
        <RefreshCw size={14}/> Refresh
      </button>
    </header>

    <div className={`${panel} flex flex-wrap items-end gap-3`}>
      <label className="text-xs">From
        <input aria-label="Analytics start date" type="date" value={startDate} max={endDate || undefined}
          onChange={event => setStartDate(event.target.value)}
          className="mt-1 block rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs"/>
      </label>
      <label className="text-xs">To
        <input aria-label="Analytics end date" type="date" value={endDate} min={startDate || undefined}
          onChange={event => setEndDate(event.target.value)}
          className="mt-1 block rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs"/>
      </label>
      {!datesValid && <p role="alert" className="text-xs text-rose-400">Choose a valid date range.</p>}
    </div>

    {!valid && <p className={`${panel} text-sm text-zinc-400`}>Select an outlet to view its sales and PostHog project.</p>}
    {valid && !data && !error && <p role="status" className={`${panel} text-sm text-zinc-400`}>Loading sales and analytics status…</p>}
    {error && <div role="alert" className={`${panel} text-sm text-rose-400`}>
      {error}<button className="ml-3 underline" onClick={() => setRefresh(value => value + 1)}>Retry</button>
    </div>}

    {data && <>
      <section aria-labelledby="sales-heading" className="space-y-3">
        <div>
          <h2 id="sales-heading" className="text-sm font-semibold">Sales and payments · Django records</h2>
          <p className="mt-1 text-[11px] text-zinc-500">These are authoritative order and payment records, not browser estimates.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="Website orders" value={data.sales.orders.toLocaleString()} note={`${data.sales.cancelled.toLocaleString()} cancelled`}/>
          <Metric label="Order value" value={money(data.sales.order_value)} note="Excludes cancelled orders"/>
          <Metric label="Fully paid orders" value={data.sales.paid_orders.toLocaleString()}/>
          <Metric label="Payments received" value={money(data.sales.received)}/>
          <Metric label="Refunds recorded" value={money(data.sales.refunded)}/>
          <Metric label="Net received" value={money(data.sales.net_received)} note="Recorded payments less refunds"/>
        </div>
        <p className="text-[11px] text-zinc-500">{data.scope}</p>
      </section>

      <section aria-labelledby="visitor-heading" className={`${panel} space-y-3`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="visitor-heading" className="text-sm font-semibold">Visitor behaviour · PostHog</h2>
            <p className="mt-1 max-w-3xl text-xs text-zinc-400">
              Use PostHog for funnels, campaign paths, segmentation and privacy-masked session replay.
              Sales and verified payments above remain sourced from Django.
            </p>
          </div>
          {analytics?.configured && analytics.can_open && analytics.project_url
            ? <a href={analytics.project_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded bg-amber-500 px-3 py-2 text-xs font-semibold text-black hover:bg-amber-400">
                Open PostHog <ExternalLink size={13}/>
              </a>
            : null}
        </div>

        {!analytics?.configured
          ? <div role="status" className="rounded border border-amber-900/70 bg-amber-950/30 p-3 text-xs text-amber-200">
              PostHog is not configured for this outlet yet. An administrator must set its project token, region and project URL on the backend before visitor tracking or replay can start.
            </div>
          : <>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                <span>Project: <strong className="text-emerald-400">Connected</strong></span>
                <span>Session replay: <strong>{analytics.replay_enabled ? 'Enabled' : 'Disabled'}</strong></span>
                {analytics.can_open && !analytics.project_url && <span className="text-amber-300">Project URL is not configured.</span>}
                {!analytics.can_open && <span className="text-zinc-400">Ask an outlet owner or manager to open the PostHog project.</span>}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Orders linked to a visitor session" value={analytics.linked_orders.toLocaleString()}/>
                <Metric label="Business events delivered" value={analytics.sent_events.toLocaleString()}/>
                <Metric label="Events waiting to send" value={analytics.pending_events.toLocaleString()}/>
                <Metric label="Events requiring attention" value={analytics.failed_events.toLocaleString()}/>
              </div>
              {analytics.failed_events > 0 && <p role="status" className="text-xs text-amber-300">
                Some server-confirmed order events failed to send. Check the Celery worker logs before relying on PostHog purchase counts.
              </p>}
            </>}
        {analytics?.configured && visitors && !visitors.available && <div role="status" className="rounded border border-amber-900/70 bg-amber-950/30 p-3 text-xs text-amber-200">
          {visitors.message} Open PostHog to see its built-in charts and session replays.
        </div>}
        {visitors?.available && <>
          <div className="grid gap-2 sm:grid-cols-3">
            <Metric label="Anonymous visitors" value={(visitors.unique_visitors || 0).toLocaleString()} note="Distinct browsers with a page view"/>
            <Metric label="Visits" value={(visitors.sessions || 0).toLocaleString()} note="PostHog sessions with a page view"/>
            <Metric label="Page views" value={(visitors.page_views || 0).toLocaleString()}/>
          </div>
          <p className="text-[11px] text-zinc-500">
            Counts include browser-tracked activity for this outlet in the selected dates. A visitor is an anonymous browser ID, not a named or logged-in person; a different browser or device normally counts separately. Tracking skips browsers that signal Do Not Track or Global Privacy Control.
          </p>
          <p className="text-[11px] text-zinc-500">PostHog totals may take up to 2 minutes to refresh. After visiting from another browser, wait briefly and then select Refresh.</p>
          <div className={`${panel} space-y-3`}>
            <div>
              <h3 className="text-sm font-semibold">Visitors by day</h3>
              <p className="mt-1 text-[11px] text-zinc-500">Hover a bar for visitors, visits and page views.</p>
            </div>
            {visitors.daily?.length
              ? <VisitorChart rows={visitors.daily}/>
              : <p className="py-8 text-center text-xs text-zinc-500">No page views recorded in this date range yet. Visit the public website in another browser and refresh.</p>}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className={`${panel} space-y-3`}>
              <h3 className="text-sm font-semibold">What visitors did</h3>
              {visitors.top_events?.length
                ? <div className="divide-y divide-zinc-800">{visitors.top_events.map(row=><div key={row.event} className="flex justify-between gap-3 py-2 text-xs"><span className="break-all">{row.event}</span><span className="shrink-0 text-zinc-400">{row.events} events · {row.visitors} browsers</span></div>)}</div>
                : <p className="text-xs text-zinc-500">No tracked actions in this date range yet.</p>}
              <p className="text-[11px] text-zinc-500">For individual anonymous visits and replay, open PostHog and choose Session Replay.</p>
            </div>
            <div className={`${panel} space-y-3`}>
              <h3 className="text-sm font-semibold">Most-viewed pages</h3>
              {visitors.top_pages?.length
                ? <div className="divide-y divide-zinc-800">{visitors.top_pages.map(row=><div key={row.path} className="flex justify-between gap-3 py-2 text-xs"><span className="break-all">{row.path}</span><span className="shrink-0 text-zinc-400">{row.page_views} views · {row.visitors} browsers</span></div>)}</div>
                : <p className="text-xs text-zinc-500">No page views in this date range yet.</p>}
            </div>
          </div>
        </>}
      </section>
    </>}
  </section>;
}
