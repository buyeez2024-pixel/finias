import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { StockAdjustmentItem } from '../../types/erp';
import { AlertTriangle, Plus, Trash2, X, CheckCircle2, Search, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { products, locations, selectedLocationId, adjustStock, settings, currentUser } = useErp();

  const [locationId, setLocationId] = useState(selectedLocationId || locations[0]?.id || 'loc_main');
  const [adjustmentType, setAdjustmentType] = useState<'normal' | 'abnormal'>('normal');
  const [reason, setReason] = useState('Stock audit discrepancy / Physical inventory count');
  const [recoveredAmount, setRecoveredAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<StockAdjustmentItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const isLight = settings.themeMode === 'light';

  if (!isOpen) return null;

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 6);
  }, [productSearch, products]);

  const handleAddItem = (prod: any) => {
    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: 1,
        unitCost: prod.costPrice || 0,
        subtotal: prod.costPrice || 0,
        type: 'damage',
      },
    ]);
    setProductSearch('');
    setShowSearchResults(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalAdjustmentAmount = items.reduce((sum, item) => {
    const cost = item.unitCost || 0;
    const qty = item.quantity || 0;
    return sum + (cost * qty);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    adjustStock({
      locationId,
      adjustmentType,
      items: items.map(i => ({
        ...i,
        subtotal: (i.unitCost || 0) * (i.quantity || 1),
      })),
      totalAmount: totalAdjustmentAmount,
      totalAmountRecovered: Number(recoveredAmount) || 0,
      reason,
      notes: notes || undefined,
      adjustedBy: currentUser?.name || 'Sarah Jenkins',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className={`border rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Add Stock Adjustment</span>
          </h3>
          <button 
            onClick={onClose} 
            className={`p-1.5 rounded-lg border transition ${
              isLight 
                ? 'text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200' 
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold`}>Business Location *</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none mt-1 ${
                  isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                }`}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold`}>Adjustment Type *</label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as 'normal' | 'abnormal')}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none mt-1 ${
                  isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                }`}
              >
                <option value="normal">Normal (Routine leakages, minor discrepancies)</option>
                <option value="abnormal">Abnormal (Fire, theft, accident, flood)</option>
              </select>
            </div>

            <div>
              <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold`}>Total Amount Recovered ({settings.currencySymbol})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={recoveredAmount}
                onChange={(e) => setRecoveredAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00 (Insurance/Salvage)"
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none mt-1 ${
                  isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold`}>Reason / Reference Cause</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none mt-1 ${
                  isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                }`}
                placeholder="e.g., Physical cycle count variance"
              />
            </div>

            <div>
              <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold`}>Additional Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none mt-1 ${
                  isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                }`}
                placeholder="Internal audit notes..."
              />
            </div>
          </div>

          <div className="relative">
            <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold`}>Search Product to Adjust</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowSearchResults(true);
                }}
                placeholder="Type SKU or product name to add..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl border focus:outline-none mt-1 ${
                  isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                }`}
              />
            </div>
            {showSearchResults && productSearch && (
              <div className={`absolute z-20 w-full border rounded-xl mt-1 max-h-48 overflow-y-auto shadow-2xl ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-700'
              }`}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddItem(p)}
                      className={`w-full text-left px-4 py-2 flex items-center justify-between border-b last:border-0 ${
                        isLight ? 'hover:bg-slate-50 text-slate-900 border-slate-100' : 'hover:bg-slate-800 text-white border-slate-900'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>SKU: {p.sku} | In Stock: {p.currentStock}</div>
                      </div>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">{formatCurrency(p.costPrice || 0, settings)}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-500 dark:text-slate-400 text-center">No matching products found</div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`${isLight ? 'text-slate-600' : 'text-slate-300'} font-bold uppercase tracking-wider text-[11px]`}>
                Products To Adjust ({items.length})
              </label>
              {items.length > 0 && (
                <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Total Adjusted Cost: <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalAdjustmentAmount, settings)}</span>
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <div className={`border border-dashed rounded-xl p-6 text-center ${
                isLight ? 'bg-slate-50/60 border-slate-200 text-slate-500' : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}>
                Search and select products above to add them to this stock adjustment.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex flex-wrap items-center gap-2 ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex-1 min-w-[160px]">
                      <div className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.productName}</div>
                      {item.sku && <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.sku}</div>}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={item.type}
                        onChange={(e) => {
                          const t = e.target.value as any;
                          setItems((prev) =>
                            prev.map((i, iidx) => (iidx === idx ? { ...i, type: t } : i))
                          );
                        }}
                        className={`px-2 py-1.5 rounded-lg border text-xs font-medium ${
                          isLight ? 'bg-slate-50 text-amber-700 border-slate-200' : 'bg-slate-900 text-amber-300 border-slate-700'
                        }`}
                      >
                        <option value="damage">Damaged (-)</option>
                        <option value="expired">Expired (-)</option>
                        <option value="audit_loss">Audit Loss (-)</option>
                        <option value="found">Found (+)</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px]">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setItems((prev) =>
                              prev.map((i, iidx) => (iidx === idx ? { ...i, quantity: val, subtotal: (i.unitCost || 0) * val } : i))
                            );
                          }}
                          className={`w-16 font-bold px-2 py-1.5 rounded-lg border text-center text-xs ${
                            isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-700'
                          }`}
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px]">Cost:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setItems((prev) =>
                              prev.map((i, iidx) => (iidx === idx ? { ...i, unitCost: val, subtotal: val * (i.quantity || 1) } : i))
                            );
                          }}
                          className={`w-20 font-bold px-2 py-1.5 rounded-lg border text-right text-xs ${
                            isLight ? 'bg-slate-50 text-amber-700 border-slate-200' : 'bg-slate-900 text-amber-300 border-slate-700'
                          }`}
                        />
                      </div>

                      <div className={`w-20 text-right font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                        {formatCurrency((item.unitCost || 0) * (item.quantity || 1), settings)}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Net Financial Loss: <span className="font-bold text-rose-500 dark:text-rose-400">{formatCurrency(Math.max(0, totalAdjustmentAmount - (Number(recoveredAmount) || 0)), settings)}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg active:scale-95 flex items-center justify-center gap-1.5 border ${
                  isLight 
                    ? 'bg-slate-900 hover:bg-slate-850 text-slate-100 border-slate-800' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={items.length === 0}
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed border ${
                  isLight
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm hover:bg-indigo-700 hover:border-indigo-700'
                    : 'bg-amber-500 hover:bg-amber-400 text-black border-transparent shadow-lg shadow-amber-500/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Stock Adjustment</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
