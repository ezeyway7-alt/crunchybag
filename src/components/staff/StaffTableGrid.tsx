import React, { useState } from "react";
import { Order } from "../../types";
import { apiClient } from "../../lib/api";
import {
  PosSession,
  PosOrder,
  usePosCommand,
  posOrderToOrder,
  npr,
  posPath,
  posError,
} from "../../lib/posApi";
import { button, primary, field } from "./PosShared";

interface Props {
  session: PosSession;
  orders: PosOrder[];
  onSelectTableForNewOrder: (tableId: string) => void;
  onSelectOngoingOrder: (order: Order) => void;
  onOpenBillingForOrder?: (order: Order) => void;
}
export const StaffTableGrid: React.FC<Props> = ({
  session,
  orders,
  onSelectTableForNewOrder,
  onSelectOngoingOrder,
  onOpenBillingForOrder,
}) => {
  const command = usePosCommand(session);
  const [manage, setManage] = useState(false);
  const [group, setGroup] = useState({ id: "", name: "" });
  const [table, setTable] = useState({
    id: "",
    table_number: "",
    capacity: "4",
    group_id: "",
    is_active: true,
  });
  const [loadError, setLoadError] = useState("");
  const openTable = async (id: number, billing = false) => {
    try {
      setLoadError("");
      const order =
        orders.find((o) => o.id === id) ||
        (await apiClient.get<PosOrder>(posPath(session.outlet, `${id}/`)));
      const mapped = posOrderToOrder(order, session.meta?.outlet_name);
      if (billing) onOpenBillingForOrder?.(mapped);
      else onSelectOngoingOrder(mapped);
    } catch (e) {
      setLoadError(posError(e));
    }
  };
  const [selectedGroup, setSelectedGroup] = useState("");
  const meta = session.meta;
  const tables = meta?.tables || [];
  const groups = meta?.table_groups || [];
  const occupied = tables.filter((t) => t.active_order_id).length;
  const saveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      await command.run(`table-groups/${group.id ? `${group.id}/` : ""}`, {
        name: group.name.trim(),
      })
    )
      setGroup({ id: "", name: "" });
  };
  const saveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      await command.run(`tables/${table.id ? `${table.id}/` : ""}`, {
        table_number: table.table_number.trim(),
        capacity: Number(table.capacity),
        group_id: Number(table.group_id),
        is_active: table.is_active,
      })
    )
      setTable((t) => ({ ...t, id: "", table_number: "", is_active: true }));
  };
  return (
    <section className="space-y-3 border border-zinc-800 bg-[#121214] p-3">
      <div className="flex flex-wrap justify-between gap-3 text-sm">
        <p>
          <span className="text-emerald-400">
            Available: {tables.length - occupied}
          </span>{" "}
          <span className="ml-4 text-amber-400">Occupied: {occupied}</span>
        </p>
        {meta?.permissions.orders && (
          <button className={button} onClick={() => setManage(!manage)}>
            {manage ? "Close configuration" : "Manage floors & tables"}
          </button>
        )}
      </div>
      {loadError && (
        <p role="alert" className="text-red-400">
          {loadError}
        </p>
      )}
      {command.error && (
        <p role="alert" className="text-red-400">
          {command.error}
        </p>
      )}
      {command.hasPending && (
        <button
          className={button}
          disabled={command.busy}
          onClick={() => void command.recover()}
        >
          Recover pending table change
        </button>
      )}
      {manage && (
        <div className="grid gap-4 border-y border-zinc-800 py-4 md:grid-cols-2">
          <form onSubmit={saveGroup} className="space-y-2">
            <h3 className="font-bold">
              {group.id ? "Rename group" : "Create floor / group"}
            </h3>
            <label>
              Group name
              <input
                required
                maxLength={64}
                className={field}
                placeholder="First floor"
                value={group.name}
                onChange={(e) =>
                  setGroup((g) => ({ ...g, name: e.target.value }))
                }
              />
            </label>
            <button
              className={primary}
              disabled={command.busy || command.hasPending}
            >
              Save group
            </button>
            {group.id && (
              <button
                type="button"
                className={button}
                onClick={() => setGroup({ id: "", name: "" })}
              >
                Cancel edit
              </button>
            )}
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <button
                  type="button"
                  className={button}
                  key={g.id}
                  onClick={() => setGroup({ id: String(g.id), name: g.name })}
                >
                  Edit {g.name}
                </button>
              ))}
            </div>
          </form>
          <form onSubmit={saveTable} className="space-y-2">
            <h3 className="font-bold">
              {table.id ? "Edit table" : "Add table"}
            </h3>
            <label>
              Floor / group
              <select
                required
                className={field}
                value={table.group_id}
                onChange={(e) =>
                  setTable((t) => ({ ...t, group_id: e.target.value }))
                }
              >
                <option value="">Choose a group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label>
                Table label
                <input
                  required
                  maxLength={32}
                  className={field}
                  placeholder="Window 1"
                  value={table.table_number}
                  onChange={(e) =>
                    setTable((t) => ({ ...t, table_number: e.target.value }))
                  }
                />
              </label>
              <label>
                Seats
                <input
                  required
                  type="number"
                  min={1}
                  max={1000}
                  className={field}
                  value={table.capacity}
                  onChange={(e) =>
                    setTable((t) => ({ ...t, capacity: e.target.value }))
                  }
                />
              </label>
            </div>
            <label className="block">
              <input
                type="checkbox"
                checked={table.is_active}
                onChange={(e) =>
                  setTable((t) => ({ ...t, is_active: e.target.checked }))
                }
              />{" "}
              Available for seating
            </label>
            <button
              className={primary}
              disabled={command.busy || command.hasPending || !groups.length}
            >
              Save table
            </button>
            {table.id && (
              <button
                type="button"
                className={button}
                onClick={() =>
                  setTable((t) => ({
                    ...t,
                    id: "",
                    table_number: "",
                    is_active: true,
                  }))
                }
              >
                Cancel edit
              </button>
            )}
          </form>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            {[
              ...tables.map((t) => ({ ...t, is_active: true })),
              ...(meta?.inactive_tables || []),
            ].map((t) => (
              <button
                key={t.id}
                className={button}
                disabled={!!t.active_order_id}
                onClick={() =>
                  setTable({
                    id: String(t.id),
                    table_number: t.table_number,
                    capacity: String(t.capacity),
                    group_id: String(
                      groups.find((g) => g.name === t.section)?.id || "",
                    ),
                    is_active: t.is_active,
                  })
                }
              >
                Edit {t.section} / {t.table_number}
                {!t.is_active && " (inactive)"}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button className={button} onClick={() => setSelectedGroup("")}>
          All floors
        </button>
        {groups.map((g) => (
          <button
            className={`${button} ${selectedGroup === g.name ? "border-amber-400 text-amber-400" : ""}`}
            key={g.id}
            onClick={() => setSelectedGroup(g.name)}
          >
            {g.name}
          </button>
        ))}
      </div>
      {!tables.length && (
        <p className="py-8 text-zinc-400">
          No tables configured. Create a floor or group, then add your tables.
        </p>
      )}
      {Array.from(new Set(tables.map((t) => t.section)))
        .filter((name) => !selectedGroup || name === selectedGroup)
        .map((name) => (
          <div key={name}>
            <h3 className="mb-2 font-bold">{name}</h3>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {tables
                .filter((t) => t.section === name)
                .map((t) => {
                  const active = orders.find((o) => o.id === t.active_order_id);
                  return (
                    <div
                      key={t.id}
                      className={`flex min-h-[110px] flex-col justify-between border p-2.5 text-xs ${t.active_order_id ? "border-amber-500/40 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/5"}`}
                    >
                      <div className="flex justify-between">
                        <strong>{t.table_number}</strong>
                        <span>{t.capacity} seats</span>
                      </div>
                      {t.active_order_id ? (
                        <>
                          <p className="my-2 text-amber-400">
                            {active
                              ? `${active.customer_name} | ${npr(active.total_payable)}`
                              : "Occupied"}
                          </p>
                          <div className="flex gap-1">
                            <button
                              className={`${button} flex-1 px-1`}
                              onClick={() => void openTable(t.active_order_id!)}
                            >
                              + Food
                            </button>
                            {onOpenBillingForOrder && (
                              <button
                                className={`${primary} px-1`}
                                onClick={() =>
                                  void openTable(t.active_order_id!, true)
                                }
                              >
                                Bill
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-emerald-400">Available</p>
                          <button
                            className={button}
                            onClick={() =>
                              onSelectTableForNewOrder(String(t.id))
                            }
                          >
                            + Start order
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
    </section>
  );
};
