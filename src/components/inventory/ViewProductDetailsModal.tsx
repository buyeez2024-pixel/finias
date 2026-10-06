import React from 'react';
import { Product } from '../../types/erp';
import { useErp } from '../../context/ErpContext';
import { formatCurrency } from '../../utils/formatters';
import { X, Printer, Monitor, Leaf, History } from 'lucide-react';

interface ViewProductDetailsModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onOpenHistory?: (product: Product) => void;
}

const getThemeClasses = (accent: string = 'indigo') => {
  switch (accent) {
    case 'emerald':
      return {
        headerBg: 'bg-emerald-600 text-white',
        buttonBg: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 text-white',
        textAccent: 'text-emerald-400',
      };
    case 'violet':
      return {
        headerBg: 'bg-violet-600 text-white',
        buttonBg: 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30 text-white',
        textAccent: 'text-violet-400',
      };
    case 'amber':
      return {
        headerBg: 'bg-amber-600 text-white',
        buttonBg: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 text-white',
        textAccent: 'text-amber-400',
      };
    case 'rose':
      return {
        headerBg: 'bg-rose-600 text-white',
        buttonBg: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 text-white',
        textAccent: 'text-rose-400',
      };
    case 'cyan':
      return {
        headerBg: 'bg-cyan-600 text-white',
        buttonBg: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30 text-white',
        textAccent: 'text-cyan-400',
      };
    case 'orange':
      return {
        headerBg: 'bg-orange-600 text-white',
        buttonBg: 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/30 text-white',
        textAccent: 'text-orange-400',
      };
    case 'teal':
      return {
        headerBg: 'bg-teal-600 text-white',
        buttonBg: 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/30 text-white',
        textAccent: 'text-teal-400',
      };
    case 'fuchsia':
      return {
        headerBg: 'bg-fuchsia-600 text-white',
        buttonBg: 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-600/30 text-white',
        textAccent: 'text-fuchsia-400',
      };
    case 'sky':
      return {
        headerBg: 'bg-sky-600 text-white',
        buttonBg: 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30 text-white',
        textAccent: 'text-sky-400',
      };
    case 'lime':
      return {
        headerBg: 'bg-lime-600 text-white',
        buttonBg: 'bg-lime-600 hover:bg-lime-500 shadow-lime-600/30 text-white',
        textAccent: 'text-lime-400',
      };
    case 'indigo':
    default:
      return {
        headerBg: 'bg-indigo-600 text-white',
        buttonBg: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 text-white',
        textAccent: 'text-indigo-400',
      };
  }
};

