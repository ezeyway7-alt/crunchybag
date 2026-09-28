import React, { useState } from "react";
import { Product } from "../../types";
import { PosLine, npr } from "../../lib/posApi";
import { PosDialog, field, primary } from "./PosShared";

export interface CartEntry {
  key: string;
  name: string;
  line: PosLine;
}
const initial = (p: Product, quantity = 1): PosLine => ({
  product_id: p.id,
  variant_id:
    p.variants.find((v) => v.isDefault)?.id || p.variants[0]?.id || null,
  quantity,
  modifier_option_ids: p.modifierGroups.flatMap((g) =>
    g.options.filter((o) => o.isDefault).map((o) => o.id),
  ),
});
function Choices({
  product,
  line,
  change,
}: {
  product: Product;
  line: PosLine;
  change: (line: PosLine) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold">{product.name}</h3>
      {product.variants.length > 1 && (
        <label>
          Variant
          <select
            className={field}
            value={line.variant_id || ""}
            onChange={(e) =>
              change({ ...line, variant_id: e.target.value || null })
            }
          >
            {product.variants.map((v) => (
              <option value={v.id} key={v.id}>
                {v.name} | {npr(v.price)}
              </option>
            ))}
          </select>
        </label>
      )}
      {product.modifierGroups.map((g) => (
        <fieldset key={g.id} className="border border-zinc-700 p-2">
          <legend>
            {g.name} (
            {g.required
              ? `required, at least ${Math.max(1, g.minSelections)}`
              : "optional"}
            ; max {g.maxSelections})
          </legend>
          {g.options.map((o) => (
            <label className="block py-1" key={o.id}>
              <input
                type="checkbox"
                checked={line.modifier_option_ids.includes(o.id)}
                onChange={(e) =>
                  change({
                    ...line,
                    modifier_option_ids: e.target.checked
                      ? [...line.modifier_option_ids, o.id]
                      : line.modifier_option_ids.filter((id) => id !== o.id),
                  })
                }
              />{" "}
              {o.name} +{npr(o.priceDelta)}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
export function PosProductPicker({
  product,
  products,
  onAdd,
  onClose,
}: {
  key?: string | number;
  product: Product;
  products: Product[];
  onAdd: (entry: CartEntry) => void;
  onClose: () => void;
}) {
  const [line, setLine] = useState<PosLine>(() => ({
    ...initial(product),
    ...(product.isComboPackage
      ? {
          combo_selections: (product.comboItems || []).map((c) => {
            const p = products.find((p) => p.id === c.productId);
            return p
              ? initial(p, c.quantity)
              : {
                  product_id: c.productId,
                  quantity: c.quantity,
                  modifier_option_ids: [],
                };
          }),
        }
      : {}),
  }));
  const [error, setError] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const row of [line, ...(line.combo_selections || [])]) {
      const p = products.find((p) => p.id === row.product_id);
      for (const g of p?.modifierGroups || []) {
        const count = g.options.filter((o) =>
          row.modifier_option_ids.includes(o.id),
        ).length;
        if (
          count < Math.max(g.minSelections, g.required ? 1 : 0) ||
          count > g.maxSelections
        ) {
          setError(`Check selections for ${p?.name}: ${g.name}.`);
          return;
        }
      }
    }
    onAdd({ key: crypto.randomUUID(), name: product.name, line });
    onClose();
  };
  return (
    <PosDialog title={`Add ${product.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Choices product={product} line={line} change={setLine} />
        {line.combo_selections?.map((c, i) => {
          const p = products.find((p) => p.id === c.product_id);
          return (
            <div key={i} className="border-l border-amber-500 pl-3">
              <p>{c.quantity} included</p>
              {p ? (
                <Choices
                  product={p}
                  line={c}
                  change={(next) =>
                    setLine((l) => ({
                      ...l,
                      combo_selections: l.combo_selections?.map((v, j) =>
                        j === i ? next : v,
                      ),
                    }))
                  }
                />
              ) : (
                <p>{product.comboItems?.[i]?.productName}</p>
              )}
            </div>
          );
        })}
        <label className="block">
          Quantity
          <input
            type="number"
            min={1}
            max={100}
            required
            className={field}
            value={line.quantity}
            onChange={(e) =>
              setLine((l) => ({ ...l, quantity: Number(e.target.value) }))
            }
          />
        </label>
        <label className="block">
          Item notes
          <input
            maxLength={255}
            className={field}
            value={line.item_notes || ""}
            onChange={(e) =>
              setLine((l) => ({ ...l, item_notes: e.target.value }))
            }
          />
        </label>
        {error && (
          <p role="alert" className="text-red-400">
            {error}
          </p>
        )}
        <button className={primary}>Add to order</button>
      </form>
    </PosDialog>
  );
}
