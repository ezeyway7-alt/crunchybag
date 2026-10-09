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

export function PostHogAnalyticsTab() {
  const {currentOutlet} = useApp();
  const outlet = String(currentOutlet?.id || '');
  const [startDate, setStartDate] = useState(todayNepal());
  const [endDate, setEndDate] = useState(todayNepal());
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
      </section>
    </>}
  </section>;
}
