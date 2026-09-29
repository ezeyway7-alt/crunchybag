import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { PosSession, usePosCommand } from "../../lib/posApi";

// Configuration lives in the existing modal; the original floor cards stay unchanged.
export function PosTableManager({ session, onClose }: { session: PosSession; onClose: () => void }) {
  const command = usePosCommand(session);
  const groups = session.meta?.table_groups || [];
  const tables = [...(session.meta?.tables || []), ...(session.meta?.inactive_tables || [])];
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [tableId, setTableId] = useState('');
  const [label, setLabel] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [section, setSection] = useState(String(groups[0]?.id || ''));
  const [active, setActive] = useState(true);
  const disabled = !session.meta?.permissions.orders || command.busy || command.hasPending;
  const input = "w-full h-9 px-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs focus:outline-none focus:border-amber-500";
  const button = "px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs disabled:opacity-50";
  return <Modal isOpen onClose={onClose} title="Manage Floors & Tables" maxWidth="lg">
    <div className="space-y-4 text-xs">
      {command.error && <p role="alert" className="text-rose-500">{command.error}</p>}
      {command.hasPending && <button className={button} disabled={command.busy} onClick={() => command.recover()}>Recover pending save</button>}
      <form className="space-y-2" onSubmit={async e => {
        e.preventDefault(); if (disabled) return;
        const result = await command.run(groupId ? `table-groups/${groupId}/` : 'table-groups/', { name: groupName.trim() });
        if (result) { setGroupId(''); setGroupName(''); setSection(String(result.id)); }
      }}>
        <h3 className="font-bold">Floor / group</h3>
        <select aria-label="Edit floor or group" className={input} value={groupId} onChange={e => { setGroupId(e.target.value); setGroupName(groups.find(g => String(g.id) === e.target.value)?.name || ''); }}>
          <option value="">Create a group</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input aria-label="Floor or group name" required maxLength={64} className={input} placeholder="Floor or group name" value={groupName} onChange={e => setGroupName(e.target.value)} />
        <button className={button} disabled={disabled}>{groupId ? 'Save group' : 'Add group'}</button>
      </form>
      <form className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4" onSubmit={async e => {
        e.preventDefault(); if (disabled) return;
        const result = await command.run(tableId ? `tables/${tableId}/` : 'tables/', { table_number: label.trim(), capacity, group_id: Number(section), is_active: active });
        if (result) { setTableId(''); setLabel(''); setCapacity(4); setActive(true); }
      }}>
        <h3 className="font-bold">Table</h3>
        <select aria-label="Edit table" className={input} value={tableId} onChange={e => {
          setTableId(e.target.value); const table = tables.find(t => String(t.id) === e.target.value);
          setLabel(table?.table_number || ''); setCapacity(table?.capacity || 4);
          setSection(String(groups.find(g => g.name === table?.section)?.id || groups[0]?.id || ''));
          setActive(!table || !('is_active' in table) || table.is_active);
        }}><option value="">Create a table</option>{tables.map(t => <option key={t.id} value={t.id}>{t.section} / {t.table_number}</option>)}</select>
        <select aria-label="Table group" required className={input} value={section} onChange={e => setSection(e.target.value)}>
          <option value="">Select a group</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input aria-label="Table label" required maxLength={32} className={input} placeholder="Table label" value={label} onChange={e => setLabel(e.target.value)} />
        <label className="block">Seats<input aria-label="Seats" type="number" min={1} max={1000} required className={input} value={capacity} onChange={e => setCapacity(Number(e.target.value))} /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active table</label>
        <button className={button} disabled={disabled || !section}>{tableId ? 'Save table' : 'Add table'}</button>
      </form>
    </div>
  </Modal>;
}
