const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/ProductFormPage.tsx', 'utf8');

const dupStart = `                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Purchase Cost Price ({settings.currencySymbol}) *
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/50 transition group">
                    <div className="bg-slate-900 border-r border-slate-800 px-3 py-2.5 text-emerald-400 font-mono font-bold text-xs select-none shrink-0 flex items-center justify-center min-w-[36px]">
                      {settings.currencySymbol}
                    </div>
                    <input
                      id="prod-input-cost-price"
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent text-emerald-400 font-mono font-bold text-sm px-3 py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Retail Selling Price ({settings.currencySymbol}) *
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition group">
                    <div className="bg-slate-900 border-r border-slate-800 px-3 py-2.5 text-indigo-400 font-mono font-bold text-xs select-none shrink-0 flex items-center justify-center min-w-[36px]">
                      {settings.currencySymbol}
                    </div>
                    <input
                      id="prod-input-selling-price"
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent text-white font-mono font-bold text-sm px-3 py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Batch / Lot Number *
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 overflow-hidden focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/50 transition">
                    <div className="bg-slate-900 border-r border-slate-800 px-3 py-2.5 text-amber-400 shrink-0 flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="prod-input-lot-number"
                      type="text"
                      value={lotNumber}
                      onChange={(e) => setLotNumber(e.target.value)}
                      placeholder="LOT-2024-001"
                      className="w-full bg-transparent text-white font-mono font-bold text-sm px-3 py-2.5 focus:outline-none"
                    />
                  </div>
                </div>`;

const lastIdx = content.lastIndexOf(dupStart);
if (lastIdx !== -1) {
    content = content.substring(0, lastIdx) + content.substring(lastIdx + dupStart.length);
    fs.writeFileSync('src/components/inventory/ProductFormPage.tsx', content);
    console.log("Removed duplicate!");
} else {
    console.log("Not found.");
}
