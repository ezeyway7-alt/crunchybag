import React, { useState, useMemo } from "react";
import { Search, Sparkles, SlidersHorizontal, ArrowRight, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Product } from "../../types";
import { Modal } from "../common/Modal";
import { formatNPR } from "../../lib/utils";

interface InstantSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const InstantSearchModal: React.FC<InstantSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const { products, categories } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesText =
        searchTerm.trim() === "" ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dietary.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = !selectedCategory || p.categoryId === selectedCategory;

      return matchesText && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      position="top"
      showCloseButton={false}
      className="h-[540px] max-h-[85vh] flex flex-col border border-zinc-300 dark:border-zinc-800 shadow-2xl overflow-hidden"
      contentClassName="p-0 flex-1 flex flex-col min-h-0 overflow-hidden"
    >
      {/* Search Input Header */}
      <div className="relative flex items-center px-4 sm:px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] shrink-0">
        <Search className="h-5 w-5 text-amber-500 shrink-0 mr-3" />
        <input
          autoFocus
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search burgers, tenders, truffle fries, shakes, vegan..."
          className="w-full text-base sm:text-lg bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none pr-16"
        />
        <div className="absolute right-3.5 flex items-center gap-1.5">
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>
      </div>

      {/* Quick Category Filters Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-4 sm:px-5 py-2.5 bg-zinc-50/80 dark:bg-[#161619] border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
            !selectedCategory
              ? "bg-amber-500 text-black border-amber-600"
              : "bg-white dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          }`}
        >
          All Items
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCategory === c.id
                ? "bg-amber-500 text-black border-amber-600"
                : "bg-white dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Search Results List (Fixed Container: does not jitter or resize modal) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-3 space-y-2">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => {
                onSelectProduct(product);
                onClose();
              }}
              className="flex items-center justify-between p-2.5 sm:p-3 bg-zinc-50/70 dark:bg-[#18181B] hover:bg-amber-500/10 dark:hover:bg-amber-500/10 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-12 h-12 object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 pl-3">
                <span className="font-mono font-bold text-sm text-zinc-900 dark:text-amber-400">
                  {formatNPR(product.basePrice)}
                </span>
                <div className="w-7 h-7 bg-zinc-200 dark:bg-zinc-800 group-hover:bg-amber-500 group-hover:text-black flex items-center justify-center transition-colors">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-10 text-center space-y-3">
            <Sparkles className="h-8 w-8 text-amber-500 mx-auto opacity-70" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-zinc-900 dark:text-white">
                No direct matches for "{searchTerm}"
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Try searching for <strong>"Golden"</strong>, <strong>"Truffle"</strong>, or <strong>"Shakes"</strong>.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                onClick={() => setSearchTerm("Golden")}
                className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500/20 text-xs font-bold rounded text-amber-600 dark:text-amber-400 cursor-pointer"
              >
                Golden Beast
              </button>
              <button
                onClick={() => setSearchTerm("Truffle")}
                className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500/20 text-xs font-bold rounded text-amber-600 dark:text-amber-400 cursor-pointer"
              >
                Truffle Smash
              </button>
              <button
                onClick={() => setSearchTerm("Tenders")}
                className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500/20 text-xs font-bold rounded text-amber-600 dark:text-amber-400 cursor-pointer"
              >
                Hot Tenders
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stable Bottom Bar */}
      <div className="px-4 sm:px-5 py-2.5 bg-zinc-100/70 dark:bg-[#0E0E10] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
        <span>
          <strong className="text-zinc-900 dark:text-zinc-200">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "item" : "items"} available
        </span>
        <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider">
          Click an item to view recipe & order
        </span>
      </div>
    </Modal>
  );
};
