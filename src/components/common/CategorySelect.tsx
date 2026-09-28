import React, { useEffect, useId, useRef, useState } from "react";
import { X, ChevronDown, Check, Plus } from "lucide-react";
import { useApp } from "../../context/AppContext";

interface CategorySelectProps {
  value: string;
  onChange: (id: string) => void;
  onPendingTextChange?: (text: string) => void;
  className?: string;
  placeholder?: string;
}

export function CategorySelect({
  value,
  onChange,
  onPendingTextChange,
  className = "",
  placeholder = "Search or create category",
}: CategorySelectProps) {
  const { categories, createCategory, setCategoryArchived } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();

  // Find currently selected category (handling string vs number IDs)
  const selected = categories.find((c) => String(c.id) === String(value));

  // Filter matching categories
  const trimmed = query.trim().toLowerCase();
  const matches = trimmed
    ? categories.filter((c) => c.name.toLowerCase().includes(trimmed))
    : categories;

  const exactMatchExists = categories.some(
    (c) => c.name.toLowerCase() === trimmed
  );
  const canCreate = !!trimmed && !exactMatchExists;
  const count = matches.length + (canCreate ? 1 : 0);

  // Auto-scroll active option into view for keyboard navigation
  useEffect(() => {
    if (open) {
      listRef.current
        ?.querySelectorAll('[role="option"]')
        [active]?.scrollIntoView({ block: "nearest" });
    }
  }, [active, open]);

  const choose = async (index: number) => {
    const category = matches[index];
    if (category) {
      if (category.isArchived) setCategoryArchived(category.id, false);
      onChange(String(category.id));
      setQuery("");
      onPendingTextChange?.("");
      setOpen(false);
      inputRef.current?.blur();
    } else if (canCreate || trimmed) {
      const nameToCreate = query.trim();
      try {
        const created = await createCategory(nameToCreate);
        if (created && created.id) {
          onChange(String(created.id));
        }
      } catch (err) {
        console.error("Failed to create category:", err);
      }
      setQuery("");
      onPendingTextChange?.("");
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleBlur = async (e: React.FocusEvent<HTMLDivElement>) => {
    // If focus moves outside the combobox container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setOpen(false);
      setIsFocused(false);

      const text = query.trim();
      if (text) {
        // Check if there is an exact or near match
        const exact = categories.find(
          (c) => c.name.toLowerCase() === text.toLowerCase()
        );
        if (exact) {
          if (exact.isArchived) setCategoryArchived(exact.id, false);
          onChange(String(exact.id));
          setQuery("");
          onPendingTextChange?.("");
        } else {
          // User typed a new category and clicked outside/saved: auto-create it!
          try {
            const created = await createCategory(text);
            if (created && created.id) {
              onChange(String(created.id));
            }
          } catch (err) {
            console.error("Auto-create on blur failed:", err);
          }
          setQuery("");
          onPendingTextChange?.("");
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    setActive(0);
    onPendingTextChange?.(val);

    // If typed value exactly matches an existing category, pre-select it
    if (val.trim()) {
      const exact = categories.find(
        (c) => c.name.toLowerCase() === val.trim().toLowerCase()
      );
      if (exact) {
        onChange(String(exact.id));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
      } else if (count > 0) {
        setActive((prev) => (prev + 1) % count);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(Math.max(0, count - 1));
      } else if (count > 0) {
        setActive((prev) => (prev - 1 + count) % count);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && count > 0) {
        choose(active);
      } else if (query.trim()) {
        choose(matches.length);
      } else {
        setOpen(true);
      }
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
      setActive(0);
    } else if (e.key === "Tab") {
      if (open && count > 0 && query.trim()) {
        choose(active);
      }
      setOpen(false);
    }
  };

  const displayInputValue = isFocused ? query : selected ? selected.name : query;

  return (
    <div className={`relative ${className}`} onBlur={handleBlur}>
      <div className="flex items-center border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus-within:ring-1 focus-within:ring-amber-500 focus-within:border-amber-500 transition-colors">
        <input
          ref={inputRef}
          role="combobox"
          aria-label="Category"
          aria-expanded={open}
          aria-controls={id}
          aria-autocomplete="list"
          aria-activedescendant={open && count ? `${id}-${active}` : undefined}
          className="w-full min-w-0 bg-transparent px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-medium outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          placeholder={selected ? selected.name : placeholder}
          value={displayInputValue}
          onFocus={() => {
            setIsFocused(true);
            setOpen(true);
            setActive(0);
          }}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />

        {value && (
          <button
            type="button"
            aria-label="Clear selected category"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setQuery("");
              onPendingTextChange?.("");
              inputRef.current?.focus();
            }}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            title="Clear category"
          >
            <X size={14} />
          </button>
        )}

        <button
          type="button"
          aria-label="Toggle categories"
          onClick={() => {
            inputRef.current?.focus();
            setOpen(!open);
          }}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          title="Toggle dropdown"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 shadow-xl rounded-none">
          <div
            id={id}
            role="listbox"
            ref={listRef}
            className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60"
          >
            {matches.map((c, i) => {
              const isSelected = String(c.id) === String(value);
              const isActive = active === i;
              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between text-xs px-2.5 py-2 cursor-pointer transition-colors ${
                    isActive
                      ? "bg-amber-500 text-black font-bold"
                      : isSelected
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                      : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="truncate">{c.name}</span>
                    {c.isArchived && (
                      <span className="text-[10px] opacity-75 font-normal">
                        (inactive · select to restore)
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={13} className="shrink-0" />}
                </div>
              );
            })}

            {canCreate && (
              <div
                id={`${id}-${matches.length}`}
                role="option"
                aria-selected={false}
                onMouseEnter={() => setActive(matches.length)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(matches.length)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-2 cursor-pointer font-bold ${
                  active === matches.length
                    ? "bg-amber-500 text-black"
                    : "text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/15"
                }`}
              >
                <Plus size={13} />
                <span>Create category “{query.trim()}”</span>
              </div>
            )}

            {!count && (
              <p className="p-2.5 text-xs text-zinc-500">
                Type a category name to create one.
              </p>
            )}
          </div>
          <p className="px-2.5 py-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            ↑ ↓ to navigate · Enter to select/create · Esc to close
          </p>
        </div>
      )}
    </div>
  );
}
