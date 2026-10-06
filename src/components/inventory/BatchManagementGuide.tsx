import React, { useState } from 'react';
import { 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Tag, 
  Plus,
  ArrowRight,
  Sliders,
  PackageCheck,
  Boxes,
  Barcode,
  ShoppingBag,
  Info
} from 'lucide-react';

export const BatchManagementGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lots' | 'variable' | 'combo'>('lots');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-950 p-6 sm:p-8 border-b border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Product & Catalog Knowledge Base</h2>
              <p className="text-slate-400 text-sm font-medium">Documentation for Variable Products, Combos/Bundles, and Batch Lots.</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('lots')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'lots'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>1. Lots & Batches</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variable')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'variable'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>2. Variable Products</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('combo')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'combo'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>3. Combos & Bundles</span>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* TAB 1: LOTS & BATCHES */}
        {activeTab === 'lots' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Step 1 */}
            <section className="relative pl-12 border-l-2 border-slate-800 pb-8">
              <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-indigo-500 border-4 border-slate-950 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Entering a Product with a Lot
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                When creating a new product, specify its initial **Batch / Lot Number** (e.g., <code className="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-mono">LOT-2026-001</code>). This connects the current cost and selling price to that specific physical batch of inventory.
              </p>
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Location: <strong>Inventory → Add Product → Lot & Opening Stock</strong></span>
                </div>
              </div>
            </section>

            {/* Step 2 */}
            <section className="relative pl-12 border-l-2 border-slate-800 pb-8">
              <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-indigo-500 border-4 border-slate-950 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                Handling Price Increases across Batches
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                To update the price for a new batch without overwriting old stock history:
              </p>
              <ul className="space-y-3 mb-4">
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <div className="mt-1 p-1 bg-slate-800 rounded-lg"><ArrowRight className="w-3 h-3" /></div>
                  <span>Edit the existing product and change the <strong>Selling Price</strong> or <strong>Cost Price</strong>.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <div className="mt-1 p-1 bg-slate-800 rounded-lg"><ArrowRight className="w-3 h-3" /></div>
                  <span>Enter a <strong>New Lot Number</strong> for this batch (e.g., <code className="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-mono">LOT-2026-002</code>).</span>
                </li>
              </ul>
              <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20">
                <div className="flex items-start gap-3 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>The system automatically archives the old price into the "Lots History" and activates the new price for the incoming batch.</p>
                </div>
              </div>
            </section>

            {/* Step 3 */}
            <section className="relative pl-12 border-l-2 border-slate-800 pb-2">
              <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">3</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Selling: Choosing the Batch in POS
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                When a product with multiple prices (Lots) is scanned or selected in the <strong>POS Terminal</strong>, a prompt allows selecting the active batch:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Popup Detail 1</div>
                  <div className="text-xs text-white font-semibold">Old Price vs New Price</div>
                  <p className="text-[10px] text-slate-500 mt-1">Clearly compare current vs previous batch rates.</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Popup Detail 2</div>
                  <div className="text-xs text-white font-semibold">Select and Add</div>
                  <p className="text-[10px] text-slate-500 mt-1">Choose the specific lot physically available to ensure accurate billing.</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: VARIABLE PRODUCTS */}
        {activeTab === 'variable' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-purple-950/30 p-5 rounded-2xl border border-purple-500/30 space-y-2">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>What is a Variable Product?</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                A <strong>Variable Product</strong> represents a single product item that comes in multiple options or variations (e.g. Size, Color, Flavor, Material, Capacity). Instead of creating separate individual products for "T-Shirt Red S", "T-Shirt Red M", "T-Shirt Blue L", you create <strong>one master variable product</strong> with an automated variation matrix.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="text-purple-400 font-bold text-xs flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  <span>Attribute Matrix</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Define custom attributes (Color: Red, Blue; Size: S, M, L) and click <strong>Auto-Generate Combinations</strong>.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="text-purple-400 font-bold text-xs flex items-center gap-1.5">
                  <Barcode className="w-4 h-4" />
                  <span>Unique SKUs & Barcodes</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Every variation combination gets its own unique SKU and barcode for 1-click POS scanner lookup.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="text-purple-400 font-bold text-xs flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>Individual Pricing & Stock</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Each variation combination can have custom Cost Price, Selling Price, and current stock level.
                </p>
              </div>
            </div>

            {/* How To Steps */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">How to Create Variable Products:</h4>
              <div className="space-y-3">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-bold shrink-0">Step 1</span>
                  <span>Go to <strong>Inventory → Add Product</strong> and select <strong>Product Type: Variable Product</strong>.</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-bold shrink-0">Step 2</span>
                  <span>Select or enter Attribute Names (e.g. <code>Color</code>, <code>Size</code>) and type values separated by commas (e.g. <code>Red, Blue, Green</code>).</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-bold shrink-0">Step 3</span>
                  <span>Click <strong>Auto-Generate Combinations</strong> to generate all variations matrix rows. Edit prices or stock per variation if needed.</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-bold shrink-0">Step 4</span>
                  <span>Click <strong>Create Product</strong>. In POS, scanning a variation barcode automatically picks that exact variation!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMBOS & BUNDLES */}
        {activeTab === 'combo' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-amber-950/30 p-5 rounded-2xl border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <PackageCheck className="w-5 h-5 text-amber-400" />
                <span>What is a Combo / Bundle Product?</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                A <strong>Combo or Bundle Product</strong> is a selling kit or packaged set made up of <strong>two or more existing individual items</strong> from your inventory (e.g. "Computer Desktop Combo" containing 1 Monitor + 1 Keyboard + 1 Mouse + 1 CPU).
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <Boxes className="w-4 h-4" />
                  <span>Bundled Items Assembly</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Select existing catalog products and specify the exact quantity required per bundle kit.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Real-Time Component Deduction</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  When a combo is sold at POS, stock for <strong>each constituent product</strong> is deducted automatically in real time.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>Automated Price Sum</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Subtotals of component items are automatically calculated, allowing custom bundle discount pricing.
                </p>
              </div>
            </div>

            {/* How To Steps */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">How to Create Combo / Bundle Products:</h4>
              <div className="space-y-3">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold shrink-0">Step 1</span>
                  <span>Go to <strong>Inventory → Add Product</strong> and select <strong>Product Type: Combo / Bundle</strong>.</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold shrink-0">Step 2</span>
                  <span>In <strong>Combo Items Assembly</strong>, select individual inventory products from the dropdown and click <strong>+ Add to Combo</strong>.</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold shrink-0">Step 3</span>
                  <span>Adjust the quantity for each component (e.g. 1 Pcs Keyboard, 1 Pcs Mouse). Set your custom combo selling price.</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold shrink-0">Step 4</span>
                  <span>Click <strong>Create Product</strong>. Selling the combo automatically manages inventory across all bundled items!</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-800/30 p-6 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          <HelpCircle className="w-4 h-4" />
          Catalog Engine Active
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">POS</div>
            <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white">ERP</div>
          </div>
        </div>
      </div>
    </div>
  );
};
