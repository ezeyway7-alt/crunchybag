import React from "react";
import { Check, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { formatNPR } from "../../lib/utils";
import { Badge } from "../common/Badge";

export const StaffAvailabilityGrid: React.FC = () => {
  const { products, toggleProductAvailability, currentOutlet } = useApp();

  return (
    <div className="space-y-4">
      {/* Informative Banner */}
      <div className="p-4 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold flex items-center gap-2">
            <span>Branch Stock & 86ing: {currentOutlet.name}</span>
            <Badge variant="brand" size="sm">
              Live
            </Badge>
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Mark items in or out of stock instantly. Changes sync immediately to the online customer menu.
          </p>
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          Available: {products.filter((p) => p.isAvailable).length} / {products.length} Items
        </div>
      </div>

      {/* Grid of Products with Sharp Stock Switches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {products.map((product) => {
          const isAvail = product.isAvailable;

          return (
            <div
              key={product.id}
              className={`p-4 border transition-all flex items-center justify-between gap-3 ${
                isAvail
                  ? "bg-white dark:bg-[#121214] border-zinc-200 dark:border-zinc-800"
                  : "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className={`w-12 h-12 object-cover shrink-0 border ${
                    isAvail ? "border-zinc-200 dark:border-zinc-700" : "border-rose-500/40 grayscale"
                  }`}
                />
                <div className="min-w-0">
                  <h5 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                    {product.name}
                  </h5>
                  <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    {formatNPR(product.basePrice)}
                  </p>
                </div>
              </div>

              {/* Instant Toggle Control */}
              <button
                onClick={() => toggleProductAvailability(product.id)}
                className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isAvail
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 border-rose-500/40 hover:bg-rose-500/20"
                }`}
              >
                {isAvail ? (
                  <>
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>In Stock</span>
                  </>
                ) : (
                  <>
                    <X className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Sold Out (86)</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
