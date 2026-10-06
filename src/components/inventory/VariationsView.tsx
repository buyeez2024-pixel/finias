import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { getCategoryName, getBrandName } from "../../utils/formatters";
import { Product, VariationTemplate } from '../../types/erp';
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
  Copy,
  X,
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
    variationTemplates = [],
    addVariationTemplate,
    updateVariationTemplate,
    deleteVariationTemplate,
    duplicateVariationTemplate,
  } = useErp();

  const isLight = settings?.themeMode === 'light';

  // Determine active tab from URL or default to 'attributes' (Variation Templates as in royaleelectrical.in/variation-templates)
  const [activeTab, setActiveTab] = useState<'attributes' | 'variable' | 'combo'>(() => {
    if (typeof window !== 'undefined') {
      const href = (window.location.pathname + window.location.hash + window.location.search).toLowerCase();
      if (href.includes('variable')) return 'variable';
      if (href.includes('combo')) return 'combo';
      if (href.includes('variation-templates') || href.includes('attributes') || href.includes('template')) return 'attributes';
    }
    return 'attributes';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Modal / Form state for Add/Edit Variation Template
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateValueInputs, setTemplateValueInputs] = useState<string[]>(['']);
  const [bulkValuesText, setBulkValuesText] = useState('');
  const [isBulkEntryMode, setIsBulkEntryMode] = useState(false);

  // Sync URL hash / path
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const targetPath = activeTab === 'attributes' ? '/inventory/variation-templates' : `/inventory/variations?tab=${activeTab}`;
      if (!window.location.pathname.includes(targetPath)) {
        window.history.replaceState(null, '', targetPath);
      }
    }
  }, [activeTab]);

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

  const filteredTemplates = variationTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.values.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Total counts
  const totalVariationsCount = variableProducts.reduce(
    (sum, p) => sum + (p.variations?.length || 0),
    0
  );

  // Open Template Modal for Creation
  const handleOpenCreateModal = () => {
    setEditingTemplateId(null);
    setTemplateName('');
    setTemplateValueInputs(['']);
    setBulkValuesText('');
    setIsBulkEntryMode(false);
    setIsTemplateModalOpen(true);
  };

  // Open Template Modal for Edit
  const handleOpenEditModal = (tmpl: VariationTemplate) => {
    setEditingTemplateId(tmpl.id);
    setTemplateName(tmpl.name);
    setTemplateValueInputs(tmpl.values && tmpl.values.length > 0 ? [...tmpl.values] : ['']);
    setBulkValuesText(tmpl.values ? tmpl.values.join(', ') : '');
    setIsBulkEntryMode(false);
    setIsTemplateModalOpen(true);
  };

  // Add a value row to form
  const handleAddValueRow = () => {
    setTemplateValueInputs([...templateValueInputs, '']);
  };

  // Remove a value row from form
  const handleRemoveValueRow = (index: number) => {
    if (templateValueInputs.length === 1) return;
    setTemplateValueInputs(templateValueInputs.filter((_, i) => i !== index));
  };

  // Save Variation Template
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      showFlashNotification('Please specify a Variation Template Name', 'error');
      return;
    }

    let finalValues: string[] = [];
    if (isBulkEntryMode) {
      finalValues = bulkValuesText
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    } else {
      finalValues = templateValueInputs
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }

    if (finalValues.length === 0) {
      showFlashNotification('Please add at least one variation value', 'error');
      return;
    }

    if (editingTemplateId) {
      updateVariationTemplate(editingTemplateId, {
        name: templateName.trim(),
        values: finalValues,
      });
    } else {
      addVariationTemplate({
        name: templateName.trim(),
        values: finalValues,
      });
    }

    setIsTemplateModalOpen(false);
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
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Variation Templates & Combo Sets</span>
              <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold px-2.5 py-0.5 rounded-full">
                {variationTemplates.length} Master Templates
              </span>
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              Create and manage Variation Templates (Size, Color, Wire Gauge, Voltage Rating, Length) used in Variable Products,
              and manage Combo / Bundle Product Sets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleOpenCreateModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Variation Template</span>
            </button>
            <button
              onClick={() => openAddProductPage()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Sliders className="w-4 h-4" />
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
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Variation Templates</span>
            </div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{variationTemplates.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Wire Gauge, Voltage, Size, etc.</div>
          </div>

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
              <Boxes className="w-3.5 h-3.5 text-sky-400" />
              <span>Single Products</span>
            </div>
            <div className="text-xl font-black text-sky-300 mt-0.5">
              {(products || []).filter((p) => p.type === 'single' || !p.type).length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Standard individual items</div>
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('attributes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'attributes'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Variation Templates ({variationTemplates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('variable')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'combo'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Combo & Bundle Sets ({comboProducts.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates, values, SKU..."
            className="w-full bg-slate-950 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
          />
        </div>
      </div>

      {/* TAB 1: VARIATION TEMPLATES (Matching royaleelectrical.in/variation-templates) */}
      {activeTab === 'attributes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>All Variation Templates</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold px-2 py-0.5 rounded">
                  {filteredTemplates.length} Available
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Define reusable variation templates (e.g. Wire Gauge, Voltage Rating, Size, Color, Cable Length, Phase Type) to quickly build variation matrices during product creation.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Variation Template</span>
            </button>
          </div>

          {/* Table View of Variation Templates */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 min-w-[180px]">Variation Template Name</th>
                    <th className="py-3 px-4 min-w-[320px]">Variation Values / Options</th>
                    <th className="py-3 px-4 text-center min-w-[100px]">Total Values</th>
                    <th className="py-3 px-4 text-center min-w-[140px]">Associated Products</th>
                    <th className="py-3 px-4 text-right min-w-[150px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <Tag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <p className="font-bold text-slate-300">No Variation Templates Found</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Click "+ Add Variation Template" above to define your first template.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTemplates.map((tmpl) => {
                      const associatedProds = variableProducts.filter((p) =>
                        p.variations?.some((v: any) =>
                          v.name?.toLowerCase().includes(tmpl.name.toLowerCase()) ||
                          Object.keys(v.attributes || {}).some((k) => k.toLowerCase() === tmpl.name.toLowerCase())
                        )
                      );

                      return (
                        <tr key={tmpl.id} className="hover:bg-slate-850/60 transition">
                          <td className="py-3.5 px-4 font-bold text-white">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-sm">{tmpl.name}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {tmpl.values.map((val, idx) => (
                                <span
                                  key={idx}
                                  className="bg-slate-950 text-slate-200 border border-slate-800 text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-2xs"
                                >
                                  {val}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                            {tmpl.values.length}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="bg-slate-950 text-indigo-300 border border-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                              {associatedProds.length} Variable Product{associatedProds.length !== 1 ? 's' : ''}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditModal(tmpl)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                                title="Edit Variation Template"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => duplicateVariationTemplate(tmpl.id)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg text-[11px] transition"
                                title="Duplicate Template"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Delete variation template "${tmpl.name}"?`)) {
                                    deleteVariationTemplate(tmpl.id);
                                  }
                                }}
                                className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/40 p-1.5 rounded-lg text-[11px] transition"
                                title="Delete Template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VARIABLE PRODUCTS */}
      {activeTab === 'variable' && (
        <div className="space-y-4">
          {filteredVariableProducts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <Sliders className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Variable Products Found</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Variable products allow selling products with different variations like Wire Gauge, Voltage, Size, or Color.
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
                  ? Math.min(...variations.map((v: any) => v.sellingPrice))
                  : product.sellingPrice;
                const maxPrice = variations.length
                  ? Math.max(...variations.map((v: any) => v.sellingPrice))
                  : product.sellingPrice;

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
                          <div className="text-sm font-extrabold text-emerald-400 font-mono">
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

                    {/* Expandable Variations Matrix Table */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 bg-slate-950/80 p-4 space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span className="flex items-center gap-1.5 text-indigo-400">
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Variations Breakdown Matrix ({variations.length})</span>
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                              <tr>
                                <th className="py-2.5 px-3">Variation Value / Name</th>
                                <th className="py-2.5 px-3">SKU</th>
                                <th className="py-2.5 px-3">Barcode</th>
                                <th className="py-2.5 px-3 text-right">Cost Price</th>
                                <th className="py-2.5 px-3 text-right">Selling Price</th>
                                <th className="py-2.5 px-3 text-center">Current Stock</th>
                                {Boolean(settings.enableRacks) && <th className="py-2.5 px-3">Rack Position</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {variations.map((v: any) => (
                                <tr key={v.id} className="hover:bg-slate-900/60">
                                  <td className="py-2.5 px-3 font-bold text-white">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                      <span>{v.name}</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-slate-300">{v.sku}</td>
                                  <td className="py-2.5 px-3 font-mono text-slate-400">{v.barcode || '—'}</td>
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

      {/* TAB 3: COMBO & BUNDLE SETS */}
      {activeTab === 'combo' && (
        <div className="space-y-4">
          {filteredComboProducts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <PackageCheck className="w-12 h-12 text-amber-500/60 mx-auto" />
              <h3 className="text-base font-bold text-white">No Combo / Bundle Products Found</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Combo Products combine multiple catalog items into a single product set (e.g. "Industrial Wiring Pack" including Cable Roll, Switch, and Junction Box).
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
                  (sum: number, item: any) => sum + (item.unitPrice || 0) * (item.quantity || 1),
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
                          <div className="text-sm font-extrabold text-amber-300 font-mono">
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
                              {comboItems.map((item: any, idx: number) => (
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
                                    {formatMoney((item.unitPrice || 0) * (item.quantity || 1))}
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

      {/* MODAL: ADD / EDIT VARIATION TEMPLATE */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Tag className="w-4 h-4" />
                <span>{editingTemplateId ? 'Edit Variation Template' : 'Add New Variation Template'}</span>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Variation Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wire Gauge / Thickness, Voltage Rating, Phase Type"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Toggle Input Mode */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-xs font-bold text-slate-300">
                  Variation Values / Options *
                </label>
                <button
                  type="button"
                  onClick={() => setIsBulkEntryMode(!isBulkEntryMode)}
                  className="text-[11px] font-bold text-indigo-400 hover:underline"
                >
                  {isBulkEntryMode ? 'Switch to Row Input Mode' : 'Switch to Bulk Comma Input Mode'}
                </button>
              </div>

              {isBulkEntryMode ? (
                <div>
                  <textarea
                    rows={4}
                    placeholder="Enter comma-separated values (e.g. 1.5 sq mm, 2.5 sq mm, 4.0 sq mm, 6.0 sq mm)"
                    value={bulkValuesText}
                    onChange={(e) => setBulkValuesText(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Separate values with commas.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {templateValueInputs.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500 w-5 text-right shrink-0">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={`Value ${idx + 1} (e.g. ${idx === 0 ? '1.5 sq mm' : idx === 1 ? '2.5 sq mm' : '4.0 sq mm'})`}
                        value={val}
                        onChange={(e) => {
                          const updated = [...templateValueInputs];
                          updated[idx] = e.target.value;
                          setTemplateValueInputs(updated);
                        }}
                        className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveValueRow(idx)}
                        disabled={templateValueInputs.length === 1}
                        className={`p-2 rounded-xl transition border ${templateValueInputs.length === 1 ? 'opacity-30 cursor-not-allowed border-transparent text-slate-600' : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border-slate-800'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddValueRow}
                    className="w-full bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 border-dashed py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Another Value</span>
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white border border-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingTemplateId ? 'Update Template' : 'Save Variation Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
