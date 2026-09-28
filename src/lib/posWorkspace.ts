import { useEffect, useState } from "react";
import { apiClient } from "./api";
import { fromCategory, fromProduct } from "./catalogApi";
import { Category, Product } from "../types";
import { PosOrder, PosSession, posError, posPath } from "./posApi";

export interface PosQuote {
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