export const ViewProductDetailsModal: React.FC<ViewProductDetailsModalProps> = ({
  isOpen,
  product,
  onClose,
  onOpenHistory,
}) => {
  const { settings, locations = [], transactions = [], stockTransfers = [], stockAdjustments = [] } = useErp();

  if (!isOpen || !product) return null;

  const isLight = settings.themeMode === 'light';
  const accent = settings.themeAccent || 'indigo';
  const theme = getThemeClasses(accent);

  const cost = product.costPrice ?? 0;
  const price = product.sellingPrice ?? 0;
  const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(2) : '0.00';
  const isVariableProduct = product.type === 'variable' || (Array.isArray(product.variations) && product.variations.length > 0);
  const variationsList = isVariableProduct && product.variations && product.variations.length > 0 ? product.variations : [];
  
  const totalVariationsStock = variationsList.reduce((sum, v) => sum + (Number(v.currentStock ?? v.openingStock) || 0), 0);
  const totalVariationsStockValue = variationsList.reduce((sum, v) => sum + ((Number(v.currentStock ?? v.openingStock) || 0) * (v.sellingPrice ?? price)), 0);

  const currentStock = isVariableProduct && variationsList.length > 0
    ? totalVariationsStock
    : Number(product.currentStock ?? product.stock ?? 0);
  const stockValue = isVariableProduct && variationsList.length > 0
    ? totalVariationsStockValue
    : currentStock * price;

  const defaultLocationName = locations.find((l) => l.id === product.locationId || l.id === product.branchId)?.name || locations[0]?.name || 'MS Agencies';

  const totalSold = (transactions || []).reduce((acc, t) => {
    if ((t.type === 'sale' || t.type === 'pos_sale') && (t.status === 'final' || t.status === 'completed' || t.paymentStatus === 'paid')) {
      const item = t.items?.find((i) => i.productId === product.id || i.name === product.name);
      if (item) return acc + (Number(item.quantity) || 0);
    }
    return acc;
  }, 0);

  const totalTransferred = (stockTransfers || []).reduce((acc, st) => {
    if (st.status === 'completed' && Array.isArray(st.items)) {
      const item = st.items.find((i: any) => i.productId === product.id || i.name === product.name);
      if (item) return acc + (Number(item.quantity) || 0);
    }
    return acc;
  }, 0);

  const totalAdjusted = (stockAdjustments || []).reduce((acc, sa) => {
    if (Array.isArray(sa.items)) {
      const item = sa.items.find((i: any) => i.productId === product.id || i.name === product.name);
      if (item) return acc + (Number(item.quantity) || 0);
    }
    return acc;
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`border rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        
        {/* Header Title Bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 z-20 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <h2 className={`text-lg font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition cursor-pointer flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 text-white active:scale-95"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs">
          
          {/* Top Info Grid (3 columns + graphic) */}
          <div className={`p-6 rounded-2xl border items-center grid grid-cols-1 lg:grid-cols-12 gap-6 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            
            <div className="lg:col-span-3 space-y-2">
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>SKU:</span> <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{product.sku}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Brand:</span> <span className={isLight ? 'text-slate-900' : 'text-slate-200'}>{product.brand || '--'}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Unit:</span> <span className={isLight ? 'text-slate-900' : 'text-slate-200'}>{product.unit || 'Pc(s)'}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Barcode Type:</span> <span className={`font-mono ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>C128</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Available in locations:</span> <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>MS Agencies</span></div>
            </div>

            <div className="lg:col-span-3 space-y-2">
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Category:</span> <span className={isLight ? 'text-slate-900' : 'text-slate-200'}>{product.category || '--'}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Sub category:</span> <span className={isLight ? 'text-slate-900' : 'text-slate-200'}>{product.subCategory || '--'}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Manage Stock?:</span> <span className="text-emerald-600 font-bold">Yes</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Alert quantity:</span> <span className={`font-mono ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{(product.alertQuantity || 0).toFixed(4)}</span></div>
            </div>

            <div className="lg:col-span-3 space-y-2">
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Expires in:</span> <span className={isLight ? 'text-slate-900' : 'text-slate-200'}>Not Applicable</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Applicable Tax:</span> <span className={isLight ? 'text-slate-900' : 'text-slate-200'}>{product.taxRate ? `${product.taxRate}%` : 'None'}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Selling Price Tax Type:</span> <span className={`capitalize ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{product.taxType || 'Inclusive'}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Product Type:</span> <span className={`font-bold capitalize ${theme.textAccent}`}>{product.type || 'Single'}</span></div>
            </div>

            <div className={`lg:col-span-3 flex items-center justify-center p-4 rounded-xl border gap-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-xl" />
              ) : (
                <div className={`flex items-center gap-3 ${theme.textAccent}`}>
                  <Monitor className="w-12 h-12 opacity-80" />
                  <Leaf className="w-10 h-10 text-emerald-500 opacity-90" />
                </div>
              )}
            </div>

          </div>

          {/* Default Pricing Table */}
          <div className={`rounded-xl border overflow-hidden shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <table className="w-full text-left text-xs">
              <thead className={`${theme.headerBg} font-bold uppercase text-[10px] tracking-wider`}>
                <tr>
                  {isVariableProduct && variationsList.length > 0 && (
                    <th className="py-3 px-4">Variation</th>
                  )}
                  {isVariableProduct && variationsList.length > 0 && (
                    <th className="py-3 px-4">SKU</th>
                  )}
                  <th className="py-3 px-4">Default Purchase Price (Exc. tax)</th>
                  <th className="py-3 px-4">Default Purchase Price (Inc. tax)</th>
                  <th className="py-3 px-4">x Margin(%)</th>
                  <th className="py-3 px-4">Default Selling Price (Exc. tax)</th>
                  <th className="py-3 px-4">Default Selling Price (Inc. tax)</th>
                  <th className="py-3 px-4">Variation Images</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${
                isLight ? 'divide-slate-200 bg-white text-slate-900' : 'divide-slate-800 bg-slate-950 text-slate-200'
              }`}>
                {isVariableProduct && variationsList.length > 0 ? (
                  variationsList.map((v, idx) => {
                    const vCost = v.costPrice ?? cost;
                    const vCostInc = v.costPriceIncTax ?? (product.taxRate ? vCost * (1 + product.taxRate / 100) : vCost);
                    const vPrice = v.sellingPrice ?? price;
                    const vPriceInc = v.sellingPriceIncTax ?? (product.taxRate ? vPrice * (1 + product.taxRate / 100) : vPrice);
                    const vMargin = v.margin !== undefined ? Number(v.margin).toFixed(2) : (vPrice > 0 ? (((vPrice - vCost) / vPrice) * 100).toFixed(2) : margin);
                    const vSku = v.sku || `${product.sku}-${idx + 1}`;
                    const vValue = v.value || v.name?.replace(/^.*:\s*/, '') || `Variation #${idx + 1}`;

                    return (
                      <tr key={v.id || idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          <span className="inline-block px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-lg text-xs">
                            {vValue}
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-bold ${theme.textAccent}`}>{vSku}</td>
                        <td className="py-3 px-4">{formatCurrency(vCost, settings)}</td>
                        <td className="py-3 px-4">{formatCurrency(vCostInc, settings)}</td>
                        <td className={`py-3 px-4 font-bold ${theme.textAccent}`}>{vMargin}%</td>
                        <td className="py-3 px-4">{formatCurrency(vPrice, settings)}</td>
                        <td className="py-3 px-4">{formatCurrency(vPriceInc, settings)}</td>
                        <td className="py-3 px-4">
                          {v.image ? (
                            <img src={v.image} alt={vValue} className="w-9 h-9 object-cover rounded-lg border border-slate-700 bg-slate-900" />
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="py-3 px-4">{formatCurrency(cost, settings)}</td>
                    <td className="py-3 px-4">{formatCurrency(cost, settings)}</td>
                    <td className={`py-3 px-4 font-bold ${theme.textAccent}`}>{margin}</td>
                    <td className="py-3 px-4">{formatCurrency(price, settings)}</td>
                    <td className="py-3 px-4">{formatCurrency(price, settings)}</td>
                    <td className="py-3 px-4 text-slate-400">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Product Stock Details Section */}
          <div className="space-y-3">
            <h3 className={`font-extrabold text-sm tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>Product Stock Details</h3>
            
            <div className={`rounded-xl border overflow-hidden shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <table className="w-full text-left text-xs">
                <thead className={`${theme.headerBg} font-bold uppercase text-[10px] tracking-wider`}>
                  <tr>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Unit Price</th>
                    <th className="py-3 px-3">Current stock</th>
                    <th className="py-3 px-3">Current stock Value</th>
                    <th className="py-3 px-3">Total unit sold</th>
                    <th className="py-3 px-3">Total Unit Transferred</th>
                    <th className="py-3 px-3">Total Unit Adjusted</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-mono ${
                  isLight ? 'divide-slate-200 bg-white text-slate-900' : 'divide-slate-800 bg-slate-950 text-slate-200'
                }`}>
                  {isVariableProduct && variationsList.length > 0 ? (
                    <>
                      {variationsList.map((v, idx) => {
                        const vSku = v.sku || `${product.sku}-${idx + 1}`;
                        const vPrice = v.sellingPrice ?? price;
                        const vStock = Number(v.currentStock ?? v.openingStock ?? 0);
                        const vStockVal = vStock * vPrice;
                        const vValue = v.value || v.name?.replace(/^.*:\s*/, '') || `Variation #${idx + 1}`;

                        return (
                          <tr key={v.id || idx} className="hover:bg-slate-900/40 transition-colors">
                            <td className={`py-3 px-3 font-bold ${theme.textAccent}`}>{vSku}</td>
                            <td className={`py-3 px-3 font-sans font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              <div className="flex items-center gap-1.5">
                                <span>{product.name}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                  {vValue}
                                </span>
                              </div>
                            </td>
                            <td className={`py-3 px-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{defaultLocationName}</td>
                            <td className="py-3 px-3">{formatCurrency(vPrice, settings)}</td>
                            <td className="py-3 px-3 font-bold text-emerald-600">{vStock.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                            <td className="py-3 px-3 font-bold text-amber-500">{formatCurrency(vStockVal, settings)}</td>
                            <td className="py-3 px-3">0.00 {product.unit || 'Pc(s)'}</td>
                            <td className="py-3 px-3">0.00 {product.unit || 'Pc(s)'}</td>
                            <td className="py-3 px-3">0.00 {product.unit || 'Pc(s)'}</td>
                          </tr>
                        );
                      })}
                      {/* Summary Total Row for Variable Product */}
                      <tr className={`font-bold ${isLight ? 'bg-slate-100/90 text-slate-950' : 'bg-slate-900/90 text-white'}`}>
                        <td className={`py-3 px-3 ${theme.textAccent}`}>Total</td>
                        <td className="py-3 px-3 font-sans">{product.name} ({variationsList.length} Variations)</td>
                        <td className="py-3 px-3">All Locations</td>
                        <td className="py-3 px-3 text-slate-500">—</td>
                        <td className="py-3 px-3 font-bold text-emerald-500">{totalVariationsStock.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                        <td className="py-3 px-3 font-bold text-amber-400">{formatCurrency(totalVariationsStockValue, settings)}</td>
                        <td className="py-3 px-3">{totalSold.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                        <td className="py-3 px-3">{totalTransferred.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                        <td className="py-3 px-3">{totalAdjusted.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td className={`py-3 px-3 font-bold ${theme.textAccent}`}>{product.sku}</td>
                      <td className={`py-3 px-3 font-sans font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{product.name}</td>
                      <td className={`py-3 px-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{defaultLocationName}</td>
                      <td className="py-3 px-3">{formatCurrency(price, settings)}</td>
                      <td className="py-3 px-3 font-bold text-emerald-600">{currentStock.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                      <td className="py-3 px-3 font-bold text-amber-500">{formatCurrency(stockValue, settings)}</td>
                      <td className="py-3 px-3">{totalSold.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                      <td className="py-3 px-3">{totalTransferred.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                      <td className="py-3 px-3">{totalAdjusted.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t sticky bottom-0 z-20 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-950/95 backdrop-blur-md border-slate-800'
        }`}>
          {onOpenHistory && (
            <button
              onClick={() => onOpenHistory(product)}
              className="px-5 py-2.5 font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-95 bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
              title="View stock movement history ledger"
            >
              <History className="w-4 h-4" />
              <span>Product History</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className={`px-6 py-2.5 font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-95 text-white ${theme.buttonBg}`}
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={onClose}
            className={
              isLight
                ? "px-5 py-2.5 font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-95 bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                : `px-6 py-2.5 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white`
            }
          >
            {isLight && <History className="w-4 h-4" />}
            <span>Close</span>
          </button>
        </div>

      </div>
    </div>
  );
};
