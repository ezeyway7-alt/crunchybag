import React, { useEffect, useState } from "react";
import { Order } from "../../types";
import {
  PosOrder,
  Tender,
  usePosSession,
  usePosCommand,
  npr,
  printPosReceipt,
} from "../../lib/posApi";
import { usePosDetail, usePosQuote } from "../../lib/posWorkspace";
import { PosOrderRegister } from "./PosOrderRegister";
import {
  button,
  primary,
  field,
  OrderItems,
  OrderTotals,
  TenderFields,
} from "./PosShared";

export const StaffBillingTab: React.FC<{
  initialSelectedOrder?: Order | null;
}> = ({ initialSelectedOrder }) => {
  const session = usePosSession();
  const source = (
    initialSelectedOrder as (Order & { _posOrder?: PosOrder }) | null
  )?._posOrder;
  return (
    <BillingWorkspace
      key={session.outlet}
      session={session}
      initialId={
        source && String(source.outlet_id) === session.outlet ? source.id : null
      }
    />
  );
};
function BillingWorkspace({
  session,
  initialId,
}: {
  key?: string | number;
  session: ReturnType<typeof usePosSession>;
  initialId: number | null;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(initialId);
  useEffect(() => {
    if (initialId) setSelectedId(initialId);
  }, [initialId]);
  const detail = usePosDetail(session, selectedId);
  return (
    <div className="space-y-4 text-sm text-zinc-100">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Billing & Settlement</h1>
        <div className="flex items-center gap-3">
          <span>{session.connection}</span>
          <button className={button} onClick={session.refresh}>
            Refresh
          </button>
        </div>
      </header>
      {session.error && (
        <p role="alert" className="text-red-400">
          {session.error}
        </p>
      )}
      {detail.error && (
        <p role="alert" className="text-red-400">
          {detail.error}
        </p>
      )}
      {detail.loading && <p role="status">Loading bill...</p>}
      {detail.order ? (
        <SettlementForm
          key={detail.order.id}
          session={session}
          order={detail.order}
          refreshing={detail.loading}
        />
      ) : (
        !detail.loading && (
          <p className="border border-zinc-800 p-6 text-zinc-400">
            Select an order below to view its bill and record a payment.
          </p>
        )
      )}
      <PosOrderRegister
        session={session}
        billing
        onSelect={(o) => setSelectedId(o.id)}
      />
    </div>
  );
}
function SettlementForm({
  session,
  order,
  refreshing,
}: {
  key?: string | number;
  session: ReturnType<typeof usePosSession>;
  order: PosOrder;
  refreshing: boolean;
}) {
  const command = usePosCommand(session);
  const [discount, setDiscount] = useState(order.discount_amount),
    [reason, setReason] = useState(order.discount_reason || "");
  const [name, setName] = useState(order.customer_name),
    [phone, setPhone] = useState(order.customer_phone);
  const [rows, setRows] = useState<Tender[]>([]),
    [cash, setCash] = useState(""),
    [error, setError] = useState("");
  const [refundAmount, setRefundAmount] = useState(""),
    [refundMethod, setRefundMethod] = useState(""),
    [refundReason, setRefundReason] = useState(""),
    [refundRef, setRefundRef] = useState("");
  const methods = session.meta?.payment_methods || [];
  const quote = usePosQuote(
    session,
    `${order.id}/billing-quote/`,
    session.meta?.permissions.billing && order.status !== "CANCELLED"
      ? { version: order.version, discount_amount: discount }
      : null,
  );
  useEffect(() => {
    setDiscount(order.discount_amount);
    setReason(order.discount_reason || "");
    setName(order.customer_name);
    setPhone(order.customer_phone);
    setRows([]);
    setCash("");
  }, [order.id, order.version]);
  const due = Number(quote.quote?.due_amount ?? order.due_amount);
  const allocated = rows.reduce((n, r) => n + Number(r.amount || 0), 0);
  const cashApplied = rows
    .filter((r) => r.method === "CASH")
    .reduce((n, r) => n + Number(r.amount || 0), 0);
  const credit = rows
    .filter((r) => r.method === "CREDIT")
    .reduce((n, r) => n + Number(r.amount || 0), 0);
  const disabled = command.busy || command.hasPending || refreshing;
  const settle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!quote.quote) return;
    if (
      !rows.length ||
      rows.some(
        (r) => !Number.isFinite(Number(r.amount)) || Number(r.amount) <= 0,
      ) ||
      allocated > due + 0.001
    ) {
      setError("Enter positive payments up to the remaining due amount.");
      return;
    }
    if (cash && Number(cash) < cashApplied) {
      setError("Cash received is less than the applied cash payment.");
      return;
    }
    if (
      credit > 0 &&
      (!name.trim() || !phone.trim() || name.trim() === "Walk-in Guest")
    ) {
      setError("Enter the customer name and phone for Khata.");
      return;
    }
    const result = await command.run(`${order.id}/settle/`, {
      version: order.version,
      tenders: rows,
      discount_amount: discount,
      discount_reason: reason,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
    });
    if (result) setRows([]);
  };
  const printSaved = async (receiptId: number) => {
    try {
      await printPosReceipt(session.outlet, receiptId);
    } catch (e) {
      setError(String(e));
    }
  };
  const makeBill = async () => {
    setError("");
    if (Number(discount) !== Number(order.discount_amount)) {
      setError("Record the discounted settlement before issuing its bill.");
      return;
    }
    await command.run(`${order.id}/bill/`, { version: order.version });
  };
  const refund = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await command.run(`${order.id}/refund/`, {
      version: order.version,
      amount: refundAmount,
      method: refundMethod || methods.find((m) => m !== "CREDIT"),
      reference: refundRef,
      reason: refundReason,
    });
    if (result) {
      setRefundAmount("");
      setRefundReason("");
      setRefundRef("");
    }
  };
  return (
    <section className="grid gap-4 border border-zinc-800 bg-[#121214] p-4 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-lg font-bold">{order.order_number}</h2>
        <p>
          {order.customer_name} | {order.table_number || order.fulfillment_type}{" "}
          | {order.status} | {order.settlement}
        </p>
        <OrderItems order={order} />
        <OrderTotals order={order} />
        <div className="space-y-2">
          <h3 className="font-bold">Payment history</h3>
          {!order.payments.length && (
            <p className="text-zinc-400">No payments recorded.</p>
          )}
          {order.payments.map((p) => (
            <p key={p.id}>
              {p.status} | {p.method} | {npr(p.amount)} {p.reference}
            </p>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {order.receipts
            .filter((r) => r.kind !== "TOKEN")
            .map((r) => (
              <button
                key={r.id}
                className={button}
                onClick={() => void printSaved(r.id)}
              >
                Print {r.number}
              </button>
            ))}
        </div>
        <button
          className={button}
          disabled={
            disabled ||
            order.status === "CANCELLED" ||
            !session.meta?.permissions.billing
          }
          onClick={() => void makeBill()}
        >
          Generate saved bill
        </button>
        {session.meta?.permissions.kitchen &&
          ["READY", "OUT_FOR_DELIVERY"].includes(order.status) && (
            <button
              className={button}
              disabled={disabled}
              onClick={() =>
                void command.run(`${order.id}/transition/`, {
                  version: order.version,
                  status: "COMPLETED",
                })
              }
            >
              Complete service{order.table_id ? " & free table" : ""}
            </button>
          )}
        <p className="text-xs text-zinc-400">
          Generating a bill does not mark it paid. Print an existing bill above
          to reprint it.
        </p>
      </div>
      <div className="space-y-4">
        {[error, command.error, quote.error].filter(Boolean).map((msg, i) => (
          <p key={i} role="alert" className="text-red-400">
            {msg}
          </p>
        ))}
        {command.hasPending && (
          <button
            className={primary}
            disabled={command.busy}
            onClick={() => void command.recover()}
          >
            Recover pending payment action
          </button>
        )}
        {order.status !== "CANCELLED" &&
        Number(order.due_amount) > 0 &&
        session.meta?.permissions.billing ? (
          <form className="space-y-3" onSubmit={settle}>
            <h3 className="font-bold">Collect payment</h3>
            <fieldset disabled={disabled} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label>
                  Customer
                  <input
                    maxLength={120}
                    className={field}
                    disabled={Number(order.credit_amount) > 0}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  Phone
                  <input
                    maxLength={32}
                    className={field}
                    disabled={Number(order.credit_amount) > 0}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
              </div>
              {session.meta.permissions.discount && !order.billed_at && (
                <div className="grid grid-cols-2 gap-2">
                  <label>
                    Discount
                    <input
                      type="number"
                      min="0"
                      max={order.subtotal}
                      step="0.01"
                      required
                      className={field}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </label>
                  <label>
                    Reason
                    <input
                      maxLength={255}
                      required={
                        Number(discount) !== Number(order.discount_amount)
                      }
                      className={field}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                </div>
              )}
              {quote.loading ? (
                <p>Calculating balance...</p>
              ) : (
                quote.quote && (
                  <p className="text-lg font-bold text-amber-400">
                    Balance due: {npr(quote.quote.due_amount)}
                  </p>
                )
              )}
              <TenderFields
                rows={rows}
                onChange={setRows}
                methods={methods}
                disabled={disabled}
              />
              <button
                type="button"
                className={button}
                disabled={!quote.quote || due <= 0}
                onClick={() =>
                  setRows([
                    {
                      method: methods.find((m) => m !== "CREDIT") || methods[0],
                      amount: due.toFixed(2),
                      reference: "",
                    },
                  ])
                }
              >
                Use full remaining balance
              </button>
              <p>
                Applied: {npr(allocated)} | Still unallocated:{" "}
                {npr(
                  Math.max(
                    0,
                    due -
                      Number(order.credit_amount) -
                      allocated +
                      Math.min(Number(order.credit_amount), allocated - credit),
                  ),
                )}
              </p>
              {credit > 0 && (
                <p className="text-amber-400">
                  Khata is outstanding credit, not collected money.
                </p>
              )}
              {cashApplied > 0 && (
                <label className="block">
                  Cash received (optional)
                  <input
                    type="number"
                    min={cashApplied}
                    step="0.01"
                    className={field}
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                  />
                  Change: {npr(Math.max(0, Number(cash || 0) - cashApplied))}
                </label>
              )}
              <button
                className={`${primary} w-full`}
                disabled={disabled || !quote.quote || !rows.length}
              >
                {command.busy ? "Recording..." : "Record payment / credit"}
              </button>
            </fieldset>
          </form>
        ) : (
          <p className="text-zinc-400">
            {order.status === "CANCELLED"
              ? "This order is cancelled."
              : Number(order.due_amount) <= 0
                ? "This bill has no remaining balance."
                : "Your account cannot record payments."}
          </p>
        )}
        {session.meta?.permissions.refund &&
          Number(order.paid_amount) > Number(order.refunded_amount) && (
            <form
              className="space-y-2 border-t border-zinc-800 pt-4"
              onSubmit={refund}
            >
              <h3 className="font-bold">Refund collected payment</h3>
              <p>
                Available:{" "}
                {npr(Number(order.paid_amount) - Number(order.refunded_amount))}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label>
                  Amount
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    max={
                      Number(order.paid_amount) - Number(order.refunded_amount)
                    }
                    className={field}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                </label>
                <label>
                  Method
                  <select
                    className={field}
                    value={refundMethod || methods.find((m) => m !== "CREDIT")}
                    onChange={(e) => setRefundMethod(e.target.value)}
                  >
                    {methods
                      .filter((m) => m !== "CREDIT")
                      .map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                  </select>
                </label>
              </div>
              <label className="block">
                Reason
                <input
                  required
                  maxLength={255}
                  className={field}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </label>
              <label className="block">
                Reference
                <input
                  maxLength={128}
                  className={field}
                  value={refundRef}
                  onChange={(e) => setRefundRef(e.target.value)}
                />
              </label>
              <button className={button} disabled={disabled}>
                Record refund
              </button>
            </form>
          )}
      </div>
    </section>
  );
}
