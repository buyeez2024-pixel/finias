import React, { useState } from 'react';
import { Product, ProductLot } from '../../types/erp';
import { useErp } from '../../context/ErpContext';
import { X, Plus, Trash2, CheckCircle2, MapPin, Layers, Info, Hash } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface AddOpeningStockModalProps {
  product: Product;
  onClose: () => void;
}

interface OpeningStockRow {
  id: string;
  variationId?: string;
  variationName?: string;
  lotNumber: string;
  quantity: number;
  unitCost: number;
  date: string;
  note: string;
}

export const AddOpeningStockModal: React.FC<AddOpeningStockModalProps> = ({
  product,
  onClose,
}) => {
  const { locations, updateProduct, showFlashNotification, settings } = useErp();
  const isLight = settings.themeMode === 'light';

  // Selected Location (default to first or default location)
  const defaultLoc = locations.find((l) => l.isDefault) || locations[0] || {
    id: 'loc_main',
    name: 'MS Agencies',
    code: 'BL0001',
  };
  const [selectedLocationId, setSelectedLocationId] = useState<string>(defaultLoc.id);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId) || defaultLoc;

  // Format current date-time e.g., "01-04-2025 13:24" or standard datetime-local
  const getFormattedCurrentDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  // Initialize rows based on product type
  const [rows, setRows] = useState<OpeningStockRow[]>(() => {
    const currentYear = new Date().getFullYear();
    const existingLotsCount = product.lots?.length || 0;

    if (product.type === 'variable' && product.variations && product.variations.length > 0) {
      return product.variations.map((v, idx) => ({
        id: `row_${v.id}`,
        variationId: v.id,
        variationName: v.name,
        lotNumber: `LOT-${currentYear}-${v.sku || String(existingLotsCount + idx + 1).padStart(3, '0')}`,
        quantity: 0,
        unitCost: v.costPrice || product.costPrice || 0,
        date: getFormattedCurrentDate(),
        note: '',
      }));
    }

    return [
      {
        id: `row_${Date.now()}`,
        lotNumber: `LOT-${currentYear}-${String(existingLotsCount + 1).padStart(3, '0')}`,
        quantity: 0,
        unitCost: product.costPrice || 0,
        date: getFormattedCurrentDate(),
        note: '',
      },
    ];
  });

  const handleAddRow = () => {
    const currentYear = new Date().getFullYear();
    const nextIdx = rows.length + (product.lots?.length || 0) + 1;
    setRows((prev) => [
      ...prev,
      {
        id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        lotNumber: `LOT-${currentYear}-${String(nextIdx).padStart(3, '0')}`,
        quantity: 0,
        unitCost: product.costPrice || 0,
        date: getFormattedCurrentDate(),
        note: '',
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowChange = (id: string, field: keyof OpeningStockRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Calculate Total Amount (Exc. Tax)
  const totalAmount = rows.reduce(
    (sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.unitCost) || 0),
    0
  );

  const totalQuantity = rows.reduce(
    (sum, r) => sum + (Number(r.quantity) || 0),
    0
  );

  const handleSave = () => {
    if (totalQuantity <= 0) {
      showFlashNotification('Please enter a valid quantity greater than 0.', 'error');
      return;
    }

    // Build lots from added rows
    const nowIso = new Date().toISOString();
    const currentYear = new Date().getFullYear();
    const newLots: ProductLot[] = rows
      .filter((r) => Number(r.quantity) > 0)
      .map((r, idx) => ({
        id: `lot_op_${Date.now()}_${idx}`,
        lotNumber: (r.lotNumber || '').trim() || `LOT-${currentYear}-${String(idx + 1).padStart(3, '0')}`,
        costPrice: Number(r.unitCost) || product.costPrice,
        sellingPrice: product.sellingPrice,
        currentStock: Number(r.quantity),
        createdDate: nowIso,
      }));

    // Update location stocks
    const currentLocStock = product.locationStocks?.[selectedLocationId] || 0;
    const updatedLocationStocks = {
      ...(product.locationStocks || {}),
      [selectedLocationId]: currentLocStock + totalQuantity,
    };

    // Calculate aggregate current stock across all locations
    const newTotalStock = (Object.values(updatedLocationStocks) as number[]).reduce((a: number, b: number) => a + Number(b || 0), 0);

    // If variable product, update variation stock
    let updatedVariations = product.variations ? [...product.variations] : undefined;
    if (product.type === 'variable' && updatedVariations) {
      rows.forEach((r) => {
        if (r.variationId) {
          const varIndex = updatedVariations!.findIndex((v) => v.id === r.variationId);
          if (varIndex >= 0) {
            const v = updatedVariations![varIndex];
            const vLocStock = (v.locationStocks?.[selectedLocationId] || 0) + Number(r.quantity || 0);
            const vUpdatedLocs = {
              ...(v.locationStocks || {}),
              [selectedLocationId]: vLocStock,
            };
            const vTotal = (Object.values(vUpdatedLocs) as number[]).reduce((a: number, b: number) => a + Number(b || 0), 0);
            updatedVariations![varIndex] = {
              ...v,
              currentStock: vTotal,
              locationStocks: vUpdatedLocs,
              costPrice: Number(r.unitCost) || v.costPrice,
            };
          }
        }
      });
    }

    const updatedLots = [...(product.lots || []), ...newLots];

    updateProduct(product.id, {
      currentStock: newTotalStock,
      locationStocks: updatedLocationStocks,
      lots: updatedLots,
      variations: updatedVariations,
      costPrice: Number(rows[0]?.unitCost) || product.costPrice,
    });

    showFlashNotification(
      `Opening stock of ${totalQuantity} ${product.unit || 'Pcs'} added across ${newLots.length} lot(s) for ${product.name} at ${selectedLocation.name}!`,
      'success'
    );

    onClose();
  };

  // Determine active depletion strategy
  const accountingMethod = (settings.accountingMethod || 'fifo').toUpperCase();
  const existingLots = product.lots || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className={`rounded-2xl w-full max-w-6xl shadow-2xl border overflow-hidden flex flex-col my-8 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        
        {/* Header Bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Add Opening Stock
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Initialize opening inventory layers and assign traceable Lot Numbers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition cursor-pointer flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 text-white active:scale-95"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-x-auto">
          {/* Location & SKU Top Bar */}
          <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950/60 border-slate-800 text-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-extrabold ${isLight ? 'text-indigo-950' : 'text-indigo-300'}`}>
                Location:
              </span>
              {locations.length > 1 ? (
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className={`text-sm font-bold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight
                      ? 'bg-[#cbd5e1] text-black border-[#cbd5e1]'
                      : 'bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code || loc.id})
                    </option>
                  ))}
                </select>
              ) : (
                <span className={`text-sm font-bold ${isLight ? 'text-black' : 'text-slate-300'}`}>
                  {selectedLocation.name} ({selectedLocation.code || 'BL0001'})
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <div className={`${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                SKU: <span className={`font-mono font-bold ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>{product.sku}</span>
              </div>
              <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5 font-medium">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  accountingMethod === 'FIFO'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {accountingMethod} Depletion
                </span>
              </div>
            </div>
          </div>

          {/* Information & Active Lots Notice */}
          <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
            isLight ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950' : 'bg-indigo-950/30 border-indigo-900/50 text-indigo-200'
          }`}>
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  <span className="font-bold">Lot-Based Inventory Tracking:</span> Each entry creates a traceable Lot Number. Sales and POS checkouts will automatically deduct stock from these lot numbers in order ({accountingMethod === 'FIFO' ? 'Oldest lot first' : 'Newest lot first'}) or via direct lot selection.
                </p>
              </div>
            </div>
          </div>

          {/* Display Existing Lots If Any Exist */}
          {existingLots.length > 0 && (
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    Active Lots in Inventory ({existingLots.length})
                  </span>
                </div>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Stock will be deducted from active lots in sequence
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {existingLots.map((lot, idx) => {
                  const isDeductingNext = idx === 0 && (lot.currentStock || 0) > 0;
                  const isDepleted = (lot.currentStock || 0) <= 0;
                  return (
                    <div
                      key={lot.id || idx}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                        isLight
                          ? 'bg-emerald-50/80 text-emerald-950 border-emerald-300 ring-2 ring-emerald-400/30 shadow-sm'
                          : isDepleted
                          ? 'bg-slate-900/50 text-slate-500 border-slate-800 opacity-60'
                          : isDeductingNext
                          ? 'bg-emerald-950/40 text-emerald-200 border-emerald-700/60 ring-1 ring-emerald-600/40'
                          : 'bg-slate-900 text-slate-200 border-slate-700'
                      }`}
                    >
                      <span className={`font-bold ${isLight ? 'text-black' : 'text-slate-100'}`}>
                        {lot.lotNumber}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-sans font-extrabold tracking-tight ${
                          isLight
                            ? isDepleted
                              ? 'bg-slate-200 text-slate-600 border border-slate-300'
                              : isDeductingNext
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {lot.currentStock ?? 0} {product.unit || 'Pcs'}
                      </span>
                      {isDeductingNext && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-sans font-extrabold uppercase bg-emerald-600 text-white tracking-wider">
                          Deducting Next
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Table matching the reference screenshot with Lot Number column */}
          <div className={`border rounded-lg overflow-hidden shadow-sm ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#20c997] text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-[20%]">Product Name</th>
                  <th className="py-3 px-3 w-[15%]">Lot / Batch No.</th>
                  <th className="py-3 px-3 w-[16%]">Quantity Remaining</th>
                  <th className="py-3 px-3 w-[14%]">Unit Cost (Before Tax)</th>
                  <th className="py-3 px-3 w-[13%] text-center">Subtotal (Before Tax)</th>
                  <th className="py-3 px-3 w-[11%]">Date</th>
                  <th className="py-3 px-4 w-[8%]">Note</th>
                  <th className="py-3 px-3 w-[3%] text-center"></th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isLight
                  ? 'bg-white text-slate-800 divide-slate-200'
                  : 'bg-slate-900 text-slate-200 divide-slate-800'
              }`}>
                {rows.map((row, index) => {
                  const subtotal = (Number(row.quantity) || 0) * (Number(row.unitCost) || 0);

                  return (
                    <tr key={row.id}>
                      {/* Product Name / Variation */}
                      <td className="py-4 px-4 font-semibold align-middle">
                        <div className="text-slate-900 dark:text-white font-bold">
                          {row.variationName ? `${product.name} - ${row.variationName}` : product.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          SKU: {product.sku}
                        </div>
                      </td>

                      {/* Lot / Batch Number */}
                      <td className="py-4 px-3 align-middle">
                        <input
                          type="text"
                          value={row.lotNumber}
                          placeholder="e.g. LOT-2026-001"
                          onChange={(e) => handleRowChange(row.id, 'lotNumber', e.target.value)}
                          className={`opening-stock-input w-full px-2.5 py-2 text-xs font-mono font-bold border rounded-lg focus:outline-none focus:border-indigo-500 ${
                            isLight
                              ? '!bg-[#cbd5e1] !border-[#cbd5e1] !text-black placeholder:text-slate-600'
                              : 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500'
                          }`}
                        />
                      </td>

                      {/* Quantity Remaining input with unit badge */}
                      <td className="py-4 px-3 align-middle">
                        <div
                          className={`opening-stock-qty-container flex items-center border rounded-lg overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 ${
                            isLight
                              ? '!bg-[#cbd5e1] !border-[#cbd5e1]'
                              : 'bg-slate-950 border-slate-700'
                          }`}
                        >
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.quantity === 0 ? '' : row.quantity}
                            placeholder="0.00"
                            onChange={(e) =>
                              handleRowChange(row.id, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className={`opening-stock-qty-input w-full px-2.5 py-2 text-xs font-mono font-bold focus:outline-none ${
                              isLight ? '!bg-[#cbd5e1] !text-black placeholder:text-slate-600' : 'bg-transparent text-white placeholder:text-slate-600'
                            }`}
                          />
                          <span
                            id="opening-stock-unit-badge"
                            className={`opening-stock-unit-badge px-2.5 py-2 text-xs font-bold shrink-0 border-l ${
                              isLight
                                ? '!bg-[#cbd5e1] !text-black !border-[#94a3b8]'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                            style={isLight ? { backgroundColor: '#cbd5e1', color: '#000000', borderLeftColor: '#94a3b8' } : undefined}
                          >
                            {product.unit || 'Pcs'}
                          </span>
                        </div>
                      </td>

                      {/* Unit Cost (Before Tax) */}
                      <td className="py-4 px-3 align-middle">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.unitCost === 0 ? '' : row.unitCost}
                          placeholder="0.00"
                          onChange={(e) =>
                            handleRowChange(row.id, 'unitCost', parseFloat(e.target.value) || 0)
                          }
                          className={`opening-stock-input w-full px-3 py-2 text-xs font-mono font-bold border rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${
                            isLight
                              ? '!bg-[#cbd5e1] !border-[#cbd5e1] !text-black placeholder:text-slate-600'
                              : 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600'
                          }`}
                        />
                      </td>

                      {/* Subtotal (Before Tax) */}
                      <td className={`py-4 px-3 font-mono font-bold text-center align-middle text-sm ${
                        isLight ? 'text-black' : 'text-indigo-300'
                      }`}>
                        {subtotal.toFixed(2)}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-3 align-middle">
                        <input
                          type="text"
                          value={row.date}
                          onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                          className={`opening-stock-input w-full px-2.5 py-2 text-[11px] font-mono font-medium border rounded-lg focus:outline-none focus:border-indigo-500 ${
                            isLight
                              ? '!bg-[#cbd5e1] !border-[#cbd5e1] !text-black'
                              : 'bg-slate-950 border-slate-700 text-slate-300'
                          }`}
                        />
                      </td>

                      {/* Note */}
                      <td className="py-4 px-4 align-middle">
                        <textarea
                          rows={2}
                          value={row.note}
                          placeholder="Add note..."
                          onChange={(e) => handleRowChange(row.id, 'note', e.target.value)}
                          className={`opening-stock-input w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:border-indigo-500 resize-y ${
                            isLight
                              ? '!bg-[#cbd5e1] !border-[#cbd5e1] !text-black placeholder:text-slate-600'
                              : 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600'
                          }`}
                        />
                      </td>

                      {/* Action (+ or delete) */}
                      <td className="py-4 px-3 text-center align-middle">
                        <div className="flex items-center justify-center gap-1">
                          {index === rows.length - 1 ? (
                            <button
                              type="button"
                              onClick={handleAddRow}
                              className="w-7 h-7 flex items-center justify-center rounded-md border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                              title="Add another batch/entry row"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-md border border-rose-400 text-rose-500 bg-rose-50/50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                              title="Remove row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Total Amount (Exc. Tax) Summary Section */}
            <div className={`p-4 border-t flex flex-col items-center justify-center text-center ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <span className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Total Amount (Exc. Tax):
              </span>
              <span className={`text-lg font-black font-mono mt-0.5 ${
                isLight ? 'text-indigo-600' : 'text-indigo-400'
              }`}>
                {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900'
        }`}>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 font-bold rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 text-white transition cursor-pointer active:scale-95 flex items-center gap-2"
          >
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95 flex items-center justify-center ${
              isLight
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            <span>Close</span>
          </button>
        </div>

      </div>
    </div>
  );
};
