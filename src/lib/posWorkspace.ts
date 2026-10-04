import { useEffect, useState } from "react";
import { apiClient } from "./api";
import { fromCategory, fromProduct } from "./catalogApi";
import { Category, Product } from "../types";
import { PosOrder, PosSession, posError, posPath } from "./posApi";

export interface PosQuote {
  manual_discount_amount?: string;
  loyalty?: {name:string;percent:string;amount:string}|null;
  subtotal: string;
  discount_amount: string;
  service_charge_amount: string;
  cash_round_down_savings: string;
  vat_included_amount: string;
  total_payable: string;
  due_amount?: string;
  order_version?: number;
  items?: {
    product_id: string;
    quantity: number;
    unit_price: string;
    line_total: string;
  }[];
}

export function usePosQuote(
  session: PosSession,
  path: string,
  body: unknown | null,
) {
  const key = body === null ? "" : JSON.stringify(body);
  const [state, setState] = useState<{
    key: string;
    quote: PosQuote | null;
    error: string;
  }>({ key: "", quote: null, error: "" });
  const scope = `${session.outlet}:${session.revision}:${session.menuRevision}:${path}:${key}`;
  useEffect(() => {
    if (!session.enabled || !key) return;
    const abort = new AbortController();
    let live = true;
    const timer = setTimeout(() => {
      apiClient
        .post<PosQuote>(posPath(session.outlet, path), JSON.parse(key), {
          signal: abort.signal,
        })
        .then((quote) => {
          if (live) setState({ key: scope, quote, error: "" });
        })
        .catch((e) => {
          if (live) setState({ key: scope, quote: null, error: posError(e) });
        });
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
      abort.abort();
    };
  }, [session.enabled, scope]);
  return {
    quote: state.key === scope ? state.quote : null,
    error: state.key === scope ? state.error : "",
    loading: !!key && state.key !== scope,
  };
}

export function usePosMenu(session: PosSession) {
  const [state, setState] = useState<{
    outlet: string;
    products: Product[];
    categories: Category[];
    error: string;
  }>({ outlet: "", products: [], categories: [], error: "" });
  useEffect(() => {
    if (!session.enabled) return;
    const abort = new AbortController();
    let live = true;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const load = () =>
      apiClient
        .get<any>(`/catalog/menu/?outlet_id=${session.outlet}&channel=pos`, {
          signal: abort.signal,
        })
        .then((data) => {
          if (!live) return;
          setState({
            outlet: session.outlet,
            categories: data.categories.map(fromCategory),
            products: data.categories
              .flatMap((c: any) => c.products)
              .map(fromProduct),
            error: "",
          });
          // A one-shot refresh only at a configured price change, never periodic polling.
          if (
            typeof data.valid_until === "number" &&
            data.valid_until * 1000 > Date.now()
          )
            deadline = setTimeout(
              load,
              data.valid_until * 1000 - Date.now() + 100,
            );
        })
        .catch((e) => {
          if (live)
            setState({
              outlet: session.outlet,
              categories: [],
              products: [],
              error: posError(e),
            });
        });
    void load();
    return () => {
      live = false;
      clearTimeout(deadline);
      abort.abort();
    };
  }, [session.enabled, session.outlet, session.menuRevision]);
  return state.outlet === session.outlet
    ? { ...state, loading: false }
    : { products: [], categories: [], error: "", loading: true };
}

export function usePosDetail(session: PosSession, id: number | null) {
  const [state, setState] = useState<{
    scope: string;
    order: PosOrder | null;
    error: string;
  }>({ scope: "", order: null, error: "" });
  const scope = `${session.outlet}:${id}:${session.revision}`;
  useEffect(() => {
    if (!session.enabled || !id) return;
    const abort = new AbortController();
    let live = true;
    apiClient
      .get<PosOrder>(posPath(session.outlet, `${id}/`), {
        signal: abort.signal,
      })
      .then((order) => {
        if (live) setState({ scope, order, error: "" });
      })
      .catch((e) => {
        if (live) setState({ scope, order: null, error: posError(e) });
      });
    return () => {
      live = false;
      abort.abort();
    };
  }, [session.enabled, scope]);
  return {
    order: state.scope.startsWith(`${session.outlet}:${id}:`)
      ? state.order
      : null,
    error: state.scope === scope ? state.error : "",
    loading: !!id && state.scope !== scope,
  };
}

// Legacy screens retain their existing client-side filters and pagination. Read each
// server page once per scope/change; no interval, demo fallback, or 100-row truncation.
export function usePosOrderFeed(session: PosSession, filters: Record<string, string | number | boolean> = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([,v]) => v !== '').map(([k,v]) => [k,String(v)])).toString();
  const scope = `${session.outlet}:${query}`;
  const [state, setState] = useState<{ scope: string; results: PosOrder[]; error: string; loading: boolean }>({ scope: '', results: [], error: '', loading: true });
  useEffect(() => {
    if (!session.enabled || !session.meta) return;
    let live = true; const abort = new AbortController();
    const timer = setTimeout(async () => {
      setState(old => ({ scope, results: old.scope === scope ? old.results : [], error: '', loading: true }));
      try {
        const results: PosOrder[] = [];
        for (let page = 1; live; page++) {
          const data = await apiClient.get<{ results: PosOrder[]; count: number }>(`${posPath(session.outlet)}&page_size=100&page=${page}&${query}`, { signal: abort.signal });
          results.push(...data.results);
          if (results.length >= data.count || !data.results.length) break;
        }
        if (live) setState({ scope, results, error: '', loading: false });
      } catch(e) { if (live) setState({ scope, results: [], error: posError(e), loading: false }); }
    }, 150);
    return () => { live = false; clearTimeout(timer); abort.abort(); };
  }, [session.enabled, !!session.meta, scope, session.revision]);
  return state.scope === scope ? state : { results: [], error: '', loading: session.enabled };
}

export function usePosReceipt(session: PosSession, order: PosOrder | undefined, kind: string) {
  const receipt = [...(order?.receipts || [])].reverse().find(r => r.kind === kind);
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    setData(null);
    if (!receipt) return;
    const abort = new AbortController(); let live = true;
    apiClient.get<any>(posPath(session.outlet, `receipts/${receipt.id}/`), { signal: abort.signal })
      .then(value => { if(live) setData(value); }).catch(() => {});
    return () => { live = false; abort.abort(); };
  }, [session.outlet, receipt?.id]);
  return data;
}
