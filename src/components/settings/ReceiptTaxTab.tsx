import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { Receipt, Percent, Save, Check, Printer, Sparkles } from 'lucide-react';

export const ReceiptTaxTab: React.FC = () => {
  const { settings, updateSettings } = useErp();
  const [taxRate, setTaxRate] = useState<number>(settings.defaultTaxRate || 8.25);
  const [header, setHeader] = useState<string>(settings.receiptHeader || 'THANK YOU FOR SHOPPING WITH US');
  const [footer, setFooter] = useState<string>(
    settings.receiptFooter || 'Goods once sold can be returned within 14 days with original receipt.'
  );
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      defaultTaxRate: Number(taxRate),
      receiptHeader: header,
      receiptFooter: footer,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 w-full max-w-full min-w-0">
      {/* Form Area */}
      <form onSubmit={handleSave} className="lg:col-span-7 space-y-4 sm:space-y-6 w-full min-w-0">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm dark:shadow-xl w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <span>Tax Rules & POS Receipt Formatting</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize the automated sales tax calculation and header/footer branding on 80mm thermal receipts.
              </p>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Saved!' : 'Save Settings'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Default Sales Tax Rate (%)</label>
              <div className="relative max-w-xs">
                <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Applied automatically to all taxable POS cart checkouts and standard invoice orders.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Thermal Receipt Header Greeting</label>
              <textarea
                rows={2}
                value={header}
                onChange={(e) => setHeader(e.target.value)}
                placeholder="e.g. THANK YOU FOR SHOPPING WITH ROYAL POS"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Receipt Footer & Return Policy</label>
              <textarea
                rows={3}
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                placeholder="e.g. Return policy, social handles, website..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Live Thermal Receipt Preview Simulator */}
      <div className="lg:col-span-5 space-y-4 w-full min-w-0">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm dark:shadow-xl w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                Live 80mm Thermal Receipt Preview
              </h4>
            </div>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
              Simulated
            </span>
          </div>

          {/* Paper Slip */}
          <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-xl font-mono text-[11px] leading-relaxed border-t-8 border-indigo-600">
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-0.5">
              <h4 className="font-black text-sm uppercase tracking-wider">{settings.name}</h4>
              <p className="text-[10px] text-slate-600">{settings.address}</p>
              <p className="text-[10px] text-slate-600">Tel: {settings.phone}</p>
              <p className="text-[10px] font-bold text-slate-800 mt-1">Tax ID: {settings.taxNumber}</p>
              <p className="text-[10px] font-bold text-indigo-700 mt-1 uppercase tracking-wide">
                *** {header || 'THANK YOU'} ***
              </p>
            </div>

            {/* Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-0.5 text-[10px] text-slate-600">
              <div className="flex justify-between">
                <span>Receipt: #INV-2026-088</span>
                <span>2026-08-18 14:22</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier: Alex Rivera</span>
                <span>Station: POS-01</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5">
              <div className="flex justify-between font-bold text-[10px] text-slate-500 uppercase">
                <span>Item / Qty</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="font-bold">Organic Cold-Brew 12oz</p>
                  <span className="text-[10px] text-slate-500">2 @ {settings.currencySymbol}4.50</span>
                </div>
                <span className="font-bold">{settings.currencySymbol}9.00</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="font-bold">Artisan Croissant</p>
                  <span className="text-[10px] text-slate-500">1 @ {settings.currencySymbol}3.75</span>
                </div>
                <span className="font-bold">{settings.currencySymbol}3.75</span>
              </div>
            </div>

            {/* Totals Calculation with configured Tax */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{settings.currencySymbol}12.75</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Sales Tax ({taxRate}%):</span>
                <span>{settings.currencySymbol}{(12.75 * (taxRate / 100)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-300">
                <span>TOTAL:</span>
                <span>{settings.currencySymbol}{(12.75 * (1 + taxRate / 100)).toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-600 space-y-1">
              <p className="leading-snug">{footer}</p>
              <div className="pt-2 flex justify-center">
                <div className="h-6 w-36 bg-slate-800 rounded flex items-center justify-center text-white text-[9px] font-mono tracking-widest">
                  ||||| |||| || |||||
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
