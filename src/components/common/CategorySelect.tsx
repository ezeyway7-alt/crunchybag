import React, { useEffect, useId, useRef, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { useApp } from "../../context/AppContext";

export function CategorySelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { categories, createCategory, setCategoryArchived } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = categories.find(c => c.id === value);
  const matches = categories.filter(c => c.name.toLowerCase().includes(query.trim().toLowerCase()));
  const canCreate = !!query.trim() && !categories.some(c => c.name.toLowerCase() === query.trim().toLowerCase());
  const count = matches.length + Number(canCreate);
  useEffect(() => { list.current?.querySelectorAll('[role="option"]')[active]?.scrollIntoView({ block: "nearest" }); }, [active, open]);
  const choose = (index: number) => {
    const category = matches[index];
    if (category) { if (category.isArchived) setCategoryArchived(category.id, false); onChange(category.id); }
    else if (canCreate) onChange(createCategory(query).id);
    setQuery(""); setOpen(false); input.current?.focus();
  };
  return <div className="relative" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <div className="flex items-center border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-amber-500">
      <input ref={input} role="combobox" aria-label="Category" aria-expanded={open} aria-controls={id} aria-autocomplete="list" aria-activedescendant={open && count ? `${id}-${active}` : undefined}
        className="w-full min-w-0 bg-transparent p-2 text-xs outline-none" placeholder={selected ? selected.name : "Search or create category"} value={query}
        onFocus={() => { setOpen(true); setActive(0); }} onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onKeyDown={e => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setOpen(true); setActive(!open ? (e.key === "ArrowDown" ? 0 : Math.max(0, count - 1)) : (active + (e.key === "ArrowDown" ? 1 : -1) + count) % (count || 1)); }
          if (e.key === "Enter") { e.preventDefault(); if (open && count) choose(active); else setOpen(true); }
          if (e.key === "Escape") { e.stopPropagation(); setOpen(false); setActive(0); }
          if (e.key === "Tab") setOpen(false);
        }} />
      {value && <button type="button" aria-label="Clear selected category" onClick={() => { onChange(""); setQuery(""); input.current?.focus(); }} className="p-2"><X size={14} /></button>}
      <button type="button" aria-label="Toggle categories" onClick={() => { input.current?.focus(); setOpen(!open); }} className="p-2"><ChevronDown size={14} /></button>
    </div>
    {open && <div className="absolute z-30 w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xl">
      <div id={id} role="listbox" ref={list} className="max-h-56 overflow-y-auto">
        {matches.map((c, i) => <div key={c.id} className="flex items-center">
          <div id={`${id}-${i}`} role="option" aria-selected={c.id === value} onMouseEnter={() => setActive(i)} onMouseDown={e => e.preventDefault()} onClick={() => choose(i)} className={`flex-1 cursor-pointer p-2 ${active === i ? "bg-amber-500 text-black" : ""}`}>{c.name}{c.isArchived ? " (inactive · select to restore)" : ""}</div>
          <button type="button" aria-label={`${c.isArchived ? "Restore" : "Deactivate"} ${c.name}`} className="p-2" onClick={() => { setCategoryArchived(c.id, !c.isArchived); if (value === c.id && !c.isArchived) onChange(""); }}>{c.isArchived ? "+" : <X size={14} />}</button>
        </div>)}
        {canCreate && <div id={`${id}-${matches.length}`} role="option" aria-selected={false} onMouseEnter={() => setActive(matches.length)} onMouseDown={e => e.preventDefault()} onClick={() => choose(matches.length)} className={`p-2 cursor-pointer ${active === matches.length ? "bg-amber-500 text-black" : ""}`}>+ Create “{query.trim()}”</div>}
        {!count && <p className="p-2 text-zinc-500">Type a category name to create one.</p>}
      </div>
      <p className="p-2 text-[10px] text-zinc-500 border-t">↑ ↓ to navigate · Enter to select · Esc to close</p>
    </div>}
  </div>;
}
