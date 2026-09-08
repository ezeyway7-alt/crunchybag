import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Archive,
  Image as ImageIcon,
  Check,
  UploadCloud,
  SlidersHorizontal,
  FolderPlus,
  Layers,
  Sparkles,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Product, Category, ProductVariant } from "../../types";
import { formatNPR } from "../../lib/utils";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";
import { Badge } from "../common/Badge";

export const StaffCatalogManager: React.FC = () => {
  const { products, categories, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New Category Modal
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === "ALL") return true;
    return p.categoryId === selectedCategory;
  });

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      title: "Product Catalog Updated",
      description: `Draft revision saved for "${editingProduct?.name}". Remember to publish.`,
      type: "success",
    });
    setIsEditProductModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-white dark:bg-[#1A1A1E] text-zinc-950 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Products & Variants ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "categories"
                ? "bg-white dark:bg-[#1A1A1E] text-zinc-950 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Categories & Rails ({categories.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "products" ? (
            <Button
              size="sm"
              variant="primary"
              className="font-bold text-xs"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingProduct(products[0]);
                setIsEditProductModalOpen(true);
              }}
            >
              Add Product
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              className="font-bold text-xs"
              leftIcon={<FolderPlus className="h-4 w-4" />}
              onClick={() => setIsNewCategoryModalOpen(true)}
            >
              New Category
            </Button>
          )}
        </div>
      </div>

      {activeTab === "products" ? (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-amber-500 text-black font-bold"
                  : "bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === c.id
                    ? "bg-amber-500 text-black font-bold"
                    : "bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Products Table */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-[#18181B] border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Product & Media</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Base Price</th>
                    <th className="px-5 py-3.5">Variants</th>
                    <th className="px-5 py-3.5">Modifiers</th>
                    <th className="px-5 py-3.5">Delivery</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {filteredProducts.map((p) => {
                    const category = categories.find((c) => c.id === p.categoryId);

                    return (
                      <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800"
                            />
                            <div>
                              <p className="font-bold text-sm text-zinc-900 dark:text-white">
                                {p.name}
                              </p>
                              <div className="flex gap-1 mt-0.5">
                                {p.dietary.map((d) => (
                                  <span key={d} className="text-[10px] text-zinc-400">
                                    #{d}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 font-medium text-zinc-600 dark:text-zinc-300">
                          {category?.name || "General"}
                        </td>

                        <td className="px-5 py-3.5 font-mono font-bold text-zinc-950 dark:text-amber-400">
                          {formatNPR(p.basePrice)}
                        </td>

                        <td className="px-5 py-3.5">
                          <Badge variant="outline" size="sm">
                            {p.variants.length} Size{p.variants.length > 1 ? "s" : ""}
                          </Badge>
                        </td>

                        <td className="px-5 py-3.5">
                          <Badge variant="outline" size="sm">
                            {p.modifierGroups.length} Group{p.modifierGroups.length > 1 ? "s" : ""}
                          </Badge>
                        </td>

                        <td className="px-5 py-3.5">
                          <Badge variant={p.isDeliveryEligible ? "success" : "neutral"} size="sm">
                            {p.isDeliveryEligible ? "Eligible" : "Counter Only"}
                          </Badge>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenEdit(p)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Categories Management View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="p-4 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {cat.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {products.filter((p) => p.categoryId === cat.id).length} Products assigned
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    addToast({
                      title: "Category Archived",
                      description: `Category "${cat.name}" moved to archives.`,
                      type: "info",
                    })
                  }
                >
                  <Archive className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Product & Variants Modal */}
      {editingProduct && (
        <Modal
          isOpen={isEditProductModalOpen}
          onClose={() => setIsEditProductModalOpen(false)}
          title={`Edit Product: ${editingProduct.name}`}
          description="Configure base pricing, variants, modifier rules, and gallery assets"
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveProduct} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Product Display Name"
                defaultValue={editingProduct.name}
                required
              />
              <Input
                label="Base Price (NPR)"
                type="number"
                defaultValue={editingProduct.basePrice}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Menu Description
              </label>
              <textarea
                defaultValue={editingProduct.description}
                rows={2}
                className="w-full p-3 text-sm bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Media Gallery Dropzone Component */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Media Gallery (Multi-Image Dropzone)
              </label>
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-4 text-center hover:border-amber-500 transition-colors cursor-pointer bg-zinc-50 dark:bg-zinc-900/40">
                <UploadCloud className="h-8 w-8 text-amber-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Drag and drop food photography or click to upload
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Supports WEBP, PNG, JPG up to 10MB. 16:9 ratio recommended.
                </p>
              </div>

              {/* Gallery previews with Primary Image tag */}
              <div className="flex gap-2 pt-1">
                {editingProduct.images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-black text-[9px] font-extrabold text-center">
                        PRIMARY
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Variants Builder Preview */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Size & Serving Variants
                </label>
                <button
                  type="button"
                  className="text-xs text-amber-500 font-semibold hover:underline cursor-pointer"
                >
                  + Add Variant Tier
                </button>
              </div>

              <div className="space-y-2">
                {editingProduct.variants.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs"
                  >
                    <span className="font-bold">{v.name}</span>
                    <span className="font-mono text-amber-500 font-bold">{formatNPR(v.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditProductModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="font-bold">
                Save Changes to Draft
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Category Modal */}
      <Modal
        isOpen={isNewCategoryModalOpen}
        onClose={() => setIsNewCategoryModalOpen(false)}
        title="Create New Menu Category"
        description="Add a top-level category rail for customer ordering and POS classification"
      >
        <div className="space-y-4 py-2">
          <Input
            label="Category Name"
            placeholder="e.g. Artisanal Desserts"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsNewCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="font-bold"
              onClick={() => {
                addToast({
                  title: "Category Created",
                  description: `"${newCatName || "New Category"}" added to catalog drafts.`,
                  type: "success",
                });
                setIsNewCategoryModalOpen(false);
                setNewCatName("");
              }}
            >
              Create Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
