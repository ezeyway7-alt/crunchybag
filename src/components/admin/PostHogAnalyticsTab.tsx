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
      funnel?: {step: string; sessions: number}[];
      last_steps?: {event: string; sessions: number; visitors: number}[];
      friction?: {event: string; category: string; events: number; sessions: number}[];
    };
  };
  scope: string;
};

const panel = 'bg-[#121214] border border-zinc-800 rounded-lg p-3';
const actionLabels: Record<string, string> = {
  login_started: 'Sign-in started',
  login_success: 'Signed in',
  login_failed: 'Sign-in failed',
  auth_required: 'Sign-in required',
  map_opened: 'Delivery map opened',
  map_pin_selected: 'Map point selected',
  delivery_location_error: 'Map / location error',
  location_selected: 'Delivery location saved',
  payment_method_view: 'Payment details shown',
  payment_method_selected: 'Payment method selected',
  payment_proof_uploaded: 'Receipt selected',
  payment_proof_rejected: 'Receipt rejected',
  checkout_validation_failed: 'Checkout validation failed',
  order_failed: 'Order request failed',
  api_error: 'API error',
  network_error: 'Network error',
  javascript_error: 'Website error',
  image_error: 'Product image failed',
};
const categoryLabels: Record<string, string> = {
  name_missing: 'name missing',
  address_missing: 'delivery address missing',
  table_missing: 'table not selected',
  cart_sync: 'cart sync failed',
  location_unavailable: 'location unavailable',
  location_invalid: 'invalid location result',
  location_permission: 'location permission denied',
  location_timeout: 'location timed out',
  unsupported_type: 'unsupported file type',
  file_too_large: 'file too large',
  empty_file: 'empty file',
  image_load: 'image load',
  uncaught_exception: 'website error',
  unhandled_rejection: 'website error',
  network: 'network failure',
};

