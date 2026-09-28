import React, { useState, useMemo, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Star,
  Clock,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  Sparkles,
  Package,
  Layers,
  Upload,
  Link2,
  Check,
  Zap,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  Product,
  ModifierGroup,
  ModifierOption,
  ProductIngredientRecipe,
  DietaryTag,
  ComboPackageItem,
} from "../../types";
import { CategorySelect } from "../common/CategorySelect";
import { StaffTimePricing } from "../staff/StaffTimePricing";
import { formatNPR } from "../../lib/utils";

const SAMPLE_FOOD_PRESETS = [
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80", // Burger
  "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80", // Double smash
  "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80", // Fries
  "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=600&auto=format&fit=crop&q=80", // Momos
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80", // Pizza
  "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80", // Drink
];

export const AdminMenuManagerTab: React.FC = () => {
  const {
    products,
    catalogLoading, catalogError,
    categories,
    inventory,
    createProduct,
    updateProductFull,
    deleteProduct,
    toggleProductAvailability,
    addToast,
    timePricingSchedules,
    currentOutlet,
  } = useApp();

  React.useEffect(() => {
    if (catalogError) addToast({ title: "Menu unavailable", description: catalogError, type: "error" });
  }, [catalogError]);

  // Top level views:
  // "catalog" -> List standard individual menu items
  // "combos"  -> List packages & combos
  // "item_form"  -> Add / Edit menu item page
  // "combo_form" -> Add / Edit combo package page
  const [activeMainTab, setActiveMainTab] = useState<"items" | "combos" | "tiers">("items");
  const [viewMode, setViewMode] = useState<"list" | "item_form" | "combo_form">("list");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Quick Convert Modal State
  const [showQuickConvertModal, setShowQuickConvertModal] = useState(false);

  // Filters for items
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<string>("ALL");

  // File input refs for direct image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comboFileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // FORM STATES: REGULAR MENU ITEM
  // -------------------------------------------------------------
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formBasePrice, setFormBasePrice] = useState("");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formDietary, setFormDietary] = useState<DietaryTag[]>([]);
  const [formPrepTime, setFormPrepTime] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscountPercent, setFormDiscountPercent] = useState("0");
  const [formCalories, setFormCalories] = useState("");

  // 3 Distinct Channel Visibility Toggles
  const [formShowOnPos, setFormShowOnPos] = useState(true);
  const [formShowOnQr, setFormShowOnQr] = useState(true);
  const [formShowOnWeb, setFormShowOnWeb] = useState(true);
  const [formRequiresKitchen, setFormRequiresKitchen] = useState(true);

  // Linking to Inventory / Purchase Item (e.g. Cigarettes, Packed Drinks, Water, Beer)
  const [formLinkedInventoryId, setFormLinkedInventoryId] = useState<string>("");

  // Multiple Images with Main Image selection
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formMainImageIndex, setFormMainImageIndex] = useState<number>(0);

  // Dynamic Custom Modifier Sections (Section 3: Size, Bun, Cheese, Sauces, Addons etc.)
  const [formModifierSections, setFormModifierSections] = useState<ModifierGroup[]>([]);

  // Recipe / Ingredient Stock Deduction (Section 4)
  const [formRecipeIngredients, setFormRecipeIngredients] = useState<ProductIngredientRecipe[]>([]);

  // -------------------------------------------------------------
  // FORM STATES: COMBO PACKAGE BUILDER
  // -------------------------------------------------------------
  const [comboName, setComboName] = useState("");
  const [comboDescription, setComboDescription] = useState("");
  const [comboCategoryId, setComboCategoryId] = useState("");
  const [comboImages, setComboImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&auto=format&fit=crop&q=80",
  ]);
  const [comboMainImageIndex, setComboMainImageIndex] = useState(0);
  const [comboItems, setComboItems] = useState<ComboPackageItem[]>([]);
  const [comboDiscountType, setComboDiscountType] = useState<"percentage" | "fixed_price" | "amount_off">("percentage");
  const [comboDiscountValue, setComboDiscountValue] = useState("15"); // e.g. 15% or NPR 150
  const [comboShowOnPos, setComboShowOnPos] = useState(true);
  const [comboShowOnQr, setComboShowOnQr] = useState(true);
  const [comboShowOnWeb, setComboShowOnWeb] = useState(true);

  // -------------------------------------------------------------
  // DIRECT IMAGE UPLOAD HELPER (via FileReader)
  // -------------------------------------------------------------
  const handleFilesSelected = (files: FileList | null, isCombo = false) => {
    if (!files || files.length === 0) return;
    const readers: Promise<string>[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const promise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) resolve(e.target.result as string);
        };
        reader.readAsDataURL(file);
      });
      readers.push(promise);
    });

    Promise.all(readers).then((newImages) => {
      if (newImages.length === 0) return;
      if (isCombo) {
        setComboImages((prev) => [...prev, ...newImages]);
      } else {
        setFormImages((prev) => [...prev, ...newImages]);
      }
      addToast({
        title: "Image Uploaded",
        description: `${newImages.length} image(s) loaded directly from device`,
        type: "success",
      });
    });
  };

  // -------------------------------------------------------------
  // LINK TO INVENTORY / PURCHASE ITEM (e.g. Cigarettes, Drinks)
  // -------------------------------------------------------------
  const handleSelectLinkedInventoryItem = (invId: string) => {
    setFormLinkedInventoryId(invId);
    if (!invId) {
      setFormRecipeIngredients((prev) => prev.filter((item) => !item.id.startsWith("ing-direct-")));
      setFormRequiresKitchen(true);
      setFormPrepTime("");
      return;
    }

    const inv = inventory.find((i) => i.id === invId);
    if (!inv) return;

    // Auto-fill fields for retail items
    if (!formName.trim()) {
      setFormName(inv.name);
    }
    const cost = inv.costPerUnit || 0;
    setFormCostPrice(cost.toString());
    // Retail item like cigarettes or canned drinks don't require kitchen KDS
    setFormRequiresKitchen(false);
    setFormPrepTime("0");

    // Automatically set ingredient recipe so 1 unit is deducted on checkout
    setFormRecipeIngredients([
      {
        id: `ing-direct-${Date.now()}`,
        inventoryItemId: inv.id,
        inventoryItemName: inv.name,
        quantityRequired: 1,
        unit: inv.unit,
      },
    ]);

    addToast({
      title: "Linked to Inventory Item",
      description: `Mapped to "${inv.name}". 1 ${inv.unit} will auto-deduct upon sale.`,
      type: "success",
    });
  };

  // Quick Convert directly from Inventory item
  const handleQuickConvertInventoryItem = async (invItem: any, sellPrice: number) => {
    const payload: Omit<Product, "id"> = {
      name: invItem.name,
      categoryId: categories.find(c => !c.isArchived)?.id || "",
      basePrice: sellPrice,
      costPrice: invItem.costPerUnit,
      prepTimeMinutes: 1,
      description: `Direct counter purchase item: ${invItem.name} (${invItem.unit})`,
      images: [SAMPLE_FOOD_PRESETS[5]],
      mainImageIndex: 0,
      dietary: ["Chef's Choice"],
      isDeliveryEligible: true,
      isAvailable: true,
      showOnPos: true,
      showOnQr: true,
      isWebVisible: true,
      requiresKitchen: false, // direct retail counter
      isDirectInventoryItem: true,
      linkedInventoryItemId: invItem.id,
      variants: [
        {
          id: `var-${Date.now()}`,
          name: "Standard Pack / Can",
          price: sellPrice,
          isDefault: true,
        },
      ],
      modifierGroups: [],
      recipeIngredients: [
        {
          id: `ing-quick-${Date.now()}`,
          inventoryItemId: invItem.id,
          inventoryItemName: invItem.name,
          quantityRequired: 1,
          unit: invItem.unit,
        },
      ],
    };

    try { await createProduct(payload); } catch { return; }
    setShowQuickConvertModal(false);
    addToast({
      title: "Inventory Item Converted",
      description: `"${invItem.name}" is now on POS, QR, and Web menus at ${formatNPR(sellPrice)}.`,
      type: "success",
    });
  };

  // -------------------------------------------------------------
  // OPEN ADD / EDIT ITEM
  // -------------------------------------------------------------
  const handleOpenCreateNewItem = () => {
    setEditingProductId(null);
    setFormName("");
    setFormCategoryId("");
    setFormBasePrice("");
    setFormCostPrice("");
    setFormDietary([]);
    setFormPrepTime("");
    setFormDescription("");
    setFormDiscountPercent("0");
    setFormCalories("");
    setFormShowOnPos(true);
    setFormShowOnQr(true);
    setFormShowOnWeb(true);
    setFormRequiresKitchen(true);
    setFormLinkedInventoryId("");

    setFormImages([]);
    setFormMainImageIndex(0);

    setFormModifierSections([]);

    setFormRecipeIngredients([]);
    setViewMode("item_form");
  };

  const handleOpenEditItem = (p: Product) => {
    // If it's a combo package, open in combo form
    if (p.isComboPackage) {
      handleOpenEditCombo(p);
      return;
    }

    setEditingProductId(p.id);
    setFormName(p.name);
    setFormCategoryId(p.categoryId);
    setFormBasePrice(p.basePrice.toString());
    setFormCostPrice(p.costPrice?.toString() ?? "");
    setFormDietary(p.dietary || []);
    setFormPrepTime(p.prepTimeMinutes?.toString() ?? "");
    setFormDescription(p.description || "");
    setFormDiscountPercent((p.discountPercent || 0).toString());
    setFormCalories(p.calories?.toString() ?? "");
    setFormShowOnPos(p.showOnPos !== false);
    setFormShowOnQr(p.showOnQr !== false);
    setFormShowOnWeb(p.isWebVisible !== false);
    setFormRequiresKitchen(p.requiresKitchen !== false);
    setFormLinkedInventoryId(p.linkedInventoryItemId || "");

    setFormImages(p.images || []);
    setFormMainImageIndex(p.mainImageIndex || 0);

    setFormModifierSections(p.modifierGroups || []);
    setFormRecipeIngredients(p.recipeIngredients || []);

    setViewMode("item_form");
  };

  // -------------------------------------------------------------
  // OPEN ADD / EDIT COMBO PACKAGE
  // -------------------------------------------------------------
  const handleOpenCreateNewCombo = () => {
    setEditingProductId(null);
    setComboName("");
    setComboDescription("Value combo deal with curated selection of our finest items.");
    setComboCategoryId("");
    setComboImages([
      "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&auto=format&fit=crop&q=80",
    ]);
    setComboMainImageIndex(0);

    // Pre-select 2 popular items as starter
    const nonCombo = products.filter((p) => !p.isComboPackage);
    const item1 = nonCombo[0];
    const item2 = nonCombo[1];
    const starterItems: ComboPackageItem[] = [];
    if (item1) starterItems.push({ productId: item1.id, productName: item1.name, quantity: 1, unitPrice: item1.basePrice });
    if (item2) starterItems.push({ productId: item2.id, productName: item2.name, quantity: 1, unitPrice: item2.basePrice });

    setComboItems(starterItems);
    setComboDiscountType("percentage");
    setComboDiscountValue("15"); // 15% off
    setComboShowOnPos(true);
    setComboShowOnQr(true);
    setComboShowOnWeb(true);

    setViewMode("combo_form");
  };

  const handleOpenEditCombo = (p: Product) => {
    setEditingProductId(p.id);
    setComboName(p.name);
    setComboDescription(p.description || "");
    setComboCategoryId(p.categoryId || "cat-combos");
    setComboImages(p.images?.length ? p.images : [SAMPLE_FOOD_PRESETS[0]]);
    setComboMainImageIndex(p.mainImageIndex || 0);
    setComboItems(p.comboItems || []);
    setComboDiscountType(p.comboDiscountType || "fixed_price");
    setComboDiscountValue((p.comboDiscountValue ?? p.basePrice).toString());
    setComboShowOnPos(p.showOnPos !== false);
    setComboShowOnQr(p.showOnQr !== false);
    setComboShowOnWeb(p.isWebVisible !== false);

    setViewMode("combo_form");
  };

  // -------------------------------------------------------------
  // SAVE MENU ITEM HANDLER
  // -------------------------------------------------------------
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast({ title: "Product name required", type: "error" });
      return;
    }

    if (!formCategoryId) { addToast({ title: "Select a category", type: "error" }); return; }
    const bPrice = parseFloat(formBasePrice) || 0;
    const cPrice = formCostPrice === "" ? undefined : Number(formCostPrice);
    const pTime = parseInt(formPrepTime, 10) || 0;
    const disc = parseFloat(formDiscountPercent) || 0;
    const cal = formCalories === "" ? undefined : Number(formCalories);

    const sanitizedImages = formImages;
    const safeMainIndex =
      formMainImageIndex >= 0 && formMainImageIndex < sanitizedImages.length
        ? formMainImageIndex
        : 0;

    const payload: Omit<Product, "id"> = {
      name: formName.trim(),
      categoryId: formCategoryId,
      basePrice: bPrice,
      costPrice: cPrice,
      prepTimeMinutes: pTime,
      description: formDescription.trim(),
      images: sanitizedImages,
      mainImageIndex: safeMainIndex,
      dietary: formDietary,
      isDeliveryEligible: true,
      isAvailable: true,
      showOnPos: formShowOnPos,
      showOnQr: formShowOnQr,
      isWebVisible: formShowOnWeb,
      requiresKitchen: formRequiresKitchen,
      isDirectInventoryItem: !!formLinkedInventoryId,
      linkedInventoryItemId: formLinkedInventoryId || undefined,
      discountPercent: disc,
      calories: cal,
      variants: editingProductId && products.find(p => p.id === editingProductId)?.variants.length
        ? products.find(p => p.id === editingProductId)!.variants.map(v => ({ ...v, price: v.isDefault ? bPrice : v.price }))
        : [{ id: crypto.randomUUID(), name: "Standard", price: bPrice, isDefault: true }],
      modifierGroups: formModifierSections,
      recipeIngredients: formRecipeIngredients,
    };

    if (editingProductId) {
      try { await updateProductFull(editingProductId, payload); } catch { return; }
      addToast({
        title: "Product Updated",
        description: `"${formName}" updated successfully.`,
        type: "success",
      });
    } else {
      try { await createProduct(payload); } catch { return; }
      addToast({
        title: "Product Created",
        description: `"${formName}" added to catalog.`,
        type: "success",
      });
    }

    setViewMode("list");
  };

  // -------------------------------------------------------------
  // COMBO PRICING CALCULATIONS & SAVE
  // -------------------------------------------------------------
  const comboSumOriginal = useMemo(() => {
    return comboItems.reduce((acc, it) => acc + (it.unitPrice * (it.quantity || 1)), 0);
  }, [comboItems]);

  const { comboFinalPrice, comboSavingsAmount } = useMemo(() => {
    const val = parseFloat(comboDiscountValue) || 0;
    let final = comboSumOriginal;

    if (comboDiscountType === "percentage") {
      final = Math.max(0, Math.round(comboSumOriginal * (1 - val / 100)));
    } else if (comboDiscountType === "fixed_price") {
      final = val > 0 ? val : comboSumOriginal;
    } else if (comboDiscountType === "amount_off") {
      final = Math.max(0, comboSumOriginal - val);
    }

    const savings = Math.max(0, comboSumOriginal - final);
    return { comboFinalPrice: final, comboSavingsAmount: savings };
  }, [comboSumOriginal, comboDiscountType, comboDiscountValue]);

  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboName.trim()) {
      addToast({ title: "Package name required", type: "error" });
      return;
    }
    if (!comboCategoryId) { addToast({ title: "Select a category", type: "error" }); return; }
    if (comboItems.length === 0) {
      addToast({ title: "Select at least 1 menu item to bundle", type: "error" });
      return;
    }

    const sanitizedImages = comboImages.length > 0 ? comboImages : [SAMPLE_FOOD_PRESETS[0]];
    const safeMainIndex =
      comboMainImageIndex >= 0 && comboMainImageIndex < sanitizedImages.length
        ? comboMainImageIndex
        : 0;

    const payload: Omit<Product, "id"> = {
      name: comboName.trim(),
      categoryId: comboCategoryId,
      basePrice: comboFinalPrice,
      costPrice: Math.round(comboFinalPrice * 0.4),
      prepTimeMinutes: 15,
      description:
        comboDescription.trim() ||
        `Bundle contains: ${comboItems.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}`,
      images: sanitizedImages,
      mainImageIndex: safeMainIndex,
      dietary: ["Chef's Choice", "Popular"],
      isDeliveryEligible: true,
      isAvailable: true,
      showOnPos: comboShowOnPos,
      showOnQr: comboShowOnQr,
      isWebVisible: comboShowOnWeb,
      requiresKitchen: true,
      isComboPackage: true,
      comboItems: comboItems,
      comboOriginalPrice: comboSumOriginal,
      comboDiscountType: comboDiscountType,
      comboDiscountValue: parseFloat(comboDiscountValue) || 0,
      variants: [
        {
          id: `var-${Date.now()}`,
          name: "Package Set",
          price: comboFinalPrice,
          isDefault: true,
        },
      ],
      modifierGroups: [],
      recipeIngredients: [],
    };

    if (editingProductId) {
      try { await updateProductFull(editingProductId, payload); } catch { return; }
      addToast({
        title: "Package Updated",
        description: `"${comboName}" updated with ${comboItems.length} bundled items.`,
        type: "success",
      });
    } else {
      try { await createProduct(payload); } catch { return; }
      addToast({
        title: "Package Created",
        description: `Combo "${comboName}" published at ${formatNPR(comboFinalPrice)}.`,
        type: "success",
      });
    }

    setViewMode("list");
  };

  // -------------------------------------------------------------
  // MODIFIER SECTIONS (SECTION 3)
  // -------------------------------------------------------------
  const handleAddModifierSection = () => {
    const newSec: ModifierGroup = {
      id: `sec-${Date.now()}`,
      name: "",
      required: false,
      minSelections: 0,
      maxSelections: 1,
      options: [],
    };
    setFormModifierSections((prev) => [...prev, newSec]);
  };

  const handleRemoveModifierSection = (secId: string) => {
    setFormModifierSections((prev) => prev.filter((s) => s.id !== secId));
  };

  const handleUpdateSectionName = (secId: string, name: string) => {
    setFormModifierSections((prev) =>
      prev.map((s) => (s.id === secId ? { ...s, name } : s))
    );
  };

  const handleToggleSectionRequired = (secId: string) => {
    setFormModifierSections((prev) =>
      prev.map((s) =>
        s.id === secId
          ? { ...s, required: !s.required, minSelections: !s.required ? 1 : 0 }
          : s
      )
    );
  };

  const handleAddOptionToSection = (secId: string) => {
    const newOpt: ModifierOption = {
      id: `opt-${Date.now()}`,
      name: "",
      priceDelta: 0,
      isDefault: false,
    };
    setFormModifierSections((prev) =>
      prev.map((s) =>
        s.id === secId ? { ...s, options: [...s.options, newOpt] } : s
      )
    );
  };

  const handleUpdateOption = (
    secId: string,
    optId: string,
    field: "name" | "priceDelta" | "isDefault",
    val: any
  ) => {
    setFormModifierSections((prev) =>
      prev.map((s) => {
        if (s.id !== secId) return s;
        return {
          ...s,
          options: s.options.map((opt) => {
            if (opt.id !== optId) return opt;
            return { ...opt, [field]: val };
          }),
        };
      })
    );
  };

  const handleRemoveOption = (secId: string, optId: string) => {
    setFormModifierSections((prev) =>
      prev.map((s) => {
        if (s.id !== secId) return s;
        return { ...s, options: s.options.filter((o) => o.id !== optId) };
      })
    );
  };

  // -------------------------------------------------------------
  // RECIPE INGREDIENTS (SECTION 4)
  // -------------------------------------------------------------
  const handleAddRecipeIngredient = () => {
    const invItem = inventory[0];
    if (!invItem) return;
    const newIng: ProductIngredientRecipe = {
      id: `ing-${Date.now()}`,
      inventoryItemId: invItem.id,
      inventoryItemName: invItem.name,
      quantityRequired: 1,
      unit: invItem.unit,
    };
    setFormRecipeIngredients((prev) => [...prev, newIng]);
  };

  const handleUpdateRecipeIngredient = (id: string, invItemId: string) => {
    const match = inventory.find((i) => i.id === invItemId);
    setFormRecipeIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id !== id) return ing;
        return {
          ...ing,
          inventoryItemId: invItemId,
          inventoryItemName: match ? match.name : ing.inventoryItemName,
          unit: match ? match.unit : ing.unit,
        };
      })
    );
  };

  const handleUpdateRecipeQuantity = (id: string, qty: number) => {
    setFormRecipeIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, quantityRequired: qty } : ing))
    );
  };

  const handleRemoveRecipeIngredient = (id: string) => {
    setFormRecipeIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  // -------------------------------------------------------------
  // FILTERED LISTINGS
  // -------------------------------------------------------------
  const regularItems = useMemo(() => {
    return products.filter((p) => !p.isComboPackage);
  }, [products]);

  const comboPackages = useMemo(() => {
    return products.filter((p) => p.isComboPackage);
  }, [products]);

  const filteredItems = useMemo(() => {
    return regularItems.filter((p) => {
      if (selectedCategory !== "ALL" && p.categoryId !== selectedCategory) return false;
      if (dietaryFilter !== "ALL" && !p.dietary?.includes(dietaryFilter as any)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [regularItems, selectedCategory, dietaryFilter, searchQuery]);

  const filteredCombos = useMemo(() => {
    return comboPackages.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [comboPackages, searchQuery]);

  // =============================================================
  // RENDER: FULL ADD/EDIT COMBO PACKAGE BUILDER
  // =============================================================
  if (viewMode === "combo_form") {
    return (
      <div className="space-y-3 font-sans text-xs pb-12">
        {/* Sticky Header */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-2.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog</span>
            </button>
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />
            <span className="font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-500" />
              <span>{editingProductId ? `Edit Package: ${comboName}` : "Create New Combo Package Deal"}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCombo}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Publish Package</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveCombo} className="space-y-3">
          {/* Row 1: Package Basic Info (4-5 Columns) */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3 space-y-2.5">
            <div className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1. Package Setup & Channels (4-5 Columns)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Burger + Fries + Coke Feast"
                  value={comboName}
                  onChange={(e) => setComboName(e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                  Category *
                </label>
                <CategorySelect value={comboCategoryId} onChange={setComboCategoryId} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                  Overall Discount Mode *
                </label>
                <select
                  value={comboDiscountType}
                  onChange={(e) => setComboDiscountType(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white"
                >
                  <option value="percentage">% Percentage Discount</option>
                  <option value="fixed_price">Fixed Set Price (NPR)</option>
                  <option value="amount_off">Flat Amount Off (NPR)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                  {comboDiscountType === "percentage"
                    ? "Discount % (e.g. 15)"
                    : comboDiscountType === "fixed_price"
                    ? "Fixed Combo Price (NPR)"
                    : "Amount Off (NPR)"}
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={comboDiscountValue}
                  onChange={(e) => setComboDiscountValue(e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-amber-500"
                />
              </div>

              {/* 3 Channel Visibility */}
              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                  Channels (POS / QR / Web)
                </label>
                <div className="flex flex-wrap gap-2 text-[11px] font-medium pt-0.5">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={comboShowOnPos}
                      onChange={(e) => setComboShowOnPos(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span>POS</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer" title="In-shop table QR ordering">
                    <input
                      type="checkbox"
                      checked={comboShowOnQr}
                      onChange={(e) => setComboShowOnQr(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span>Table QR</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer" title="Public online website">
                    <input
                      type="checkbox"
                      checked={comboShowOnWeb}
                      onChange={(e) => setComboShowOnWeb(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span>Web</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">
                Package Story / Included Highlights
              </label>
              <textarea rows={4}
                placeholder="e.g. Complete meal with gourmet burger, hot peri-peri fries and a chilled drink."
                value={comboDescription}
                onChange={(e) => setComboDescription(e.target.value)}
                className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
              />
            </div>
          </div>

          {/* Row 2: Package Images with Direct File Upload */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>2. Package Images (Direct Upload with Main Image Selection)</span>
              </div>
              <input
                type="file"
                ref={comboFileInputRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files, true)}
              />
              <button
                type="button"
                onClick={() => comboFileInputRef.current?.click()}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Upload From Device</span>
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {comboImages.map((imgUrl, idx) => {
                const isMain = comboMainImageIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`relative w-24 h-24 shrink-0 border-2 overflow-hidden group bg-zinc-100 dark:bg-zinc-800 ${
                      isMain ? "border-amber-500 ring-2 ring-amber-500/20 shadow-sm" : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt="Combo img"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setComboMainImageIndex(idx)}
                      className={`absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-black uppercase flex items-center gap-0.5 ${
                        isMain
                          ? "bg-amber-500 text-black font-black"
                          : "bg-black/75 text-white hover:bg-amber-500 hover:text-black"
                      }`}
                    >
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {isMain ? "Main" : "Set Main"}
                    </button>
                    {comboImages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = comboImages.filter((_, i) => i !== idx);
                          setComboImages(updated);
                          if (comboMainImageIndex >= updated.length) setComboMainImageIndex(0);
                        }}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => comboFileInputRef.current?.click()}
                className="w-36 h-24 shrink-0 border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center justify-center text-zinc-400 hover:text-amber-500 hover:border-amber-500 transition-colors cursor-pointer"
              >
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">+ Upload Image</span>
              </button>
            </div>
          </div>

          {/* Row 3: Select Menu Items for the Package */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>3. Select Menu Items in this Package Bundle</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Choose dishes, sides, and drinks. Adjust quantities to build the deal.
                </p>
              </div>

              {/* Add item dropdown */}
              <div className="flex items-center gap-2">
                <select
                  id="combo-item-selector"
                  className="px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-bold"
                  onChange={(e) => {
                    const prodId = e.target.value;
                    if (!prodId) return;
                    const match = products.find((p) => p.id === prodId);
                    if (match) {
                      setComboItems((prev) => {
                        const existing = prev.find((it) => it.productId === prodId);
                        if (existing) {
                          return prev.map((it) =>
                            it.productId === prodId ? { ...it, quantity: it.quantity + 1 } : it
                          );
                        }
                        return [
                          ...prev,
                          {
                            productId: match.id,
                            productName: match.name,
                            quantity: 1,
                            unitPrice: match.basePrice,
                          },
                        ];
                      });
                    }
                    e.target.value = "";
                  }}
                >
                  <option value="">+ Add Menu Item to Bundle...</option>
                  {regularItems.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatNPR(p.basePrice)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bundled items list */}
            {comboItems.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800">
                No items added to this combo yet. Select items from the dropdown above.
              </div>
            ) : (
              <div className="space-y-1.5">
                {comboItems.map((item) => {
                  const lineTotal = item.unitPrice * item.quantity;
                  return (
                    <div
                      key={item.productId}
                      className="p-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs text-zinc-900 dark:text-white">
                          {item.productName}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono ml-2">
                          @{formatNPR(item.unitPrice)} each
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold">Qty:</span>
                        <div className="flex items-center border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity > 1) {
                                setComboItems((prev) =>
                                  prev.map((it) =>
                                    it.productId === item.productId
                                      ? { ...it, quantity: it.quantity - 1 }
                                      : it
                                  )
                                );
                              } else {
                                setComboItems((prev) =>
                                  prev.filter((it) => it.productId !== item.productId)
                                );
                              }
                            }}
                            className="px-2 py-0.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 font-mono font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setComboItems((prev) =>
                                prev.map((it) =>
                                  it.productId === item.productId
                                    ? { ...it, quantity: it.quantity + 1 }
                                    : it
                                )
                              );
                            }}
                            className="px-2 py-0.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <div className="w-24 text-right font-mono font-bold text-zinc-900 dark:text-white">
                          {formatNPR(lineTotal)}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setComboItems((prev) =>
                              prev.filter((it) => it.productId !== item.productId)
                            );
                          }}
                          className="p-1 text-zinc-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Pricing Summary Card */}
                <div className="mt-3 p-3 bg-zinc-100 dark:bg-[#18181b] border border-zinc-300 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                      Package Pricing Breakdown
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-400 line-through">
                        Sum of Items: {formatNPR(comboSumOriginal)}
                      </span>
                      {comboSavingsAmount > 0 && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          Customer Saves {formatNPR(comboSavingsAmount)} ({Math.round((comboSavingsAmount / (comboSumOriginal || 1)) * 100)}% OFF)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-zinc-400">
                      Final Selling Combo Price
                    </div>
                    <div className="text-lg font-black text-amber-500 font-mono">
                      {formatNPR(comboFinalPrice)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    );
  }

  // =============================================================
  // RENDER: FULL ADD/EDIT REGULAR MENU ITEM PAGE
  // =============================================================
  if (viewMode === "item_form") {
    return (
      <div className="space-y-3 font-sans text-xs pb-12">
        {/* Sticky Header */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-2.5 flex flex-wrap gap-3 items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Menu</span>
            </button>
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />
            <span className="font-black text-sm text-zinc-900 dark:text-white">
              {editingProductId ? `Edit: ${formName || "Product"}` : "Create New Menu Item"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="menu-item-form"
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Publish Item</span>
            </button>
          </div>
        </div>

        <form id="menu-item-form" onSubmit={handleSaveItem} className="space-y-3">
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] p-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_minmax(0,1fr)] sm:items-center">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-500">
                  <Link2 className="h-4 w-4" />
                </div>
                <div>
                  <label htmlFor="counter-inventory" className="block text-sm font-semibold text-zinc-900 dark:text-white">
                    Link counter item
                  </label>
                  <p className="mt-1 text-xs text-zinc-500">Deduct one inventory unit per sale.</p>
                </div>
              </div>
              <div className="min-w-0 space-y-2">
                <select
                  id="counter-inventory"
                  value={formLinkedInventoryId}
                  onChange={(e) => handleSelectLinkedInventoryItem(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-amber-500"
                >
                  <option value="">No inventory link</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.currentStock} {inv.unit} available)
                    </option>
                  ))}
                </select>
                {formLinkedInventoryId ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Linked to counter
                    </span>
                    <button type="button" onClick={() => handleSelectLinkedInventoryItem("")} className="text-xs font-medium text-zinc-500 hover:text-rose-500">
                      Unlink
                    </button>
                  </div>
                ) : inventory.length === 0 ? (
                  <p className="text-xs text-zinc-500">No inventory items available.</p>
                ) : null}
              </div>
            </div>
          </section>

          {/* =============================================================
              SECTION 1: CORE DETAILS (4 TO 5 COLUMNS IN A ROW)
          ============================================================= */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3 space-y-2.5">
            <div className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1. Item details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {/* Column 1: Product Name */}
              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Item name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white focus:border-amber-500 outline-none"
                />
              </div>

              {/* Column 2: Category */}
              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                  Category *
                </label>
                <CategorySelect value={formCategoryId} onChange={setFormCategoryId} />
              </div>

              {/* Column 3: Base Selling Price & Cost Price */}
              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                  Base Price (NPR) *
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Selling price"
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-900 dark:text-white focus:border-amber-500 outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Cost"
                    title="Estimated Cost Price"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-20 px-1.5 py-1.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-500"
                  />
                </div>
              </div>

              {/* Column 4: Dietary & Prep Time */}
              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                  Dietary / Prep Time
                </label>
                <div className="flex gap-1">
                  <select
                    value={formDietary[0] || ""}
                    onChange={(e) => setFormDietary(e.target.value ? [e.target.value as DietaryTag] : [])}
                    className="w-full px-1.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white"
                  >
                    <option value="">No dietary tag</option>
                    <option value="Chef's Choice">Chef's Choice</option>
                    <option value="Popular">Popular Hit</option>
                    <option value="Spicy">Spicy 🔥</option>
                    <option value="Vegetarian">Vegetarian 🌱</option>
                    <option value="Halal">Halal Certified</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    title="Prep Time (Minutes)"
                    className="w-14 px-1.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-center font-mono"
                  />
                  <span className="self-center text-[10px] text-zinc-400">m</span>
                </div>
              </div>

              {/* Column 5: 3 SEPARATE CHANNELS (POS vs QR vs WEB) */}
              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1">
                  Visible on
                </label>
                <div className="flex flex-col gap-1 text-[11px] font-medium">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formShowOnPos}
                      onChange={(e) => setFormShowOnPos(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">POS Counter</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer" title="In-shop table QR menu">
                    <input
                      type="checkbox"
                      checked={formShowOnQr}
                      onChange={(e) => setFormShowOnQr(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">Table QR (In-Shop)</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer" title="Public online website">
                    <input
                      type="checkbox"
                      checked={formShowOnWeb}
                      onChange={(e) => setFormShowOnWeb(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">Web / Online</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Description & Secondary Attributes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="md:col-span-3">
                <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">
                  Description
                </label>
                <textarea rows={4}
                  placeholder="Item description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">
                    Discount %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formDiscountPercent}
                    onChange={(e) => setFormDiscountPercent(e.target.value)}
                    className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">
                    Kitchen
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer pt-1 text-[11px]">
                    <input
                      type="checkbox"
                      checked={formRequiresKitchen}
                      onChange={(e) => setFormRequiresKitchen(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span className="text-zinc-600 dark:text-zinc-400">Requires preparation</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* =============================================================
              SECTION 2: MULTIPLE IMAGES WITH DIRECT FILE UPLOAD
          ============================================================= */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3 space-y-2.5">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>2. Images</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files, false)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Upload images</span>
              </button>
            </div>

            {/* Gallery Strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {formImages.map((imgUrl, idx) => {
                const isMain = formMainImageIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`relative w-24 h-24 shrink-0 border-2 overflow-hidden group bg-zinc-100 dark:bg-zinc-800 transition-all ${
                      isMain ? "border-amber-500 shadow-md ring-2 ring-amber-500/20" : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Product img ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {/* Main image badge / button */}
                    <button
                      type="button"
                      onClick={() => setFormMainImageIndex(idx)}
                      title={isMain ? "Current Main Image" : "Set as Main Image"}
                      className={`absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-black uppercase flex items-center gap-0.5 ${
                        isMain
                          ? "bg-amber-500 text-black shadow-sm"
                          : "bg-black/70 text-white hover:bg-amber-500 hover:text-black"
                      }`}
                    >
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {isMain ? "Main" : "Set Main"}
                    </button>

                    {/* Delete button (if more than 1 image) */}
                    {formImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formImages.filter((_, i) => i !== idx);
                          setFormImages(updated);
                          setFormMainImageIndex((current) => current === idx ? 0 : current > idx ? current - 1 : current);
                        }}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Direct Upload Tile */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-36 h-24 shrink-0 border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center justify-center text-zinc-400 hover:text-amber-500 hover:border-amber-500 transition-colors cursor-pointer"
              >
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">+ Upload Image</span>
                <span className="text-[9px] text-zinc-500">JPG, PNG, WebP</span>
              </button>
            </div>
          </div>

          {/* =============================================================
              SECTION 3: DYNAMIC CUSTOM MODIFIER SECTIONS (SIZE, BUN, CHEESE, SAUCES, ETC.)
              (Replaces redundant static sauces/addons sections)
          ============================================================= */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3 space-y-3">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>3. Modifiers</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Add choices and optional extra charges.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddModifierSection}
                className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Section</span>
              </button>
            </div>

            <div className="space-y-3">
              {formModifierSections.map((sec, secIdx) => (
                <div
                  key={sec.id}
                  className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <span className="text-[10px] font-black text-zinc-400 uppercase">
                        Section #{secIdx + 1}:
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Section name"
                        value={sec.name}
                        onChange={(e) => handleUpdateSectionName(sec.id, e.target.value)}
                        className="flex-1 max-w-xs px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={sec.required}
                          onChange={() => handleToggleSectionRequired(sec.id)}
                          className="accent-amber-500"
                        />
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">
                          {sec.required ? "Required Section" : "Optional"}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleAddOptionToSection(sec.id)}
                        className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[10px] font-bold text-zinc-800 dark:text-zinc-200"
                      >
                        + Add Choice
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveModifierSection(sec.id)}
                        className="text-zinc-400 hover:text-rose-500 p-1"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sec.options.map((opt) => {
                      const totalWithOption =
                        (parseFloat(formBasePrice) || 0) + (opt.priceDelta || 0);
                      return (
                        <div
                          key={opt.id}
                          className="p-2 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0 space-y-1">
                            <input
                              type="text"
                              required
                              placeholder="Choice name"
                              value={opt.name}
                              onChange={(e) =>
                                handleUpdateOption(sec.id, opt.id, "name", e.target.value)
                              }
                              className="w-full px-1.5 py-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white"
                            />
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-zinc-500">+NPR:</span>
                              <input
                                type="number"
                                step="any"
                                value={opt.priceDelta}
                                onChange={(e) =>
                                  handleUpdateOption(
                                    sec.id,
                                    opt.id,
                                    "priceDelta",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-16 px-1 py-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-zinc-900 dark:text-white"
                              />
                              <span className="text-zinc-400 font-mono">
                                Total: {formatNPR(totalWithOption)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(sec.id, opt.id)}
                              className="text-zinc-400 hover:text-rose-500 p-0.5"
                              title="Delete Choice"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <label className="text-[9px] text-zinc-400 cursor-pointer" title="Default Selected">
                              <input
                                type="checkbox"
                                checked={opt.isDefault || false}
                                onChange={(e) =>
                                  handleUpdateOption(sec.id, opt.id, "isDefault", e.target.checked)
                                }
                                className="accent-amber-500"
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =============================================================
              SECTION 4: RECIPE / RAW MATERIALS (BOM) STOCK DEDUCTION
          ============================================================= */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3 space-y-2.5">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>4. Recipe & inventory</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Set the quantity deducted per sale.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRecipeIngredient}
                disabled={inventory.length === 0}
                className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Map Material</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {formRecipeIngredients.map((ing) => (
                <div
                  key={ing.id}
                  className="p-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <select
                      value={ing.inventoryItemId}
                      onChange={(e) => handleUpdateRecipeIngredient(ing.id, e.target.value)}
                      className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white flex-1 max-w-sm"
                    >
                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} ({inv.currentStock} {inv.unit} in stock)
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-500">Qty deducted per sale:</span>
                      <input
                        type="number"
                        step="any"
                        value={ing.quantityRequired}
                        onChange={(e) =>
                          handleUpdateRecipeQuantity(ing.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 px-1.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                      />
                      <span className="text-[10px] text-zinc-400 font-mono uppercase">
                        {ing.unit}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRecipeIngredient(ing.id)}
                    className="text-zinc-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    );
  }

  // =============================================================
  // RENDER: CATALOG GRID (AT LEAST 4 IN A ROW, COMPACT MARGINS)
  // =============================================================
  return (
    <div className="space-y-2.5 font-sans text-xs pb-10">
      {/* Top Filter & Module Action Bar */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        {/* Left: Main Tabs (Menu Items vs Packages & Combos) */}
        <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setActiveMainTab("tiers")}
            className={`px-3 py-1 text-xs font-black uppercase transition-colors ${
              activeMainTab === "tiers"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            ⏰ Pricing Tiers ({timePricingSchedules.filter((s) => s.outletId === currentOutlet.id).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab("items")}
            className={`px-3 py-1 text-xs font-black uppercase transition-colors ${
              activeMainTab === "items"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            🍽️ Menu Items ({regularItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab("combos")}
            className={`px-3 py-1 text-xs font-black uppercase transition-colors ${
              activeMainTab === "combos"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            🎁 Packages & Combos ({comboPackages.length})
          </button>
        </div>

        {/* Middle: Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder={activeMainTab === "items" ? "Search dishes or codes..." : "Search packages..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
          />
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Convert Inventory to Menu Button */}
          <button
            type="button"
            onClick={() => setShowQuickConvertModal(true)}
            className="px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Directly sell cigarettes, canned drinks, bottled goods from inventory"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Convert Stock to Menu</span>
          </button>

          {activeMainTab === "items" && (
            <button
              type="button"
              onClick={handleOpenCreateNewItem}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-colors flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Menu Item</span>
            </button>
          )}
          {activeMainTab === "combos" && (
            <button
              type="button"
              onClick={handleOpenCreateNewCombo}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-colors flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Combo Package</span>
            </button>
          )}
        </div>
      </div>

      {activeMainTab === "tiers" && <StaffTimePricing />}

      {/* Category Pills Strip (for Items) */}
      {activeMainTab === "items" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-2.5 py-1 font-bold whitespace-nowrap transition-colors ${
              selectedCategory === "ALL"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black"
                : "bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
            }`}
          >
            All Categories ({regularItems.length})
          </button>
          {categories.filter(c => !c.isArchived).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-black"
                  : "bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* =============================================================
          TAB 1: MENU ITEMS GRID (AT LEAST 4 IN A ROW)
      ============================================================= */}
      {activeMainTab === "items" && (
        <>
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 text-zinc-400">
              No menu items found. Click "+ New Menu Item" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredItems.map((product) => {
                const mainImg =
                  product.images && product.images.length > 0
                    ? product.images[product.mainImageIndex || 0] || product.images[0]
                    : "";

                const catObj = categories.find((c) => c.id === product.categoryId);

                return (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col justify-between hover:border-amber-500/60 transition-colors group relative"
                  >
                    {/* Image Box */}
                    <div className="relative h-32 w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                      {mainImg ? (
                        <img
                          src={mainImg}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                          <Package className="h-10 w-10" aria-label="No image" />
                        </div>
                      )}

                      {/* Out of Stock Overlay */}
                      {!product.isAvailable && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="px-2 py-0.5 bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider">
                            Sold Out (86'd)
                          </span>
                        </div>
                      )}

                      {/* Category Badge & Prep Time */}
                      <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 bg-black/75 backdrop-blur-sm text-white text-[9px] font-bold uppercase">
                          {catObj?.name || "Dish"}
                        </span>
                        {product.isDirectInventoryItem && (
                          <span className="px-1.5 py-0.5 bg-sky-600 text-white text-[9px] font-bold uppercase">
                            Retail Stock
                          </span>
                        )}
                      </div>

                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/75 backdrop-blur-sm text-zinc-300 text-[9px] font-mono flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 text-amber-500" />
                        <span>{product.prepTimeMinutes ?? 0}m</span>
                      </div>

                      {/* Price Badge */}
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-amber-500 text-black font-black text-xs font-mono shadow-sm">
                        {formatNPR(product.basePrice)}
                      </div>
                    </div>

                    {/* Content Box */}
                    <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1">
                            {product.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                      </div>

                      {/* Channel & Modifier Badges */}
                      <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 font-mono text-zinc-400">
                            {product.modifierGroups && product.modifierGroups.length > 0 && (
                              <span className="text-zinc-700 dark:text-zinc-300 font-bold" title="Modifier sections">
                                ⚙️ {product.modifierGroups.length} sec
                              </span>
                            )}
                            {product.timePricings && product.timePricings.length > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 font-bold" title="Time pricing rules">
                                ⏱️ {product.timePricings.length} rules
                              </span>
                            )}
                          </div>

                          {/* 3 Channel Visibility Tags */}
                          <div className="flex items-center gap-1 text-[9px] font-bold">
                            <span
                              className={`px-1 py-0.2 ${
                                product.showOnPos !== false
                                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                  : "text-zinc-400 bg-zinc-100 dark:bg-zinc-800"
                              }`}
                              title="POS Terminal Visibility"
                            >
                              POS
                            </span>
                            <span
                              className={`px-1 py-0.2 ${
                                product.showOnQr !== false
                                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
                                  : "text-zinc-400 bg-zinc-100 dark:bg-zinc-800"
                              }`}
                              title="Table QR (In-Shop) Menu Visibility"
                            >
                              QR
                            </span>
                            <span
                              className={`px-1 py-0.2 ${
                                product.isWebVisible !== false
                                  ? "text-sky-600 dark:text-sky-400 bg-sky-500/10"
                                  : "text-zinc-400 bg-zinc-100 dark:bg-zinc-800"
                              }`}
                              title="Public Online Website Menu Visibility"
                            >
                              WEB
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => toggleProductAvailability(product.id)}
                            className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${
                              product.isAvailable
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
                            }`}
                          >
                            {product.isAvailable ? "In Stock" : "86'd (Out)"}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditItem(product)}
                              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                              title="Edit item in full form"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete "${product.name}"?`)) {
                                  deleteProduct(product.id);
                                }
                              }}
                              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-zinc-400 hover:text-rose-600 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* =============================================================
          TAB 2: PACKAGES & COMBOS GRID (AT LEAST 4 IN A ROW)
      ============================================================= */}
      {activeMainTab === "combos" && (
        <>
          {filteredCombos.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 text-zinc-400">
              No combo packages created yet. Click "+ New Combo Package" to bundle menu items with special overall discount!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredCombos.map((combo) => {
                const mainImg =
                  combo.images && combo.images.length > 0
                    ? combo.images[combo.mainImageIndex || 0] || combo.images[0]
                    : SAMPLE_FOOD_PRESETS[0];

                const originalSum = combo.comboOriginalPrice || combo.basePrice;
                const savings = Math.max(0, originalSum - combo.basePrice);

                return (
                  <div
                    key={combo.id}
                    className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col justify-between hover:border-amber-500/60 transition-colors group relative"
                  >
                    {/* Image with Combo Badge */}
                    <div className="relative h-32 w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                      <img
                        src={mainImg}
                        alt={combo.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />

                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black uppercase flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>Combo Deal</span>
                      </div>

                      {savings > 0 && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black uppercase">
                          Save {formatNPR(savings)}
                        </div>
                      )}

                      <div className="absolute bottom-1.5 left-1.5 flex items-baseline gap-1.5 bg-black/80 px-2 py-0.5 backdrop-blur-sm">
                        <span className="text-amber-400 font-black text-xs font-mono">
                          {formatNPR(combo.basePrice)}
                        </span>
                        {originalSum > combo.basePrice && (
                          <span className="text-zinc-400 line-through text-[10px] font-mono">
                            {formatNPR(originalSum)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Box */}
                    <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {combo.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                          {combo.description}
                        </p>
                      </div>

                      {/* Included Items Pills */}
                      <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                        <div className="text-[9px] font-bold text-zinc-400 uppercase">
                          Includes {combo.comboItems?.length || 0} Items:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {combo.comboItems?.map((it, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[9px] font-mono text-zinc-700 dark:text-zinc-300"
                            >
                              {it.quantity}x {it.productName}
                            </span>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => toggleProductAvailability(combo.id)}
                            className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${
                              combo.isAvailable
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {combo.isAvailable ? "Active" : "Disabled"}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCombo(combo)}
                              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                              title="Edit package deal"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete package "${combo.name}"?`)) {
                                  deleteProduct(combo.id);
                                }
                              }}
                              className="p-1 hover:bg-rose-100 text-zinc-400 hover:text-rose-600"
                              title="Delete package"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* =============================================================
          QUICK CONVERT INVENTORY TO MENU ITEM MODAL
      ============================================================= */}
      {showQuickConvertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 w-full max-w-lg p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black uppercase text-zinc-900 dark:text-white">
                  Convert Purchase / Inventory Item to Menu
                </h3>
              </div>
              <button
                onClick={() => setShowQuickConvertModal(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Instantly create a live menu item for retail goods purchased in stock (e.g. Cigarettes, Red Bull, Mineral Water, Packed Chips). 1 unit will be auto-deducted per sale, routed directly to the counter (no kitchen preparation).
            </p>

            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
              {inventory.map((item) => {
                const isAlreadyMenu = products.some(
                  (p) => p.linkedInventoryItemId === item.id || p.name.toLowerCase() === item.name.toLowerCase()
                );
                const suggestedSell = Math.max(item.costPerUnit + 25, Math.round(item.costPerUnit * 1.3));

                return (
                  <div key={item.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {isAlreadyMenu && (
                          <span className="px-1.5 py-0.2 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[9px]">
                            Already on Menu
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        Stock: {item.currentStock} {item.unit} | Purchase Cost: NPR {item.costPerUnit}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">Sell at:</span>
                      <span className="font-mono font-bold text-amber-500 text-xs">
                        NPR {suggestedSell}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickConvertInventoryItem(item, suggestedSell)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
                      >
                        Add to Menu
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowQuickConvertModal(false)}
                className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
