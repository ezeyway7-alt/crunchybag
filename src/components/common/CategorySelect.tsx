import { extractErrorMessage } from "../../lib/api";
import React, { useEffect, useId, useRef, useState } from "react";
import { X, ChevronDown, Check, Loader2, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";

export function CategorySelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { categories, createCategory, deleteCategory, addToast } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();

  // Show active categories (plus selected if archived)
  const visibleCategories = categories.filter(c => !c.isArchived || String(c.id) === String(value));
  const selected = categories.find(c => String(c.id) === String(value));
  const matches = visibleCategories.filter(c => c.name.toLowerCase().includes(query.trim().toLowerCase()));
  const canCreate = !!query.trim() && !visibleCategories.some(c => c.name.toLowerCase() === query.trim().toLowerCase());
  const count = matches.length + Number(canCreate);

  useEffect(() => {
    list.current?.querySelectorAll('[role="option"]')[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = async (index: number) => {
    if (index < matches.length) {
      const category = matches[index];
      if (category) {
        onChange(String(category.id));
      }
      setQuery("");
      setOpen(false);
      input.current?.focus();
    } else if (canCreate && !isCreating) {
      const catName = query.trim();
      setIsCreating(true);
      try {
        const created = await createCategory(catName);
        if (created?.id) {
          onChange(String(created.id));
          addToast?.({
            title: "Category Created",
            description: `"${created.name || catName}" created and selected.`,
            type: "success",
          });
        }
      } catch (err: any) {
        addToast?.({
          title: "Category could not be created",
          description: extractErrorMessage(err),
          type: "error",
        });
      } finally {
        setIsCreating(false);
        setQuery("");
        setOpen(false);
        input.current?.focus();
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, cat: { id: string; name: string }) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId) return;

    setDeletingId(cat.id);
    try {
      if (String(value) === String(cat.id)) {
        onChange("");
      }
      await deleteCategory(cat.id);
      addToast?.({
        title: "Category Deleted",
        description: `"${cat.name}" has been completely removed.`,
        type: "success",
      });
    } catch (err: any) {
      addToast?.({
        title: "Could not delete category",
        description: extractErrorMessage(err),
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="relative"
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <div className="flex items-center border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-amber-500">
        <input
          ref={input}
          role="combobox"
          aria-label="Category"
          aria-expanded={open}
          aria-controls={id}
          aria-autocomplete="list"
          aria-activedescendant={open && count ? `${id}-${active}` : undefined}
          className="w-full min-w-0 bg-transparent p-2 text-xs outline-none"
          placeholder={selected ? selected.name : "Search or create category"}
          value={query}
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={e => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActive(!open ? (e.key === "ArrowDown" ? 0 : Math.max(0, count - 1)) : (active + (e.key === "ArrowDown" ? 1 : -1) + count) % (count || 1));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              if (open && count) choose(active);
              else setOpen(true);
            }
            if (e.key === "Escape") {
              e.stopPropagation();
              setOpen(false);
              setActive(0);
            }
            if (e.key === "Tab") setOpen(false);
          }}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear selected category"
            onClick={() => {
              onChange("");
              setQuery("");
              input.current?.focus();
            }}
            className="p-2 text-zinc-400 hover:text-zinc-200"
          >
            <X size={14} />
          </button>
        )}
        <button
          type="button"
          aria-label="Toggle categories"
          onClick={() => {
            input.current?.focus();
            setOpen(!open);
          }}
          className="p-2 text-zinc-400 hover:text-zinc-200"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {open && (
        <div className="absolute z-30 w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xl">
          <div id={id} role="listbox" ref={list} className="max-h-56 overflow-y-auto">
            {matches.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center group/item transition-colors ${
                  active === i ? "bg-amber-500 text-black font-semibold" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <div
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={String(c.id) === String(value)}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => choose(i)}
                  className="flex-1 cursor-pointer p-2 text-xs flex items-center justify-between min-w-0"
                >
                  <span className="truncate">
                    {c.name}
                    {c.isArchived ? " (inactive)" : ""}
                  </span>
                  {String(c.id) === String(value) && (
                    <Check size={14} className={active === i ? "text-black" : "text-amber-500"} />
                  )}
                </div>
                <button
                  type="button"
                  title={`Delete "${c.name}" category`}
                  aria-label={`Delete ${c.name}`}
                  className={`p-2 transition-colors ${
                    active === i
                      ? "text-black/70 hover:text-black"
                      : "text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10"
                  }`}
                  onMouseDown={e => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={e => handleDelete(e, c)}
                >
                  {deletingId === c.id ? (
                    <Loader2 size={13} className="animate-spin text-rose-500" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>
            ))}

            {canCreate && (
              <div
                id={`${id}-${matches.length}`}
                role="option"
                aria-selected={false}
                onMouseEnter={() => setActive(matches.length)}
                onMouseDown={e => e.preventDefault()}
                onClick={() => choose(matches.length)}
                className={`p-2 cursor-pointer flex items-center justify-between text-xs font-semibold ${
                  active === matches.length
                    ? "bg-amber-500 text-black"
                    : "text-amber-500 hover:bg-amber-500/10"
                }`}
              >
                <span>+ Create “{query.trim()}”</span>
                {isCreating && <Loader2 size={12} className="animate-spin" />}
              </div>
            )}

            {!count && <p className="p-2 text-zinc-500 text-xs">Type a category name to create one.</p>}
          </div>
          <p className="p-2 text-[10px] text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
            ↑ ↓ to navigate · Enter to select · Esc to close
          </p>
        </div>
      )}
    </div>
  );
}