function money(value: string) {
  return `NPR ${Number(value || 0).toLocaleString('en-NP', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function Metric({label, value}: {label: string; value: string}) {
  return <article className="min-w-0">
    <p className="text-[10px] leading-tight text-zinc-500">{label}</p>
    <p className="mt-0.5 break-words text-sm font-semibold tabular-nums text-zinc-100">{value}</p>
  </article>;
}

function actionLabel(event: string, category = '') {
  const label = actionLabels[event] || event.replace(/_/g, ' ');
  if (!category) return label;
  if (category.startsWith('http_')) return `${label} · request failed`;
  return category === 'other' ? `${label} · other` : `${label} · ${categoryLabels[category] || category}`;
}

function FunnelRows({rows}: {rows: NonNullable<Overview['analytics']['visitors']['funnel']>}) {
  const total = rows[0]?.sessions || 0;
  const largestDrop = rows.slice(1).reduce((largest, row, index) => {
    const previous = rows[index].sessions;
    const drop = Math.max(0, previous - row.sessions);
    return drop > largest.drop ? {from: rows[index].step, to: row.step, drop, rate: previous ? drop / previous : 0} : largest;
  }, {from: '', to: '', drop: 0, rate: 0});

  return <div className="space-y-2">
    {largestDrop.drop > 0 && <p className="text-xs text-amber-300">
      Largest drop: {largestDrop.drop} of {rows.find(row => row.step === largestDrop.from)?.sessions} sessions ({Math.round(largestDrop.rate * 100)}%) from {largestDrop.from} to {largestDrop.to}.
    </p>}
    {rows.map((row, index) => {
      const previous = index ? rows[index - 1].sessions : row.sessions;
      const lost = Math.max(0, previous - row.sessions);
      const percent = previous ? Math.round((lost / previous) * 100) : 0;
      return <div key={row.step} className="grid grid-cols-[minmax(7rem,1fr)_minmax(3rem,2fr)_auto] items-center gap-3 text-xs">
        <span className="text-zinc-300">{row.step}</span>
        <div className="h-1.5 overflow-hidden rounded bg-zinc-800">
          <div className="h-full rounded bg-amber-500" style={{width: `${total ? Math.min(100, row.sessions / total * 100) : 0}%`}}/>
        </div>
        <span className="min-w-20 text-right tabular-nums">
          {row.sessions}
          {index > 0 && lost > 0 && <span className="ml-2 text-zinc-500">−{lost} ({percent}%)</span>}
        </span>
      </div>;
    })}
  </div>;
}

function VisitorChart({rows}: {rows: NonNullable<Overview['analytics']['visitors']['daily']>}) {
  const width = Math.max(320, rows.length * 44);
  const height = 145;
  const chartTop = 14;
  const chartBottom = 106;
  const max = Math.max(1, ...rows.map(row => row.visitors));
  const step = rows.length ? width / rows.length : width;
  const barWidth = Math.min(20, step * 0.55);
  return <div className="overflow-x-auto">
    <svg role="img" aria-label="Anonymous visitors by day" viewBox={`0 0 ${width} ${height}`} className="h-36 w-full min-w-[320px]">
      <line x1="0" y1={chartBottom} x2={width} y2={chartBottom} stroke="#52525b"/>
      {rows.map((row, index) => {
        const barHeight = Math.max(row.visitors ? 3 : 0, row.visitors / max * (chartBottom - chartTop));
        const x = index * step + (step - barWidth) / 2;
        const y = chartBottom - barHeight;
        return <g key={row.date}>
          <title>{`${row.date}: ${row.visitors} visitors, ${row.sessions} visits, ${row.page_views} page views`}</title>
          <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" fill="#f59e0b"/>
          <text x={x + barWidth / 2} y={Math.max(13, y - 5)} textAnchor="middle" fill="#f4f4f5" fontSize="10">{row.visitors}</text>
          <text x={x + barWidth / 2} y="128" textAnchor="middle" fill="#a1a1aa" fontSize="9">{row.date.slice(5)}</text>
        </g>;
      })}
    </svg>
  </div>;
}

export function PostHogAnalyticsTab() {
  const {currentOutlet} = useApp();
  const outlet = String(currentOutlet?.id || '');
  const [endDate, setEndDate] = useState(todayNepal());
  const [startDate, setStartDate] = useState(todayNepal());
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
  const insightsAvailable = Array.isArray(visitors?.funnel)
    && Array.isArray(visitors?.last_steps)
    && Array.isArray(visitors?.friction);

  return <section className="space-y-4" aria-label="Analytics">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-baseline gap-2">
        <h1 className="text-lg font-bold">Analytics</h1>
        <span className="truncate text-[11px] text-zinc-500">{currentOutlet?.name || 'Select an outlet'} · Nepal time</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <label className="flex items-center gap-1 text-[10px] text-zinc-500">From
          <input aria-label="Analytics start date" type="date" value={startDate} max={endDate || undefined}
            onChange={event => setStartDate(event.target.value)}
            className="bg-transparent px-1 py-1 text-[11px] text-zinc-300 outline-none"/>
        </label>
        <label className="flex items-center gap-1 text-[10px] text-zinc-500">To
          <input aria-label="Analytics end date" type="date" value={endDate} min={startDate || undefined}
            onChange={event => setEndDate(event.target.value)}
            className="bg-transparent px-1 py-1 text-[11px] text-zinc-300 outline-none"/>
        </label>
        <button aria-label="Refresh analytics" className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-amber-400 disabled:opacity-40"
          onClick={() => setRefresh(value => value + 1)} disabled={!valid || !datesValid}>
          <RefreshCw size={12}/> Refresh
        </button>
      </div>
      {!datesValid && <p role="alert" className="w-full text-xs text-rose-400">Choose a valid date range.</p>}
    </header>

    {!valid && <p className={`${panel} text-sm text-zinc-400`}>Select an outlet to view its sales and PostHog project.</p>}
    {valid && !data && !error && <p role="status" className={`${panel} text-sm text-zinc-400`}>Loading sales and analytics status…</p>}
    {error && <div role="alert" className={`${panel} text-sm text-rose-400`}>
      {error}<button className="ml-3 underline" onClick={() => setRefresh(value => value + 1)}>Retry</button>
    </div>}

    {data && <>
      <section aria-labelledby="sales-heading" className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-zinc-800 pb-3">
        <h2 id="sales-heading" className="shrink-0 text-xs font-semibold">Sales · Django</h2>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3 xl:grid-cols-6">
          <Metric label="Website orders" value={`${data.sales.orders.toLocaleString()} · ${data.sales.cancelled.toLocaleString()} cancelled`}/>
          <Metric label="Order value" value={money(data.sales.order_value)}/>
          <Metric label="Fully paid" value={data.sales.paid_orders.toLocaleString()}/>
          <Metric label="Payments received" value={money(data.sales.received)}/>
          <Metric label="Refunds" value={money(data.sales.refunded)}/>
          <Metric label="Net received" value={money(data.sales.net_received)}/>
        </div>
      </section>

      <section aria-labelledby="visitor-heading" className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="visitor-heading" className="text-xs font-semibold">Visitors · PostHog</h2>
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
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                <span>Project: <strong className="text-emerald-400">Connected</strong></span>
                <span>Session replay: <strong>{analytics.replay_enabled ? 'Enabled' : 'Disabled'}</strong></span>
                {analytics.can_open && !analytics.project_url && <span className="text-amber-300">Project URL is not configured.</span>}
                {!analytics.can_open && <span className="text-zinc-400">Ask an outlet owner or manager to open the PostHog project.</span>}
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-2 border-y border-zinc-800 py-2 sm:grid-cols-4">
                <Metric label="Orders linked" value={analytics.linked_orders.toLocaleString()}/>
                <Metric label="Events sent" value={analytics.sent_events.toLocaleString()}/>
                <Metric label="Events waiting" value={analytics.pending_events.toLocaleString()}/>
                <Metric label="Events failed" value={analytics.failed_events.toLocaleString()}/>
              </div>
              {analytics.failed_events > 0 && <p role="status" className="text-xs text-amber-300">
                Some server-confirmed order events failed to send. Check the Celery worker logs before relying on PostHog purchase counts.
              </p>}
            </>}
        {analytics?.configured && visitors && !visitors.available && <div role="status" className="rounded border border-amber-900/70 bg-amber-950/30 p-3 text-xs text-amber-200">
          {visitors.message} Open PostHog to see its built-in charts and session replays.
        </div>}
        {visitors?.available && <>
          <div className="grid grid-cols-3 gap-4 border-b border-zinc-800 pb-2 sm:max-w-lg">
            <Metric label="Visitors" value={(visitors.unique_visitors || 0).toLocaleString()}/>
            <Metric label="Visits" value={(visitors.sessions || 0).toLocaleString()}/>
            <Metric label="Page views" value={(visitors.page_views || 0).toLocaleString()}/>
          </div>
          <div className="grid items-start gap-3 lg:grid-cols-2">
            <div className="space-y-3">
              <div className={`${panel} space-y-2`}>
                <h3 className="text-xs font-semibold">Visitors by day</h3>
                {visitors.daily?.length ? <VisitorChart rows={visitors.daily}/> : <p className="text-xs text-zinc-500">No page views for this date.</p>}
              </div>
              <div className={`${panel} space-y-2`}>
                <h3 className="text-xs font-semibold">Most-viewed pages</h3>
                {visitors.top_pages?.length
                  ? <div className="divide-y divide-zinc-800">{visitors.top_pages.map(row=><div key={row.path} className="flex justify-between gap-3 py-1.5 text-xs"><span className="break-all">{row.path}</span><span className="shrink-0 text-zinc-400">{row.page_views} views · {row.visitors} visitors</span></div>)}</div>
                  : <p className="text-xs text-zinc-500">No page views for this date.</p>}
              </div>
            </div>
            <div className="space-y-3">
              {!insightsAvailable && <div role="status" className="rounded border border-amber-900/70 bg-amber-950/30 p-3 text-xs text-amber-200">
                Visitor counts are available, but checkout insights are missing from the backend response. Deploy and restart the updated backend.
              </div>}
              {insightsAvailable && <>
                <div className={`${panel} space-y-2`}>
                  <h3 className="text-xs font-semibold">Checkout funnel · sessions</h3>
                  {visitors.funnel?.length
                    ? <FunnelRows rows={visitors.funnel}/>
                    : <p className="text-xs text-zinc-500">No funnel events for this date.</p>}
                </div>
                <div className={`${panel} space-y-2`}>
                  <h3 className="text-xs font-semibold">Last action · idle 30+ min</h3>
                  {visitors.last_steps?.length
                    ? <div className="divide-y divide-zinc-800">{visitors.last_steps.slice(0, 6).map(row=><div key={row.event} className="flex justify-between gap-3 py-1.5 text-xs"><span>{actionLabel(row.event)}</span><span className="shrink-0 text-zinc-400">{row.sessions} sessions</span></div>)}</div>
                    : <p className="text-xs text-zinc-500">No inactive sessions yet.</p>}
                </div>
                <div className={`${panel} space-y-2`}>
                  <h3 className="text-xs font-semibold">Checkout checkpoints and errors</h3>
                  {visitors.friction?.length
                    ? <div className="max-h-52 divide-y divide-zinc-800 overflow-y-auto">{visitors.friction.map(row=><div key={`${row.event}:${row.category}`} className="flex justify-between gap-3 py-1.5 text-xs"><span>{actionLabel(row.event, row.category)}</span><span className="shrink-0 text-zinc-400">{row.sessions} sessions · {row.events} events</span></div>)}</div>
                    : <p className="text-xs text-zinc-500">No checkout checkpoint events for this date.</p>}
                </div>
              </>}
            </div>
          </div>
        </>}
      </section>
    </>}
  </section>;
}
