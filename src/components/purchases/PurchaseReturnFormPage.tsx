import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { TransactionItem, TransactionStatus, TransactionType, PaymentMethod, Product } from '../../types/erp';
import { Truck, Plus, Trash2, ArrowLeft, CheckCircle2, Boxes, Clock, User, Landmark, CreditCard, Search, Calculator, Percent, Info, X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { SearchableDropdown } from '../common/SearchableDropdown';

export const PurchaseReturnFormPage: React.FC = () => {
  const { 
    suppliers, 
    products, 
    locations, 
    selectedLocationId, 
    createPurchase, 
    updatePurchase,
    addProduct,
    categories,
    units,
    brands,
    settings,
    setActiveTab,
    showFlashNotification,
    editingPurchase,
    viewingPurchase,
    transactions,
    paymentMethods
  } = useErp();

  const isEditMode = !!editingPurchase;
  const isViewMode = !!viewingPurchase;
  const purchaseToUse = editingPurchase || viewingPurchase;

  const receivedPurchases = useMemo(() => 
    transactions.filter(t => t.type === 'purchase' && t.status === 'received'), 
  [transactions]);

  // Header State
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(purchaseToUse?.returnPurchaseId || '');
  const [supplierId, setSupplierId] = useState(purchaseToUse?.supplierId || '');
  const [locationId, setLocationId] = useState(purchaseToUse?.locationId || selectedLocationId);
  const [status, setStatus] = useState<TransactionStatus>(purchaseToUse?.status || 'received');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(purchaseToUse?.paymentEntries?.[0]?.method || '');
  const [shippingCost, setShippingCost] = useState(purchaseToUse?.shippingCharges?.toString() || '0.00');
  const [purchaseTaxPercent, setPurchaseTaxPercent] = useState('0');
  const [purchaseDiscountAmount, setPurchaseDiscountAmount] = useState('0');
  const [notes, setNotes] = useState(purchaseToUse?.notes || 'Return to Supplier');
  const [lotNumber, setLotNumber] = useState(purchaseToUse?.lotNumber || `PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

  // Items State
  const [items, setItems] = useState<TransactionItem[]>(purchaseToUse?.items || []);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearchDropdown, setShowProductSearchDropdown] = useState(false);

  const searchResults = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.sku && p.sku.toLowerCase().includes(q)) || 
      (p.barcode && p.barcode.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [products, productSearch]);

  const handleAddProduct = (prod: Product) => {
    const existingIndex = items.findIndex(i => i.productId === prod.id);
    if (existingIndex >= 0) {
      handleQtyChange(existingIndex, items[existingIndex].quantity + 1);
    } else {
      const cost = Number(prod.costPrice) || 0;
      const taxRate = Number(prod.taxRate) || 0;
      const unitPrice = cost * (1 + taxRate / 100);
      const margin = prod.sellingPrice && unitPrice > 0 ? ((prod.sellingPrice - unitPrice) / unitPrice) * 100 : (settings.defaultProfitPercent ? Number(settings.defaultProfitPercent) : 25);
      const sellingPrice = prod.sellingPrice || Number((unitPrice * (1 + margin / 100)).toFixed(2));
      
      const newItem: TransactionItem = {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku || '',
        quantity: 1,
        costPrice: cost,
        taxRate: taxRate,
        unitPrice: unitPrice,
        marginPercent: margin,
        sellingPrice: sellingPrice,
        total: unitPrice,
      };
      setItems(prev => [...prev, newItem]);
    }
    setProductSearch('');
    setShowProductSearchDropdown(false);
  };

  const handleSelectPurchase = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedPurchaseId(pId);
    
    if (pId) {
      const p = receivedPurchases.find(txn => txn.id === pId);
      if (p) {
        setLocationId(p.locationId);
        if (p.lotNumber) {
          setLotNumber(p.lotNumber);
        }
        // Pre-fill with items from original purchase order
        setItems(p.items.map(item => ({ ...item })));
      }
    } else {
      setItems([]);
      setLotNumber(`PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSupplierId(sId);
    setSelectedPurchaseId('');
    setItems([]);
    setLotNumber(`PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Filter purchases by selected supplier
  const filteredPurchases = useMemo(() => {
    if (!supplierId) return [];
    return receivedPurchases.filter(p => p.supplierId === supplierId);
  }, [receivedPurchases, supplierId]);

  const handleQtyChange = (index: number, qty: number) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const newQty = Math.max(1, qty);
      return {
        ...item,
        quantity: newQty,
        total: newQty * item.unitPrice
      };
    }));
  };

  const handleCostChange = (index: number, newCostExclTax: number) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const rate = item.taxRate || 0;
      const inclTax = newCostExclTax * (1 + rate / 100);
      const itemMargin = item.marginPercent !== undefined && !isNaN(item.marginPercent)
        ? item.marginPercent
        : (settings.defaultProfitPercent ? Number(settings.defaultProfitPercent) : 25);
      const newSellingPrice = Number((inclTax * (1 + itemMargin / 100)).toFixed(2));

      return {
        ...item,
        costPrice: newCostExclTax,
        unitPrice: inclTax,
        total: item.quantity * inclTax,
        marginPercent: itemMargin,
        sellingPrice: newSellingPrice,
      };
    }));
  };

  const handleTaxChange = (index: number, newTaxRate: number) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const rate = Math.max(0, newTaxRate);
      const inclTax = item.costPrice * (1 + rate / 100);
      const itemMargin = item.marginPercent !== undefined && !isNaN(item.marginPercent)
        ? item.marginPercent
        : (settings.defaultProfitPercent ? Number(settings.defaultProfitPercent) : 25);
      const newSellingPrice = Number((inclTax * (1 + itemMargin / 100)).toFixed(2));

      return {
        ...item,
        taxRate: rate,
        unitPrice: inclTax,
        total: item.quantity * inclTax,
        marginPercent: itemMargin,
        sellingPrice: newSellingPrice,
      };
    }));
  };

  const handleMarginChange = (index: number, newMargin: number) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const inclTax = item.unitPrice || (item.costPrice * (1 + (item.taxRate || 0) / 100));
      const newSellingPrice = Number((inclTax * (1 + newMargin / 100)).toFixed(2));
      return {
        ...item,
        marginPercent: newMargin,
        sellingPrice: newSellingPrice,
      };
    }));
  };

  const handleSellingPriceChange = (index: number, newSellingPrice: number) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const inclTax = item.unitPrice || (item.costPrice * (1 + (item.taxRate || 0) / 100));
      const calculatedMargin = inclTax > 0
        ? Number((((newSellingPrice - inclTax) / inclTax) * 100).toFixed(2))
        : 0;
      return {
        ...item,
        sellingPrice: newSellingPrice,
        marginPercent: calculatedMargin,
      };
    }));
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };


  // Summary Calculations
  const subtotalItems = items.reduce((acc, item) => acc + item.total, 0);
  const purchaseTaxAmount = (subtotalItems * parseFloat(purchaseTaxPercent || '0')) / 100;
  const grandTotal = subtotalItems + purchaseTaxAmount + parseFloat(shippingCost || '0') - parseFloat(purchaseDiscountAmount || '0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showFlashNotification('Please add at least one product', 'error');
      return;
    }

    const payload = {
      type: 'purchase_return' as TransactionType,
      supplierId,
      locationId,
      items,
      subtotal: subtotalItems,
      taxAmount: purchaseTaxAmount,
      discountAmount: parseFloat(purchaseDiscountAmount || '0'),
      shippingCharges: parseFloat(shippingCost || '0'),
      totalAmount: grandTotal,
      paidAmount: paymentMethod === 'credit' ? 0 : grandTotal,
      paymentMethod,
      notes,
      lotNumber: lotNumber.trim(),
      status,
      returnPurchaseId: selectedPurchaseId || purchaseToUse?.returnPurchaseId || undefined,
    };

    if (isEditMode && editingPurchase) {
      updatePurchase(editingPurchase.id, payload);
    } else {
      createPurchase(payload);
    }

    showFlashNotification(
      isEditMode 
        ? `Purchase Return ${purchaseToUse?.invoiceNo} updated.` 
        : `Return processed successfully. Stock updated under Lot: ${lotNumber}`, 
      'success'
    );
    setActiveTab('purchase_returns');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
      {/* Dynamic Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setActiveTab('purchase_returns')}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all text-slate-400 hover:text-white border border-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Truck className="w-7 h-7 text-indigo-500" />
              {isViewMode ? 'Order Audit' : isEditMode ? 'Modify Return' : 'New Purchase Return'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">Procurement Module</span>
              <span className="text-[10px] font-medium text-slate-400">Professional Inventory Replenishment</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Valuation:</span>
            <span className="text-base sm:text-lg font-mono font-black text-emerald-400">{formatCurrency(grandTotal, settings)}</span>
          </div>

          {!isViewMode && (
            <button
              type="button"
              onClick={handleSubmit as any}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 text-xs uppercase tracking-wider cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditMode ? 'Update' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Header Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative z-30 group">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 rounded-l-3xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 relative z-30">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Supplier *
              </label>
              <SearchableDropdown
                options={suppliers.map(s => ({
                  id: s.id,
                  name: `${s.name} ${s.businessName ? `(${s.businessName})` : ''}`,
                  phone: s.phone
                }))}
                value={supplierId}
                onChange={(value) => {
                  handleSupplierChange({ target: { value } } as React.ChangeEvent<HTMLSelectElement>);
                }}
                disabled={isViewMode}
                placeholder="Search Suppliers..."
                triggerClassName="px-5 py-3.5 rounded-2xl border-slate-800 text-sm font-bold min-h-[50px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                Original Purchase Order
              </label>
              <select
                disabled={isViewMode || isEditMode || !supplierId}
                value={selectedPurchaseId}
                onChange={handleSelectPurchase}
                className="w-full bg-slate-950 text-white px-5 py-3.5 rounded-2xl border border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all font-bold text-sm disabled:opacity-50 min-h-[50px]"
              >
                <option value="">-- Select Order to Return --</option>
                {filteredPurchases.map(txn => (
                  <option key={txn.id} value={txn.id}>{txn.invoiceNo}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                Business Location *
              </label>
              <select
                required
                disabled={isViewMode || !supplierId}
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-slate-950 text-white px-5 py-3.5 rounded-2xl border border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all font-bold text-sm disabled:opacity-50 min-h-[50px]"
              >
                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Boxes className="w-3.5 h-3.5 text-amber-400" />
                Global Lot Number
              </label>
              <input
                required
                disabled={isViewMode}
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full bg-slate-950 text-amber-400 px-5 py-3.5 rounded-2xl border border-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 outline-none transition-all font-mono font-bold text-sm min-h-[50px]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Return Item Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 bg-slate-800/20 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-indigo-400" />
                Items to Return
              </h3>
              <p className="text-xs text-slate-400 mt-1">Select an original purchase order above or search products below to add items to return.</p>
            </div>
            {items.length > 0 && (
              <span className="px-3 py-1 bg-slate-950 rounded-xl text-xs font-mono font-bold text-indigo-400 border border-slate-800">
                {items.length} {items.length === 1 ? 'Product' : 'Products'} Listed
              </span>
            )}
          </div>

          {!isViewMode && (
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 relative">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Type product name, SKU, or scan barcode to add..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductSearchDropdown(true);
                  }}
                  onFocus={() => setShowProductSearchDropdown(true)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 text-white rounded-xl border border-slate-800 text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              {showProductSearchDropdown && searchResults.length > 0 && (
                <div className="absolute left-4 right-4 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleAddProduct(prod)}
                      className="p-3 hover:bg-indigo-600/20 flex items-center justify-between border-b border-slate-800 last:border-0 cursor-pointer transition"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{prod.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku || 'N/A'} • Available Stock: {prod.currentStock ?? 0} {prod.unit || 'Pcs'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-emerald-400">{formatCurrency(prod.costPrice || 0, settings)}</div>
                        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">+ Add Item</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-950 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4">Cost (Excl. Tax)</th>
                  <th className="px-6 py-4 text-center">Tax (%)</th>
                  <th className="px-6 py-4">Cost (Incl. Tax)</th>
                  <th className="px-6 py-4 text-center">Margin (%)</th>
                  <th className="px-6 py-4">Selling Price</th>
                  <th className="px-6 py-4 text-right">Line Total</th>
                  <th className="px-6 py-4 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const margin = item.costPrice > 0 ? ((item.sellingPrice! - item.unitPrice) / item.unitPrice) * 100 : 0;
                  
                  return (
                    <tr key={`${item.productId}_${idx}`} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-white">{item.productName}</div>
                        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{item.sku}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          disabled={isViewMode}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-20 bg-slate-950 text-center text-white font-bold py-2 rounded-lg border border-slate-800 text-xs focus:border-indigo-500/50 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <input
                            disabled={isViewMode}
                            type="number"
                            step="0.01"
                            value={item.costPrice}
                            onChange={(e) => handleCostChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-24 bg-slate-950 pl-2 pr-2 py-2 rounded-lg border border-slate-800 text-white font-mono font-bold text-xs outline-none"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          disabled={isViewMode}
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => handleTaxChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 text-center text-slate-400 py-2 rounded-lg border border-slate-800 text-xs outline-none"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono font-bold text-emerald-400/70">{formatCurrency(item.unitPrice, settings)}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isViewMode ? (
                          <span className="px-2 py-1 bg-slate-950 rounded text-[10px] font-bold text-indigo-400 border border-slate-800">
                            {(item.marginPercent !== undefined && !isNaN(item.marginPercent) ? item.marginPercent : margin).toFixed(1)}%
                          </span>
                        ) : (
                          <div className="relative inline-flex items-center justify-center">
                            <input
                              type="number"
                              step="0.1"
                              value={item.marginPercent !== undefined && !isNaN(item.marginPercent) ? item.marginPercent : Number(margin.toFixed(1))}
                              onChange={(e) => handleMarginChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-16 bg-slate-950 text-center text-indigo-400 font-mono font-bold py-1.5 px-2 rounded-lg border border-slate-800 text-xs focus:border-indigo-500 outline-none"
                            />
                            <span className="ml-1 text-[10px] font-mono text-slate-500 font-bold">%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <input
                            disabled={isViewMode}
                            type="number"
                            step="0.01"
                            value={item.sellingPrice}
                            onChange={(e) => handleSellingPriceChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-24 bg-slate-950 pl-2 pr-2 py-2 rounded-lg border border-slate-800 text-indigo-400 font-mono font-bold text-xs outline-none focus:border-indigo-500/50"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-mono font-black text-white">
                        {formatCurrency(item.total, settings)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!isViewMode && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-2 hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="p-16 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-950 rounded-3xl border border-slate-800 flex items-center justify-center mx-auto text-slate-700">
                <Calculator className="w-8 h-8" />
              </div>
              <div className="text-slate-400 text-sm font-medium">No products added yet. Use the search bar or select an original purchase order above to start.</div>
            </div>
          )}
        </div>

        {/* Section 3: Final Assessment & Settlement (Aligned after Items to Return) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>Final Assessment & Financial Settlement</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 3 of 3</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Inward Subtotal</label>
                <span className="text-xs text-slate-400 font-medium">Base Line Total</span>
              </div>
              <span className="text-white font-mono font-black text-sm">{formatCurrency(subtotalItems, settings)}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Percent className="w-3 h-3 text-indigo-400" />
                Return Tax (%)
              </label>
              <input
                disabled={isViewMode}
                type="number"
                value={purchaseTaxPercent}
                onChange={(e) => setPurchaseTaxPercent(e.target.value)}
                className="w-full bg-slate-900 text-white font-bold py-2 px-3 rounded-xl border border-slate-800 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3 h-3 text-indigo-400" />
                Shipping Cost ({settings.currencySymbol || '$'})
              </label>
              <input
                disabled={isViewMode}
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                className="w-full bg-slate-900 text-white font-bold py-2 px-3 rounded-xl border border-slate-800 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Order Discount ({settings.currencySymbol || '$'})</label>
              <input
                disabled={isViewMode}
                type="number"
                value={purchaseDiscountAmount}
                onChange={(e) => setPurchaseDiscountAmount(e.target.value)}
                className="w-full bg-slate-900 text-rose-400 font-bold py-2 px-3 rounded-xl border border-slate-800 text-xs outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Settlement Method
              </label>
              <select
                disabled={isViewMode}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full h-11 bg-slate-950 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="" disabled>-- Select Payment Method --</option>
                {paymentMethods.filter(m => m.enabled).map(m => (
                  <option key={m.id} value={m.code}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Inward Status
              </label>
              <select
                disabled={isViewMode}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={`w-full h-11 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold outline-none cursor-pointer ${status === 'received' ? 'text-emerald-400' : 'text-amber-400'}`}
              >
                <option value="received">Finalized & Received</option>
                <option value="pending">Pending Inward</option>
                <option value="ordered">Pre-Order / Factory</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Return Notes / Remarks
              </label>
              <input
                disabled={isViewMode}
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for return..."
                className="w-full h-11 bg-slate-950 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Valuation</span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono tracking-tighter mt-0.5">
                {formatCurrency(grandTotal, settings)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('purchase_returns')}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold transition text-xs cursor-pointer"
              >
                {isViewMode ? 'Exit Audit' : 'Discard Transaction'}
              </button>

              {!isViewMode && (
                <button
                  type="submit"
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditMode ? 'Update' : 'Save'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

    </div>
  );
};
