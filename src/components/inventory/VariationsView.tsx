import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { getCategoryName, getBrandName } from "../../utils/formatters";
import { Product, ProductAttribute, ProductVariation, ComboItem } from '../../types/erp';
import {
  Sliders,
  Boxes,
  PackageCheck,
  Plus,
  Edit2,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  DollarSign,
  PieChart,
  HelpCircle,
  Copy,
} from 'lucide-react';

interface VariationsViewProps {}

export const VariationsView: React.FC<VariationsViewProps> = () => {
  const {
    products,
    deleteProduct,
    showFlashNotification,
    openAddProductPage,
    openEditProductPage,
    formatMoney,
    settings,
} = useErp();
  const isLight = settings?.themeMode === 'light';

  const [activeTab, setActiveTab] = useState<'variable' | 'combo' | 'attributes'>('variable');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Reusable attribute templates state
  const [attributesList, setAttributesList] = useState<ProductAttribute[]>([
    {
      id: 'attr_size',
      name: 'Size',
      values: ['Small (S)', 'Medium (M)', 'Large (L)', 'Extra Large (XL)', 'XXL'],
    },
    {
      id: 'attr_color',
      name: 'Color',
      values: ['Midnight Black', 'Pearl White', 'Ocean Blue', 'Crimson Red', 'Space Gray'],
    },
    {
      id: 'attr_flavor',
      name: 'Flavor',
      values: ['Chocolate Velvet', 'Vanilla Bean', 'Strawberry Burst', 'Mango Delight'],
    },
    {
      id: 'attr_storage',
      name: 'Storage Capacity',
      values: ['128GB', '256GB', '512GB', '1TB NVMe'],
    },
    {
      id: 'attr_material',
      name: 'Material',
      values: ['100% Organic Cotton', 'Polyester Blend', 'Genuine Leather', 'Aluminium Alloy'],
    },
  ]);

  // Attribute Form state
  const [isAddingAttribute, setIsAddingAttribute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      if (p.includes('variations/add')) {
        return true;
      }
    }
    return false;
  });

  React.useEffect(() => {
    if (isAddingAttribute) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('variations/add')) {
        window.history.replaceState(null, '', '/inventory/variations/add');
      }
    } else {
      if (typeof window !== 'undefined' && (window.location.pathname.includes('variations/add') || window.location.hash.includes('variations/add'))) {
        window.history.replaceState(null, '', '/inventory/variations');
      }
    }
  }, [isAddingAttribute]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState('');

  // Filter products
  const variableProducts = (products || []).filter(
    (p) => p.type === 'variable' || (p.variations && p.variations.length > 0)
  );

  const comboProducts = (products || []).filter(
    (p) => p.type === 'combo' || (p.comboItems && p.comboItems.length > 0)
  );

  const filteredVariableProducts = variableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredComboProducts = comboProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Total counts
  const totalVariationsCount = variableProducts.reduce(
    (sum, p) => sum + (p.variations?.length || 0),
    0
  );

  const handleAddAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim() || !newAttrValues.trim()) return;

    const valuesArray = newAttrValues
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    const newAttr: ProductAttribute = {
      id: `attr_${Date.now()}`,
      name: newAttrName.trim(),
      values: valuesArray,
    };

    setAttributesList((prev) => [...prev, newAttr]);
    setNewAttrName('');
    setNewAttrValues('');
    setIsAddingAttribute(false);
  };

  const handleDeleteAttribute = (id: string) => {
    if (confirm('Are you sure you want to delete this attribute template?')) {
      setAttributesList((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Sliders className="w-4 h-4" />
              <span>Products & Inventory Architecture</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Product Types, Variations & Combo Sets
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              Manage Single items, Variable products with multi-attribute variations (Size, Color, Flavor),
              and Combo/Bundle sets combining multiple existing catalog items.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openAddProductPage()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Variable Product</span>
            </button>
            <button
              onClick={() => openAddProductPage()}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-600/30"
            >
              <PackageCheck className="w-4 h-4" />
              <span>+ Add Combo Set</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Variable Products</span>
            </div>
            <div className="text-xl font-black text-white mt-0.5">{variableProducts.length}</div>
            <div className="text-[10px] text-indigo-300 font-medium mt-0.5">
              {totalVariationsCount} Total Variations
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Combo / Bundle Sets</span>
            </div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{comboProducts.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Multi-product bundles</div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Attribute Templates</span>
            </div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{attributesList.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Size, Color, Flavor, etc.</div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-sky-400" />
              <span>Single Products</span>
            </div>
            <div className="text-xl font-black text-sky-300 mt-0.5">
              {(products || []).filter((p) => p.type === 'single' || !p.type).length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Standard single items</div>
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('variable')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'variable'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Variable Products ({variableProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('combo')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'combo'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Combo & Bundle Sets ({comboProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attributes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'attributes'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Attribute Templates ({attributesList.length})</span>
          </button>
        </div>

        {activeTab !== 'attributes' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, Name..."
              className="w-full bg-slate-950 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* TAB 1: VARIABLE PRODUCTS */}
      {activeTab === 'variable' && (
        <div className="space-y-4">
          {filteredVariableProducts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <Sliders className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Variable Products Found</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Variable products allow selling products with different variations like Size (S, M, L),
                Color (Red, Blue), or Flavor.
              </p>
              <button
                onClick={() => openAddProductPage()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Variable Product</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVariableProducts.map((product) => {
                const isExpanded = expandedProductId === product.id;
                const variations = product.variations || [];
                const minPrice = variations.length
                  ? Math.min(...variations.map((v) => v.sellingPrice))
                  : product.sellingPrice;
                const maxPrice = variations.length
                  ? Math.max(...variations.map((v) => v.sellingPrice))
                  : product.sellingPrice;

                return (
                  <div
                    key={product.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition hover:border-slate-700"
                  >
                    {/* Header Item Strip */}
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                              VARIABLE PRODUCT
                            </span>
                            <span className="text-slate-500 font-mono text-xs">SKU: {product.sku}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-0.5">{product.name}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>Category: {getCategoryName(product.category)}</span>
                            <span>•</span>
                            <span>Brand: {getBrandName(product.brand)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Variation Price Range</div>
                          <div className="text-sm font-extrabold text-emerald-400">
                            {minPrice === maxPrice
                              ? formatMoney(minPrice)
                              : `${formatMoney(minPrice)} - ${formatMoney(maxPrice)}`}
                          </div>
                          <div className="text-[10px] text-indigo-300 font-semibold">
                            {variations.length} Variations
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditProductPage(product)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                            title="Edit Product & Variations"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          <button
                            onClick={() => {
                              if (product.currentStock > 0) {
                                showFlashNotification(`Cannot delete ${product.name}. Stock must be zero. Current stock: ${product.currentStock}`, 'error');
                                return;
                              }
                              if (confirm(`Delete variable product "${product.name}"?`)) {
                                deleteProduct(product.id);
                              }
                            }}
                            className={`p-2 rounded-xl transition border ${product.currentStock > 0 ? 'bg-slate-800/50 text-slate-500 border-slate-700/50 cursor-not-allowed' : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-900/40'}`}
                            title={product.currentStock > 0 ? "Cannot delete product with existing stock" : "Delete Product"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                            className="bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 p-2 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                          >
                            <span>{isExpanded ? 'Hide Variants' : 'Show Variants'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Variations Table */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 bg-slate-950/80 p-4 space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span className="flex items-center gap-1.5 text-indigo-400">
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Variations Breakdown ({variations.length})</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Each variation maintains unique SKU & pricing
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                              <tr>
                                <th className="py-2.5 px-3">Variation Name / Attributes</th>
                                <th className="py-2.5 px-3">SKU</th>
                                <th className="py-2.5 px-3">Barcode</th>
                                <th className="py-2.5 px-3 text-right">Cost Price</th>
                                <th className="py-2.5 px-3 text-right">Selling Price</th>
                                <th className="py-2.5 px-3 text-center">Current Stock</th>
                                {Boolean(settings.enableRacks) && <th className="py-2.5 px-3">Rack Storage</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {variations.map((v) => (
                                <tr key={v.id} className="hover:bg-slate-900/60">
                                  <td className="py-2.5 px-3 font-bold text-white">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                      <span>{v.name}</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-slate-300">{v.sku}</td>
                                  <td className="py-2.5 px-3 font-mono text-slate-400">{v.barcode}</td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                                    {formatMoney(v.costPrice)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">
                                    {formatMoney(v.sellingPrice)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-extrabold text-slate-200">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] ${
                                        v.currentStock <= 0
                                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                          : v.currentStock <= 5
                                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                          : 'bg-slate-800 text-slate-200'
                                      }`}
                                    >
                                      {v.currentStock} {product.unit}
                                    </span>
                                  </td>
                                  {Boolean(settings.enableRacks) && (
                                    <td className="py-2.5 px-3 text-slate-400">
                                      {v.rack ? `${v.rack} / ${v.row || 'Row 1'}` : 'Unassigned'}
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMBO & BUNDLE SETS */}
      {activeTab === 'combo' && (
        <div className="space-y-4">
          {filteredComboProducts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <PackageCheck className="w-12 h-12 text-amber-500/60 mx-auto" />
              <h3 className="text-base font-bold text-white">No Combo / Bundle Products Found</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Combo Products combine multiple catalog items into a single product set (e.g. "Computer Set"
                including Monitor, Keyboard, Mouse, and CPU).
              </p>
              <button
                onClick={() => openAddProductPage()}
                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Combo Set</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComboProducts.map((product) => {
                const isExpanded = expandedProductId === product.id;
                const comboItems = product.comboItems || [];
                const componentsCost = comboItems.reduce(
                  (sum, item) => sum + item.unitPrice * item.quantity,
                  0
                );
                const savings =
                  componentsCost > product.sellingPrice
                    ? componentsCost - product.sellingPrice
                    : 0;

                return (
                  <div
                    key={product.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition hover:border-slate-700"
                  >
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                              COMBO BUNDLE
                            </span>
                            <span className="text-slate-500 font-mono text-xs">SKU: {product.sku}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-0.5">{product.name}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{comboItems.length} Bundled Products</span>
                            <span>•</span>
                            <span>Category: {getCategoryName(product.category)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Bundle Price</div>
                          <div className="text-sm font-extrabold text-amber-300">
                            {formatMoney(product.sellingPrice)}
                          </div>
                          {savings > 0 && (
                            <div className="text-[10px] text-emerald-400 font-semibold">
                              Save {formatMoney(savings)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditProductPage(product)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                            title="Edit Combo Set"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          <button
                            onClick={() => {
                              if (product.currentStock > 0) {
                                showFlashNotification(`Cannot delete ${product.name}. Stock must be zero. Current stock: ${product.currentStock}`, 'error');
                                return;
                              }
                              if (confirm(`Delete combo product "${product.name}"?`)) {
                                deleteProduct(product.id);
                              }
                            }}
                            className={`p-2 rounded-xl transition border ${product.currentStock > 0 ? 'bg-slate-800/50 text-slate-500 border-slate-700/50 cursor-not-allowed' : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-900/40'}`}
                            title={product.currentStock > 0 ? "Cannot delete product with existing stock" : "Delete Combo Set"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                            className="bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 p-2 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                          >
                            <span>{isExpanded ? 'Hide Bundle' : 'Show Bundle'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Combo Item Breakdown */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 bg-slate-950/80 p-4 space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Included Component Products ({comboItems.length})</span>
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                              <tr>
                                <th className="py-2.5 px-3">Product Name</th>
                                <th className="py-2.5 px-3">SKU</th>
                                <th className="py-2.5 px-3 text-center">Qty Per Bundle</th>
                                <th className="py-2.5 px-3 text-right">Individual Price</th>
                                <th className="py-2.5 px-3 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {comboItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/60">
                                  <td className="py-2.5 px-3 font-bold text-white">{item.productName}</td>
                                  <td className="py-2.5 px-3 font-mono text-slate-400">{item.sku}</td>
                                  <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-300">
                                    {item.quantity} x
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                                    {formatMoney(item.unitPrice)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">
                                    {formatMoney(item.unitPrice * item.quantity)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GLOBAL ATTRIBUTE TEMPLATES */}
      {activeTab === 'attributes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Variation Attribute Presets</h3>
              <p className="text-xs text-slate-400">
                Define reusable product attribute rules (Size, Color, Flavor, Material) to quickly build variation matrices.
              </p>
            </div>
            <button
              onClick={() => setIsAddingAttribute(!isAddingAttribute)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Attribute</span>
            </button>
          </div>

          {/* Add Attribute Drawer Form */}
          {isAddingAttribute && (
            <form
              onSubmit={handleAddAttribute}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3 animate-fadeIn"
            >
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Create New Attribute Preset
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Attribute Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Design, Flavor, Size, Weight"
                    value={newAttrName}
                    onChange={(e) => setNewAttrName(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 mt-1 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300">
                    Values (Comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S, M, L, XL or Red, Blue, Black"
                    value={newAttrValues}
                    onChange={(e) => setNewAttrValues(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 mt-1 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAttribute(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    isLight 
                      ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 border-slate-800' 
                      : 'text-slate-400 hover:text-white border-transparent'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold"
                >
                  Save Attribute Template
                </button>
              </div>
            </form>
          )}

          {/* Attributes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attributesList.map((attr) => (
              <div
                key={attr.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">{attr.name}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteAttribute(attr.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition opacity-80 hover:opacity-100"
                    title="Delete Attribute Template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {attr.values.map((val, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-950 text-slate-200 border border-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    >
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
