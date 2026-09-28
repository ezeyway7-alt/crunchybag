import React, { useState } from "react";
import {
  PosOrder,
  PosSession,
  usePosOrders,
  npr,
  todayNepal,
} from "../../lib/posApi";
import { button, field } from "./PosShared";

export function PosOrderRegister({
  session,
  onSelect,
  billing = false,
}: {
  session: PosSession;
  onSelect: (o: PosOrder) => void;
  billing?: boolean;
}) {
  const [filters, setFilters] = useState({
    search: "",
    start_date: billing ? "" : todayNepal(),
    end_date: billing ? "" : todayNepal(),
    status: "ALL",
    settlement: "ALL",
    fulfillment: "ALL",
    page: 1,
  });
  const query = usePosOrders(session, {
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")),
    page_size: 25,
  });
  const change = (key: string, value: string) =>
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  const data = query.data;
  return (
    <section className="space-y-3 border border-zinc-800 bg-[#121214] p-4">
      <h2 className="font-bold">
        {billing ? "Billing & settlement register" : "Orders"}
      </h2>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <label>
          Search
          <input
            className={field}
            value={filters.search}
            onChange={(e) => change("search", e.target.value)}
            placeholder="Order, customer, table, item"
          />
        </label>
        <label>
          From
          <input
            type="date"
            className={field}
            value={filters.start_date}
            onChange={(e) => change("start_date", e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            className={field}
            value={filters.end_date}
            onChange={(e) => change("end_date", e.target.value)}
          />
        </label>
        <label>
          Status
          <select
            className={field}
            value={filters.status}
            onChange={(e) => change("status", e.target.value)}
          >
            {[
              "ALL",
              "PENDING",
              "ACCEPTED",
              "PREPARING",
              "READY",
              "OUT_FOR_DELIVERY",
              "COMPLETED",
              "CANCELLED",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Settlement
          <select
            className={field}
            value={filters.settlement}
            onChange={(e) => change("settlement", e.target.value)}
          >
            {["ALL", "PAID", "UNPAID", "PARTIAL", "CREDIT", "REFUNDED"].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
        </label>
        <label>
          Order type
          <select
            className={field}
            value={filters.fulfillment}
            onChange={(e) => change("fulfillment", e.target.value)}
          >
            {["ALL", ...(session.meta?.fulfillment_modes || [])].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      {query.error && (
        <p role="alert" className="text-red-400">
          {query.error}
        </p>
      )}
      {data && (
        <div className="flex flex-wrap gap-5 text-sm">
          {[
            ["Orders", String(data.count)],
            ["Sales", npr(data.summary.final)],
            ["Collected", npr(data.summary.paid)],
            ["Due", npr(data.summary.due)],
            ["Khata", npr(data.summary.credit)],
            ["Refunded", npr(data.summary.refunded)],
          ].map(([k, v]) => (
            <p key={k}>
              {k}: <strong>{v}</strong>
            </p>
          ))}
          {Object.entries(data.summary.methods || {}).map(([k, v]) => (
            <p key={k}>
              {k}: <strong>{npr(String(v))}</strong>
            </p>
          ))}
        </div>
      )}
      {query.loading && <p role="status">Loading orders...</p>}
      {!query.loading && !query.error && data?.count === 0 && (
        <p className="py-6 text-zinc-400">No orders match these filters.</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-400">
            <tr>
              {[
                "Order / time",
                "Customer / table",
                "Status",
                "Settlement",
                "Total",
                "Due",
                "",
              ].map((h, i) => (
                <th key={i} className="p-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.results.map((o) => (
              <tr key={o.id} className="border-t border-zinc-800">
                <td className="p-2">
                  {o.order_number}
                  <small className="block text-zinc-500">
                    {new Date(o.created_at).toLocaleString()}
                  </small>
                </td>
                <td className="p-2">
                  {o.customer_name}
                  <small className="block">
                    {o.table_number || o.fulfillment_type}
                  </small>
                </td>
                <td className="p-2">{o.status}</td>
                <td className="p-2">{o.settlement}</td>
                <td className="p-2">{npr(o.total_payable)}</td>
                <td className="p-2">{npr(o.due_amount)}</td>
                <td className="p-2">
                  <button className={button} onClick={() => onSelect(o)}>
                    {billing ? "Open bill" : "View order"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end items-center gap-3">
        <button
          className={button}
          disabled={filters.page <= 1 || query.loading}
          onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
        >
          Previous
        </button>
        <span>
          Page {filters.page} of{" "}
          {Math.max(1, Math.ceil((data?.count || 0) / 25))}
        </span>
        <button
          className={button}
          disabled={filters.page * 25 >= (data?.count || 0) || query.loading}
          onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
        >
          Next
        </button>
      </div>
    </section>
  );
}
