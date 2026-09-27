import React from 'react';
import { 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Tag, 
  Plus,
  ArrowRight
} from 'lucide-react';

export const BatchManagementGuide: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 p-8 border-b border-slate-800">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3.5 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
            <Layers className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Lot & Batch Management</h2>
            <p className="text-slate-400 text-sm font-medium">Complete guide to managing price increases and batch tracking.</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-10">
        {/* Step 1 */}
        <section className="relative pl-12 border-l-2 border-slate-800 pb-10">
          <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-indigo-500 border-4 border-slate-950 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">1</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            Entering a Product with a Lot
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            When you create a new product, you can specify its initial **Batch / Lot Number** (e.g., <code className="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-mono">LOT-2024-001</code>). This connects the current cost and selling price to that specific physical batch of inventory.
          </p>
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Location: <strong>Inventory → Add Product</strong></span>
            </div>
          </div>
        </section>

        {/* Step 2 */}
        <section className="relative pl-12 border-l-2 border-slate-800 pb-10">
          <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-indigo-500 border-4 border-slate-950 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">2</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            Handling Price Increases
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            To update the price for a new batch:
          </p>
          <ul className="space-y-3 mb-4">
            <li className="flex items-start gap-3 text-sm text-slate-300">
              <div className="mt-1 p-1 bg-slate-800 rounded-lg"><ArrowRight className="w-3 h-3" /></div>
              <span>Edit the existing product and change the <strong>Selling Price</strong> or <strong>Cost Price</strong>.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-300">
              <div className="mt-1 p-1 bg-slate-800 rounded-lg"><ArrowRight className="w-3 h-3" /></div>
              <span>Enter a <strong>New Lot Number</strong> for this batch (e.g., <code className="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-mono">LOT-2024-002</code>).</span>
            </li>
          </ul>
          <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20">
            <div className="flex items-start gap-3 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>The system will automatically archive the old price into the "Lots History" and activate the new price for the new batch.</p>
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
            Selling: Choosing the Batch
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            When a product with multiple prices (Lots) is scanned or selected in the <strong>POS Terminal</strong>, a popup will automatically appear:
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
              <p className="text-[10px] text-slate-500 mt-1">Choose the specific lot physicaly available to ensure accurate billing.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="bg-slate-800/30 p-6 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          <HelpCircle className="w-4 h-4" />
          Batch Tracking Active
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">POS</div>
            <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">ERP</div>
          </div>
        </div>
      </div>
    </div>
  );
};
