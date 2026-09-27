import React, { useState, useMemo, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { ArrowRightLeft, Plus, Trash2, X, CheckCircle2, Search } from 'lucide-react';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTransfer?: any;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  existingTransfer,
}) => {
  const { products, locations, transferStock, updateStockTransfer, settings } = useErp();

  const isLight = settings?.themeMode === 'light';

  const [fromLocationId, setFromLocationId] = useState(existingTransfer?.fromLocationId || locations?.[1]?.id || locations?.[0]?.id);
  const [toLocationId, setToLocationId] = useState(existingTransfer?.toLocationId || locations?.[0]?.id || locations?.[1]?.id);
  const [shippingCost, setShippingCost] = useState(existingTransfer?.shippingCost?.toString() || '25.00');
  const [notes, setNotes] = useState(existingTransfer?.notes || 'Inter-branch stock rebalance');
  const [status, setStatus] = useState<'completed' | 'in_transit'>(existingTransfer?.status || 'completed');

  const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; unitCost: number }[]>(existingTransfer?.items || []);
  const [productSearch, setProductSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (existingTransfer && isOpen) {
      setFromLocationId(existingTransfer.fromLocationId);
      setToLocationId(existingTransfer.toLocationId);
      setShippingCost(existingTransfer.shippingCost?.toString() || '0');
      setNotes(existingTransfer.notes || '');
      setStatus(existingTransfer.status || 'completed');
      setItems(existingTransfer.items || []);
    } else if (!existingTransfer && isOpen) {
      // Reset to defaults for new transfer
      setFromLocationId(locations[1]?.id || locations[0]?.id);
      setToLocationId(locations[0]?.id || locations[1]?.id);
      setShippingCost('25.00');
      setNotes('Inter-branch stock rebalance');
      setStatus('completed');
      setItems([]);
    }
  }, [existingTransfer, isOpen, locations]);

  if (!isOpen) return null;

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 5);
  }, [productSearch, products]);

  const handleAddItem = (prod: any) => {
    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: 1,
        unitCost: prod.costPrice,
      },
    ]);
    setProductSearch('');
    setShowSearchResults(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromLocationId === toLocationId) {
      alert('Source and destination locations cannot be identical.');
      return;
    }
    if (items.length === 0) return;

    if (existingTransfer) {
      updateStockTransfer(existingTransfer.id, {
        fromLocationId,
        toLocationId,
        items,
        status,
        shippingCost: parseFloat(shippingCost) || 0,
        notes,
      });
    } else {
      transferStock({
        fromLocationId,
        toLocationId,
        items,
        status,
        shippingCost: parseFloat(shippingCost) || 0,
        notes,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-8 shadow-2xl space-y-6 min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span>Inter-Branch Stock Transfer (Logistics)</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold">From (Origin Warehouse/Store) *</label>
              <select
                value={fromLocationId}
                onChange={(e) => setFromLocationId(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none mt-1"
              >
                {locations?.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold">To (Destination Branch) *</label>
              <select
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none mt-1"
              >
                {locations?.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Transfer Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none mt-1"
              >
                <option value="completed">Completed (Immediate Restock)</option>
                <option value="in_transit">In Transit (Logistics Dispatched)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Shipping / Freight Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none mt-1"
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-slate-700 dark:text-slate-300 font-semibold">Search Products</label>
            <div className="relative">
                <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-2.5" />
                <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowSearchResults(true);
                    }}
                    placeholder="Search product..."
                    className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none mt-1"
                />
            </div>
            {showSearchResults && productSearch && (
                <div className="absolute z-10 w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl mt-1 max-h-40 overflow-y-auto">
                    {filteredProducts.map(p => (
                        <button key={p.id} type="button" onClick={() => handleAddItem(p)} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white">
                            {p.name}
                        </button>
                    ))}
                </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                Items To Transfer
            </label>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {items?.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2"
                >
                  <span className="flex-1 text-slate-900 dark:text-white font-bold text-xs">{item.productName}</span>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setItems((prev) =>
                          prev.map((i, iidx) => (iidx === idx ? { ...i, quantity: val } : i))
                        );
                      }}
                      className="w-16 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-center"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-slate-500 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={
                isLight 
                  ? "px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30"
                  : "px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold transition-all hover:bg-slate-300 dark:hover:bg-slate-700"
              }
            >
              {isLight && <X className="w-4 h-4" />}
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Dispatch Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
