import React, { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { Order, Product } from "../../types";
import {
  usePosSession,
  usePosCommand,
  usePosOrders,
  posOrderToOrder,
  printPosReceipt,
  PosOrder,
  npr,
  activeOrder,
} from "../../lib/posApi";
import { usePosDetail, usePosMenu, usePosQuote } from "../../lib/posWorkspace";
import { StaffTableGrid } from "./StaffTableGrid";
import { PosOrderRegister } from "./PosOrderRegister";
import { PosProductPicker, CartEntry } from "./PosProductPicker";
import {
  button,
  primary,
  field,
  PosDialog,
  OrderItems,
  OrderTotals,
  nextStatus,
  statusLabel,
} from "./PosShared";

export const StaffPosOrderTab: React.FC<{
  onOpenBillingForOrder?: (order: Order) => void;
}> = ({ onOpenBillingForOrder }) => {
  const session = usePosSession();
  // Reset cart/selection on outlet change; old outlet commands must never reach another outlet.
  return (
    <PosWorkspace
      key={session.outlet}
      session={session}
      onOpenBillingForOrder={onOpenBillingForOrder}
    />
  );
};
function PosWorkspace({
  session,
  onOpenBillingForOrder,
}: {
  key?: string | number;
  session: ReturnType<typeof usePosSession>;
  onOpenBillingForOrder?: (o: Order) => void;
}) {
  const { addToast } = useApp();
  const command = usePosCommand(session),
    menu = usePosMenu(session);
  const [mode, setMode] = useState<
    "NEW_ORDER" | "ADD_TO_ONGOING" | "FLOOR_TABLES"
  >("NEW_ORDER");
  const [ongoingPage, setOngoingPage] = useState(1);
  const ongoing = usePosOrders(session, {
    open_tabs: true,
    page_size: 100,
    page: ongoingPage,
  });
  const [targetId, setTargetId] = useState<number | null>(null);
  const target = usePosDetail(session, targetId);
  const [viewId, setViewId] = useState<number | null>(null);
  const viewed = usePosDetail(session, viewId);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [configure, setConfigure] = useState<Product | null>(null);
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("");
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [notes, setNotes] = useState(""),
    [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState(""),
    [tableId, setTableId] = useState("");
  const [method, setMethod] = useState(""),
    [paidNow, setPaidNow] = useState(false);
  const [discount, setDiscount] = useState("0"),
    [reason, setReason] = useState("");
  const [actionReason, setActionReason] = useState(""),
    [error, setError] = useState("");
  const meta = session.meta;
  const effectiveMode = fulfillment || meta?.fulfillment_modes[0] || "";
  const effectiveMethod = method || meta?.payment_methods[0] || "";
  const appending = mode === "ADD_TO_ONGOING";
  const quote = usePosQuote(
    session,
    "quote/",
    cart.length && (!appending || target.order)
      ? {
          items: cart.map((c) => c.line),
          ...(appending
            ? { order_id: targetId }
            : { discount_amount: discount, payment_method: effectiveMethod }),
        }
      : null,
  );
  const products = menu.products.filter(
    (p) =>
      (!category || p.categoryId === category) &&
      `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  const openBilling = (o: PosOrder) =>
    onOpenBillingForOrder?.(posOrderToOrder(o, meta?.outlet_name));
  const selectRunning = (o: Order) => {
    setTargetId((o as Order & { _posOrder: PosOrder })._posOrder.id);
    setMode("ADD_TO_ONGOING");
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!quote.quote || !cart.length || !meta?.permissions.orders) return;
    const total = quote.quote.total_payable;
    if (
      !appending &&
      paidNow &&
      effectiveMethod === "CREDIT" &&
      (!name.trim() || !phone.trim())
    ) {
      setError("Khata requires customer name and phone.");
      return;
    }
    const result = await command.run(
      appending ? `${targetId}/append/` : "",
      appending
        ? {
            items: cart.map((c) => c.line),
            version: quote.quote.order_version,
            expected_total: total,
          }
        : {
            items: cart.map((c) => c.line),
            expected_total: total,
            fulfillment_type: effectiveMode,
            table_id: effectiveMode === "DINE_IN" ? Number(tableId) : null,
            customer_name: name.trim() || "Walk-in Guest",
            customer_phone: phone.trim(),
            delivery_address: address,
            notes,
            discount_amount: discount,
            discount_reason: reason,
            payment_method: effectiveMethod,
            tenders:
              paidNow && Number(total) > 0
                ? [{ method: effectiveMethod, amount: total, reference: "" }]
                : [],
          },
    );
    if (!result) return;
    setCart([]);
    setViewId(result.id);
    if (!appending) {
      setName("");
      setPhone("");
      setNotes("");
      setAddress("");
      setDiscount("0");
      setReason("");
      setTableId("");
    }
    addToast({
      title: appending ? "Round added" : "Order saved",
      description: result.order_number,
      type: "success",
    });
  };
  const print = async (o: PosOrder) => {
    try {
      const receipt = [...o.receipts].reverse().find((r) => r.kind === "TOKEN");
      if (receipt) await printPosReceipt(session.outlet, receipt.id);
    } catch (e) {
      setError(String(e));
    }
  };
  const runAction = async (o: PosOrder, action: string, body: object) => {
    await command.run(`${o.id}/${action}/`, { version: o.version, ...body });
  };
  return (
    <div className="space-y-4 text-sm text-zinc-100">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">POS & Orders</h1>
        <div className="flex items-center gap-3">
          <span
            className={
              session.connection === "Live"
                ? "text-emerald-400"
                : "text-amber-400"
            }
          >
            {session.connection}
          </span>
          <button className={button} onClick={session.refresh}>
            Refresh
          </button>
        </div>
      </header>
      {[
        session.error,
        command.error,
        ongoing.error,
        target.error,
        viewed.error,
        error,
      ]
        .filter(Boolean)
        .map((msg, i) => (
          <p key={i} role="alert" className="text-red-400">
            {msg}
          </p>
        ))}
      {command.hasPending && (
        <button
          className={primary}
          disabled={command.busy}
          onClick={async () => {
            const result = await command.recover();
            if (result?.order_number) {
              setCart([]);
              setViewId(result.id);
            }
          }}
        >
          Recover pending order action
        </button>
      )}
      {!session.enabled && <p>Sign in and choose an outlet to take orders.</p>}
      {meta && !meta.accepting_orders && (
        <p className="text-amber-400">
          This outlet is not accepting new orders.
        </p>
      )}
      <nav className="flex flex-wrap gap-2">
        {(
          [
            ["NEW_ORDER", "New order"],
            ["ADD_TO_ONGOING", "Add to ongoing"],
            ["FLOOR_TABLES", "Floor & tables"],
          ] as const
        ).map(([id, label]) => (
          <button
            className={mode === id ? primary : button}
            key={id}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {mode === "FLOOR_TABLES" ? (
        <StaffTableGrid
          session={session}
          orders={ongoing.data?.results || []}
          onSelectTableForNewOrder={(id) => {
            setTableId(id);
            setFulfillment("DINE_IN");
            setMode("NEW_ORDER");
          }}
          onSelectOngoingOrder={selectRunning}
          onOpenBillingForOrder={onOpenBillingForOrder}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
          <section className="border border-zinc-800 bg-[#121214] p-3">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <input
                aria-label="Search menu"
                className={field}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu"
              />
              <select
                aria-label="Category"
                className={field}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {menu.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {menu.error && (
              <p role="alert" className="text-red-400">
                {menu.error}
              </p>
            )}
            {menu.loading && <p>Loading menu...</p>}
            {!menu.loading && !products.length && (
              <p className="py-8 text-zinc-400">No menu items available.</p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {products.slice(0, 120).map((p) => (
                <button
                  className="overflow-hidden border border-zinc-800 bg-zinc-900 text-left hover:border-amber-500 disabled:opacity-40"
                  key={p.id}
                  disabled={
                    !p.isAvailable ||
                    !Number.isFinite(p.basePrice) ||
                    !meta?.permissions.orders
                  }
                  onClick={() => setConfigure(p)}
                >
                  {p.images?.[0] && (
                    <img
                      loading="lazy"
                      src={p.images[p.mainImageIndex || 0]}
                      alt=""
                      className="h-24 w-full object-cover"
                    />
                  )}
                  <div className="p-2">
                    <strong className="block">{p.name}</strong>
                    <span className="text-amber-400">{npr(p.basePrice)}</span>
                    {!p.isAvailable && (
                      <small className="block">Unavailable</small>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {products.length > 120 && (
              <p>Narrow your search to see more items.</p>
            )}
          </section>
          <form
            onSubmit={save}
            className="space-y-3 border border-zinc-800 bg-[#121214] p-4"
          >
            {appending ? (
              <>
                <h2 className="font-bold">Add items to a running tab</h2>
                <label>
                  Ongoing order
                  <select
                    required
                    className={field}
                    value={targetId || ""}
                    onChange={(e) =>
                      setTargetId(Number(e.target.value) || null)
                    }
                  >
                    <option value="">Select an order</option>
                    {target.order &&
                      !ongoing.data?.results.some(
                        (o) => o.id === target.order?.id,
                      ) && (
                        <option value={target.order.id}>
                          {target.order.table_number} /{" "}
                          {target.order.order_number}
                        </option>
                      )}
                    {ongoing.data?.results.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.table_number ? `${o.table_number} | ` : ""}
                        {o.order_number} | {o.customer_name} |{" "}
                        {npr(o.total_payable)}
                      </option>
                    ))}
                  </select>
                </label>
                {ongoing.data?.count === 0 && <p>No ongoing orders.</p>}
                {(ongoing.data?.count || 0) > 100 && (
                  <div>
                    <button
                      type="button"
                      className={button}
                      disabled={ongoingPage === 1}
                      onClick={() => setOngoingPage((p) => p - 1)}
                    >
                      Previous tabs
                    </button>
                    <button
                      type="button"
                      className={button}
                      disabled={ongoingPage * 100 >= (ongoing.data?.count || 0)}
                      onClick={() => setOngoingPage((p) => p + 1)}
                    >
                      Next tabs
                    </button>
                  </div>
                )}
                {target.order && (
                  <p>
                    Current total: {npr(target.order.total_payable)} | Due:{" "}
                    {npr(target.order.due_amount)}
                  </p>
                )}
              </>
            ) : (
              <>
                <h2 className="font-bold">New order</h2>
                <div className="grid grid-cols-2 gap-2">
                  <label>
                    Customer
                    <input
                      className={field}
                      maxLength={120}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Walk-in Guest"
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      className={field}
                      maxLength={32}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>
                  <label>
                    Order type
                    <select
                      required
                      className={field}
                      value={effectiveMode}
                      onChange={(e) => setFulfillment(e.target.value)}
                    >
                      {meta?.fulfillment_modes.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Billing method
                    <select
                      required
                      className={field}
                      value={effectiveMethod}
                      onChange={(e) => setMethod(e.target.value)}
                    >
                      {meta?.payment_methods.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {effectiveMode === "DINE_IN" && (
                  <label className="block">
                    Table
                    <select
                      required
                      className={field}
                      value={tableId}
                      onChange={(e) => setTableId(e.target.value)}
                    >
                      <option value="">Choose an available table</option>
                      {meta?.tables
                        .filter((t) => !t.active_order_id)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.section} / {t.table_number} ({t.capacity} seats)
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                {effectiveMode === "DELIVERY" && (
                  <label className="block">
                    Delivery address
                    <textarea
                      required
                      className={field}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </label>
                )}
                <label className="block">
                  Notes
                  <input
                    className={field}
                    maxLength={2000}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
                {meta?.permissions.discount && (
                  <div className="grid grid-cols-2 gap-2">
                    <label>
                      Discount
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        className={field}
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                      />
                    </label>
                    <label>
                      Discount reason
                      <input
                        required={Number(discount) > 0}
                        maxLength={255}
                        className={field}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </label>
                  </div>
                )}
                <label className="block">
                  <input
                    type="checkbox"
                    disabled={!meta?.permissions.billing}
                    checked={paidNow}
                    onChange={(e) => setPaidNow(e.target.checked)}
                  />{" "}
                  {effectiveMethod === "CREDIT"
                    ? "Allocate to customer Khata"
                    : "Payment received now"}
                </label>
                <p className="text-xs text-zinc-400">
                  Leave unchecked to keep the bill due. Split and partial
                  payments are available in Billing & Settlement.
                </p>
              </>
            )}
            <ul className="divide-y divide-zinc-800">
              {cart.map((c, i) => (
                <li className="flex items-center gap-2 py-3" key={c.key}>
                  <div className="flex-1">
                    <strong>{c.name}</strong>
                    <small className="block text-zinc-400">
                      {c.line.item_notes}
                      {quote.quote?.items?.[i] &&
                        ` | ${npr(quote.quote.items[i].line_total)}`}
                    </small>
                  </div>
                  <input
                    aria-label={`Quantity ${c.name}`}
                    type="number"
                    min={1}
                    max={100}
                    required
                    className={`${field} w-20`}
                    value={c.line.quantity}
                    onChange={(e) =>
                      setCart((rows) =>
                        rows.map((r) =>
                          r.key === c.key
                            ? {
                                ...r,
                                line: {
                                  ...r.line,
                                  quantity: Number(e.target.value),
                                },
                              }
                            : r,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className={button}
                    onClick={() =>
                      setCart((rows) => rows.filter((r) => r.key !== c.key))
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {!cart.length && (
              <p className="py-4 text-zinc-400">Choose menu items to start.</p>
            )}
            {quote.error && (
              <p role="alert" className="text-red-400">
                {quote.error}
              </p>
            )}
            {quote.loading && <p>Calculating total...</p>}
            {quote.quote && (
              <dl className="space-y-1">
                {[
                  ["Subtotal", quote.quote.subtotal],
                  ["Discount", quote.quote.discount_amount],
                  ["Service charge", quote.quote.service_charge_amount],
                  ["Included VAT", quote.quote.vat_included_amount],
                  ["Rounding savings", quote.quote.cash_round_down_savings],
                  [
                    appending ? "Updated order total" : "Total",
                    quote.quote.total_payable,
                  ],
                ].map(([k, v]) => (
                  <div className="flex justify-between" key={k}>
                    <dt>{k}</dt>
                    <dd>{npr(v)}</dd>
                  </div>
                ))}
              </dl>
            )}
            <button
              className={`${primary} w-full`}
              disabled={
                !session.enabled ||
                !meta?.accepting_orders ||
                !meta.permissions.orders ||
                command.busy ||
                command.hasPending ||
                !quote.quote ||
                (appending && (!target.order || !activeOrder(target.order)))
              }
            >
              {command.busy
                ? "Saving..."
                : appending
                  ? "Add round to order"
                  : "Place order"}
            </button>
          </form>
        </div>
      )}
      <PosOrderRegister
        session={session}
        onSelect={(o) => {
          setViewId(o.id);
          setActionReason("");
        }}
      />
      {configure && (
        <PosProductPicker
          key={configure.id}
          product={configure}
          products={menu.products}
          onAdd={(c) => setCart((rows) => [...rows, c])}
          onClose={() => setConfigure(null)}
        />
      )}
      {viewId && (
        <PosDialog
          title={viewed.order?.order_number || "Order details"}
          onClose={() => setViewId(null)}
        >
          {viewed.loading && <p>Loading order...</p>}
          {viewed.error && <p role="alert">{viewed.error}</p>}
          {viewed.order && (
            <div className="space-y-4">
              <p>
                {viewed.order.customer_name} |{" "}
                {viewed.order.table_number || viewed.order.fulfillment_type} |{" "}
                {viewed.order.status}
              </p>
              <OrderItems order={viewed.order} />
              <OrderTotals order={viewed.order} />
              <div className="flex flex-wrap gap-2">
                <button
                  className={button}
                  onClick={() => void print(viewed.order!)}
                >
                  Print token
                </button>
                {meta?.permissions.billing && (
                  <button
                    className={primary}
                    onClick={() => openBilling(viewed.order!)}
                  >
                    Billing & settlement
                  </button>
                )}
                {activeOrder(viewed.order) && (
                  <button
                    className={button}
                    onClick={() => {
                      selectRunning(posOrderToOrder(viewed.order!));
                      setViewId(null);
                    }}
                  >
                    Add food
                  </button>
                )}
                {meta?.permissions.kitchen && nextStatus(viewed.order) && (
                  <button
                    className={button}
                    disabled={command.busy}
                    onClick={() =>
                      void runAction(viewed.order!, "transition", {
                        status: nextStatus(viewed.order!),
                      })
                    }
                  >
                    {statusLabel[nextStatus(viewed.order)]}
                  </button>
                )}
                {meta?.permissions.orders && (
                  <button
                    className={button}
                    disabled={command.busy}
                    onClick={() => void runAction(viewed.order!, "call", {})}
                  >
                    Call token
                  </button>
                )}
              </div>
              {meta?.permissions.discount && activeOrder(viewed.order) && (
                <div className="space-y-2">
                  <label>
                    Reason for cancellation / removing an item
                    <input
                      className={field}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                    />
                  </label>
                  <button
                    className={button}
                    disabled={command.busy || !actionReason.trim()}
                    onClick={() =>
                      void runAction(viewed.order!, "transition", {
                        status: "CANCELLED",
                        reason: actionReason,
                      })
                    }
                  >
                    Cancel order
                  </button>
                  {!viewed.order.billed_at &&
                    Number(viewed.order.paid_amount) === 0 &&
                    Number(viewed.order.credit_amount) === 0 &&
                    ["PENDING", "ACCEPTED"].includes(viewed.order.status) &&
                    viewed.order.items.filter((i) => !i.is_voided).length > 1 &&
                    viewed.order.items
                      .filter(
                        (i) => !i.is_voided && i.kitchen_status === "WAITING",
                      )
                      .map((i) => (
                        <button
                          className={button}
                          key={i.id}
                          disabled={command.busy || !actionReason.trim()}
                          onClick={() =>
                            void runAction(viewed.order!, "void", {
                              item_id: i.id,
                              reason: actionReason,
                            })
                          }
                        >
                          Remove {i.product_name}
                        </button>
                      ))}
                </div>
              )}
              {command.error && (
                <p role="alert" className="text-red-400">
                  {command.error}
                </p>
              )}
            </div>
          )}
        </PosDialog>
      )}
    </div>
  );
}
