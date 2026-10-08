import React from 'react';
import { Product } from '../../types/erp';
import { useErp } from '../../context/ErpContext';
import { formatCurrency } from '../../utils/formatters';
import { X, Printer, History } from 'lucide-react';

interface ViewProductDetailsModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onOpenHistory?: (product: Product) => void;
}

export const ViewProductDetailsModal: React.FC<ViewProductDetailsModalProps> = ({
  isOpen,
  product,
  onClose,
  onOpenHistory,
}) => {
  const { settings, products = [], locations = [], transactions = [], stockTransfers = [], stockAdjustments = [] } = useErp();

  if (!isOpen || !product) return null;

  const cost = Number(product.costPrice) || 0;
  const price = Number(product.sellingPrice) || 0;
  const isComboProduct = product.type === 'combo' || (Array.isArray(product.comboItems) && product.comboItems.length > 0);
  const isVariableProduct = product.type === 'variable' || (Array.isArray(product.variations) && product.variations.length > 0);
  const variationsList = isVariableProduct && product.variations && product.variations.length > 0 ? product.variations : [];

  // Available locations text
  const availableLocationNames = (product.locationIds && product.locationIds.length > 0)
    ? locations.filter((l) => product.locationIds?.includes(l.id)).map((l) => l.name).join(', ')
    : (product.locationId || product.branchId)
    ? (locations.find((l) => l.id === (product.locationId || product.branchId))?.name || 'None')
    : (locations.length > 0 ? locations.map(l => l.name).join(', ') : 'None');

  // Combo items formatted list
  const comboItemsList = (product.comboItems || []).map((ci: any) => {
    const componentProd = products.find((p) => p.id === ci.productId);
    const costExc = ci.costPrice !== undefined ? Number(ci.costPrice) : (Number(componentProd?.costPrice) || 0);
    const taxRateVal = Number(componentProd?.taxRate ?? product.taxRate ?? 0);
    const costInc = taxRateVal > 0 ? (costExc * (1 + taxRateVal / 100)) : costExc;
    const sellExc = ci.unitPrice !== undefined ? Number(ci.unitPrice) : (Number(componentProd?.sellingPrice) || 0);
    const sellInc = taxRateVal > 0 ? (sellExc * (1 + taxRateVal / 100)) : sellExc;
    const marginPct = costExc > 0 ? (((sellExc - costExc) / costExc) * 100).toFixed(2) : '0.00';
    const qty = Number(ci.quantity) || 1;
    const unitLabel = componentProd?.unit || 'Pieces';
    const totalExc = costExc * qty;
    const image = ci.image || componentProd?.image;
    const sku = ci.sku || componentProd?.sku || '';
    const nameWithSku = `${ci.productName || componentProd?.name || 'Product'} ${sku ? `(${sku})` : ''}`.trim();

    return {
      ...ci,
      nameWithSku,
      costExc,
      costInc,
      marginPct,
      sellExc,
      sellInc,
      qty,
      unitLabel,
      totalExc,
      image,
    };
  });

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white text-slate-900 border border-slate-200 rounded-xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col font-sans">
        
        {/* Header Title Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 sticky top-0 bg-white z-20">
          <h2 className="text-lg font-bold text-slate-800">
            View Product
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 text-white active:scale-95"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-[13px]">
          
          {/* Top Info Grid (3 columns + graphic) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Column 1 */}
            <div className="md:col-span-3 space-y-1.5 leading-relaxed">
              <div><strong className="text-slate-900 font-bold">SKU:</strong> <span className="text-slate-700">{product.sku}</span></div>
              <div><strong className="text-slate-900 font-bold">Brand:</strong> <span className="text-slate-700">{product.brand || '--'}</span></div>
              <div><strong className="text-slate-900 font-bold">Unit:</strong> <span className="text-slate-700">{product.unit || 'Pc(s)'}</span></div>
              <div><strong className="text-slate-900 font-bold">Barcode Type:</strong> <span className="text-slate-700">C128</span></div>
              <div><strong className="text-slate-900 font-bold">Available in locations:</strong> <span className="text-slate-700">{availableLocationNames}</span></div>
            </div>

            {/* Column 2 */}
            <div className="md:col-span-3 space-y-1.5 leading-relaxed">
              <div><strong className="text-slate-900 font-bold">Category:</strong> <span className="text-slate-700">{product.category || '--'}</span></div>
              <div><strong className="text-slate-900 font-bold">Sub category:</strong> <span className="text-slate-700">{product.subCategory || '--'}</span></div>
              <div><strong className="text-slate-900 font-bold">Manage Stock?:</strong> <span className="text-slate-700">{isComboProduct ? 'No' : 'Yes'}</span></div>
            </div>

            {/* Column 3 */}
            <div className="md:col-span-3 space-y-1.5 leading-relaxed">
              <div>
                <strong className="text-slate-900 font-bold">Expires in:</strong>{' '}
                <span className="text-slate-700">
                  {product.expiryPeriod && product.expiryPeriodType !== 'Not Applicable'
                    ? `${product.expiryPeriod} ${product.expiryPeriodType}`
                    : 'Not Applicable'}
                </span>
              </div>
              <div><strong className="text-slate-900 font-bold">Applicable Tax:</strong> <span className="text-slate-700">{product.taxRate ? `${product.taxRate}%` : 'None'}</span></div>
              <div><strong className="text-slate-900 font-bold">Selling Price Tax Type:</strong> <span className="text-slate-700 capitalize">{product.taxType || 'Exclusive'}</span></div>
              <div><strong className="text-slate-900 font-bold">Product Type:</strong> <span className="text-slate-700 capitalize">{isComboProduct ? 'Combo' : (isVariableProduct ? 'Variable' : 'Single')}</span></div>
            </div>

            {/* Column 4: Graphic / Illustration Box */}
            <div className="md:col-span-3 flex items-center justify-center">
              <div className="w-full h-32 max-w-[240px] p-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <svg className="w-full h-full max-h-24" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Computer monitor with invoice */}
                    <rect x="25" y="15" width="45" height="50" rx="4" fill="#334155" />
                    <rect x="28" y="18" width="39" height="38" rx="2" fill="#0f172a" />
                    <path d="M42 65 L48 78 L32 78 Z" fill="#475569" />
                    <rect x="26" y="78" width="36" height="4" rx="2" fill="#334155" />
                    {/* Sheet coming out */}
                    <rect x="33" y="8" width="32" height="42" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                    <rect x="38" y="16" width="12" height="12" rx="2" fill="#fbbf24" opacity="0.8" />
                    <line x1="38" y1="34" x2="58" y2="34" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                    <line x1="38" y1="40" x2="52" y2="40" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                    {/* 3D Parcel Box */}
                    <g transform="translate(68, 36)">
                      <path d="M16 0 L32 8 L16 16 L0 8 Z" fill="#fcd34d" />
                      <path d="M0 8 L16 16 L16 35 L0 27 Z" fill="#f59e0b" />
                      <path d="M32 8 L16 16 L16 35 L32 27 Z" fill="#d97706" />
                      <path d="M16 0 L16 16" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
                      <path d="M8 4 L24 12" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
                      <path d="M8 22 L8 31" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
                    </g>
                    {/* Plant sprout logo */}
                    <g transform="translate(125, 14)">
                      <path d="M22 28 C15 18 8 22 10 32 C12 36 20 34 22 28 Z" fill="#0ea5e9" />
                      <path d="M25 24 C25 10 35 10 35 24 C35 30 25 30 25 24 Z" fill="#0284c7" />
                      <path d="M28 28 C35 18 42 22 40 32 C38 36 30 34 28 28 Z" fill="#0369a1" />
                      <path d="M25 28 L25 46" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                      <text x="2" y="44" fill="#0284c7" fontSize="10" fontWeight="bold" fontFamily="monospace">&lt;/&gt;</text>
                      <text x="24" y="60" textAnchor="middle" fill="#0284c7" fontSize="20" fontWeight="900" fontFamily="sans-serif">tit</text>
                      <circle cx="34" cy="46" r="2.5" fill="#0284c7" />
                    </g>
                  </svg>
                )}
              </div>
            </div>

          </div>

          {/* Section: Combo Products Table View */}
          {isComboProduct ? (
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-semibold text-slate-800">
                Combo:
              </h3>

              <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#26c281] text-white font-bold text-[11px] leading-tight select-none">
                    <tr>
                      <th className="py-3 px-3.5">Product Name</th>
                      <th className="py-3 px-3">Default Purchase Price (Exc. tax)</th>
                      <th className="py-3 px-3">Default Purchase Price (Inc. tax)</th>
                      <th className="py-3 px-3">x Margin(%)</th>
                      <th className="py-3 px-3">Default Selling Price (Exc. tax)</th>
                      <th className="py-3 px-3">Default Selling Price (Inc. tax)</th>
                      <th className="py-3 px-3">Quantity</th>
                      <th className="py-3 px-3">Total Amount (Exc. Tax)</th>
                      <th className="py-3 px-3">Variation Images</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans text-slate-800 text-xs">
                    {comboItemsList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 bg-slate-50">
                          No component items configured for this combo bundle.
                        </td>
                      </tr>
                    ) : (
                      comboItemsList.map((ci, idx) => (
                        <tr
                          key={ci.productId || idx}
                          className="bg-[#eef2f6]/70 hover:bg-[#eef2f6]/70 transition-colors"
                        >
                          <td className="py-3 px-3.5 font-medium text-slate-900">
                            {ci.nameWithSku}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {formatCurrency(ci.costExc, settings)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {formatCurrency(ci.costInc, settings)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-medium">
                            {ci.marginPct}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {formatCurrency(ci.sellExc, settings)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {formatCurrency(ci.sellInc, settings)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {ci.qty.toFixed(2)} {ci.unitLabel}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-medium">
                            {formatCurrency(ci.totalExc, settings)}
                          </td>
                          <td className="py-3 px-3">
                            {ci.image ? (
                              <img
                                src={ci.image}
                                alt={ci.nameWithSku}
                                className="w-8 h-8 object-cover rounded border border-slate-300"
                              />
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Right Aligned Default Selling Price Total */}
              <div className="flex justify-end pt-2 pr-1">
                <div className="text-sm text-slate-900">
                  <span className="font-bold">Default Selling Price:</span>{' '}
                  <span className="font-normal">{formatCurrency(price, settings)}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Single & Variable Products Default Pricing Table */
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#26c281] text-white font-bold text-[11px] leading-tight">
                    <tr>
                      {isVariableProduct && variationsList.length > 0 && (
                        <th className="py-3 px-3.5">Variation</th>
                      )}
                      {isVariableProduct && variationsList.length > 0 && (
                        <th className="py-3 px-3">SKU</th>
                      )}
                      <th className="py-3 px-3">Default Purchase Price (Exc. tax)</th>
                      <th className="py-3 px-3">Default Purchase Price (Inc. tax)</th>
                      <th className="py-3 px-3">x Margin(%)</th>
                      <th className="py-3 px-3">Default Selling Price (Exc. tax)</th>
                      <th className="py-3 px-3">Default Selling Price (Inc. tax)</th>
                      <th className="py-3 px-3">Variation Images</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans text-slate-800">
                    {isVariableProduct && variationsList.length > 0 ? (
                      variationsList.map((v, idx) => {
                        const vCost = v.costPrice ?? cost;
                        const vCostInc = v.costPriceIncTax ?? (product.taxRate ? vCost * (1 + product.taxRate / 100) : vCost);
                        const vPrice = v.sellingPrice ?? price;
                        const vPriceInc = v.sellingPriceIncTax ?? (product.taxRate ? vPrice * (1 + product.taxRate / 100) : vPrice);
                        const vMargin = v.margin !== undefined ? Number(v.margin).toFixed(2) : (vPrice > 0 ? (((vPrice - vCost) / vPrice) * 100).toFixed(2) : '0.00');
                        const vSku = v.sku || `${product.sku}-${idx + 1}`;
                        const vValue = v.value || v.name?.replace(/^.*:\s*/, '') || `Variation #${idx + 1}`;

                        return (
                          <tr key={v.id || idx} className="bg-[#eef2f6]/70 hover:bg-[#eef2f6]/70 transition-colors">
                            <td className="py-3 px-3.5 font-bold text-slate-900">
                              <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs">
                                {vValue}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700">{vSku}</td>
                            <td className="py-3 px-3">{formatCurrency(vCost, settings)}</td>
                            <td className="py-3 px-3">{formatCurrency(vCostInc, settings)}</td>
                            <td className="py-3 px-3 font-semibold text-slate-900">{vMargin}%</td>
                            <td className="py-3 px-3">{formatCurrency(vPrice, settings)}</td>
                            <td className="py-3 px-3">{formatCurrency(vPriceInc, settings)}</td>
                            <td className="py-3 px-3">
                              {v.image ? (
                                <img src={v.image} alt={vValue} className="w-8 h-8 object-cover rounded border border-slate-300" />
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="bg-[#eef2f6]/70 hover:bg-[#eef2f6]/70 transition-colors">
                        <td className="py-3 px-3.5">{formatCurrency(cost, settings)}</td>
                        <td className="py-3 px-3">{formatCurrency(cost, settings)}</td>
                        <td className="py-3 px-3 font-semibold">{price > 0 ? (((price - cost) / price) * 100).toFixed(2) : '0.00'}%</td>
                        <td className="py-3 px-3">{formatCurrency(price, settings)}</td>
                        <td className="py-3 px-3">{formatCurrency(price, settings)}</td>
                        <td className="py-3 px-3 text-slate-400">—</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Product Stock Details Section for Single & Variable */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-800">Product Stock Details</h3>
                
                <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#26c281] text-white font-bold text-[11px] leading-tight">
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
                    <tbody className="divide-y divide-slate-200 font-sans text-slate-800">
                      {isVariableProduct && variationsList.length > 0 ? (
                        <>
                          {variationsList.map((v, idx) => {
                            const vSku = v.sku || `${product.sku}-${idx + 1}`;
                            const vPrice = v.sellingPrice ?? price;
                            const vStock = Number(v.currentStock ?? v.openingStock ?? 0);
                            const vStockVal = vStock * vPrice;
                            const vValue = v.value || v.name?.replace(/^.*:\s*/, '') || `Variation #${idx + 1}`;

                            return (
                              <tr key={v.id || idx} className="bg-[#eef2f6]/70 hover:bg-[#eef2f6]/70 transition-colors">
                                <td className="py-3 px-3 font-semibold text-slate-700">{vSku}</td>
                                <td className="py-3 px-3 font-medium text-slate-900">
                                  {product.name} ({vValue})
                                </td>
                                <td className="py-3 px-3 text-slate-600">{defaultLocationName}</td>
                                <td className="py-3 px-3">{formatCurrency(vPrice, settings)}</td>
                                <td className="py-3 px-3 font-bold text-emerald-600">{vStock.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                                <td className="py-3 px-3 font-bold text-amber-600">{formatCurrency(vStockVal, settings)}</td>
                                <td className="py-3 px-3">0.00 {product.unit || 'Pc(s)'}</td>
                                <td className="py-3 px-3">0.00 {product.unit || 'Pc(s)'}</td>
                                <td className="py-3 px-3">0.00 {product.unit || 'Pc(s)'}</td>
                              </tr>
                            );
                          })}
                        </>
                      ) : (
                        <tr className="bg-[#eef2f6]/70 hover:bg-[#eef2f6]/70 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-700">{product.sku}</td>
                          <td className="py-3 px-3 font-medium text-slate-900">{product.name}</td>
                          <td className="py-3 px-3 text-slate-600">{defaultLocationName}</td>
                          <td className="py-3 px-3">{formatCurrency(price, settings)}</td>
                          <td className="py-3 px-3 font-bold text-emerald-600">{currentStock.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                          <td className="py-3 px-3 font-bold text-amber-600">{formatCurrency(stockValue, settings)}</td>
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
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 sticky bottom-0 bg-white z-20">
          {onOpenHistory && (
            <button
              onClick={() => onOpenHistory(product)}
              className="px-4 py-2 font-semibold rounded-lg text-xs gap-1.5 mr-auto transition cursor-pointer flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 text-white active:scale-95"
              title="View stock movement history ledger"
            >
              <History className="w-4 h-4 text-white" />
              <span>History</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer active:scale-95 text-white bg-[#6f42c1] hover:bg-[#5f33b1]"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold rounded-lg text-xs transition cursor-pointer flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 text-white active:scale-95"
          >
            <span>Close</span>
          </button>
        </div>

      </div>
    </div>
  );
};
