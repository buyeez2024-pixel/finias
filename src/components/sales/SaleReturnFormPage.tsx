import React, { useState, useMemo, useRef } from 'react';
import { useErp } from '../../context/ErpContext';
import { TransactionItem, TransactionStatus, TransactionType, PaymentMethod, Product, Customer } from '../../types/erp';
import {
  RotateCcw,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Boxes,
  Clock,
  User,
  Landmark,
  CreditCard,
  Search,
  Calculator,
  Percent,
  Info,
  X,
  Receipt,
  ShoppingBag,
  Calendar,
  AlertCircle,
  Banknote,
  FileText,
  DollarSign,
  Package,
} from 'lucide-react';
import { SaleReturnCustomerDropdown } from './SaleReturnCustomerDropdown';
import { QuickAddCustomerModal } from './QuickAddCustomerModal';
import { formatCurrency } from '../../utils/formatters';

export const SaleReturnFormPage: React.FC = () => {
  const {
    customers,
    products,
    locations,
    selectedLocationId,
    createSale,
    updateSale,
    settings,
    setActiveTab,
    showFlashNotification,
    editingSale,
    viewingSale,
    transactions,
  } = useErp();

  const isEditMode = !!editingSale;
  const isViewMode = !!viewingSale;
  const saleToUse = editingSale || viewingSale;

  const finalSales = useMemo(
    () =>
      transactions.filter(
        (t) => t.type === 'sale' && (t.status === 'received' || t.status === 'final')
      ),
    [transactions]
  );

  // Header State
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [customerId, setCustomerId] = useState(saleToUse?.customerId || '');
  const [locationId, setLocationId] = useState(saleToUse?.locationId || selectedLocationId);
  const [status, setStatus] = useState<TransactionStatus>(saleToUse?.status || 'received');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    saleToUse?.paymentEntries?.[0]?.method || 'cash'
  );
  const [shippingCost, setShippingCost] = useState(saleToUse?.shippingCharges?.toString() || '0.00');
  const [saleTaxPercent, setSaleTaxPercent] = useState('0');
  const [saleDiscountAmount, setSaleDiscountAmount] = useState('0');
  const [notes, setNotes] = useState(saleToUse?.notes || 'Customer Return & Refund');
  const [lotNumber, setLotNumber] = useState(
    saleToUse?.lotNumber ||
      `SR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [initialNewCustomerName, setInitialNewCustomerName] = useState('');

  // Items State
  const [items, setItems] = useState<TransactionItem[]>(saleToUse?.items || []);

  // Product Search State for direct item additions
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const productSearchRef = useRef<HTMLDivElement>(null);

  // Customer change handler
  const handleCustomerChange = (sId: string) => {
    setCustomerId(sId);
    setSelectedSaleId('');
    setItems([]);
    setLotNumber(`SR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Filter sales by selected customer
  const filteredSales = useMemo(() => {
    if (!customerId) return finalSales;
    return finalSales.filter((p) => p.customerId === customerId);
  }, [finalSales, customerId]);

  // Handle select original sale order
  const handleSelectSale = (saleId: string) => {
    setSelectedSaleId(saleId);

    if (saleId) {
      const p = finalSales.find((txn) => txn.id === saleId);
      if (p) {
        if (p.customerId && p.customerId !== customerId) {
          setCustomerId(p.customerId);
        }
        if (p.locationId) {
          setLocationId(p.locationId);
        }
        if (p.lotNumber) {
          setLotNumber(p.lotNumber);
        }
        // Pre-fill with items from original sale order
        setItems(p.items.map((item) => ({ ...item })));
        showFlashNotification(
          `Loaded ${p.items.length} line item(s) from invoice ${p.invoiceNo}`,
          'success'
        );
      }
    } else {
      setItems([]);
      setLotNumber(`SR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  // Filter products for direct item return
  const searchFilteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) return [];
    const term = productSearchTerm.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.sku && p.sku.toLowerCase().includes(term)) ||
          (p.barcode && p.barcode.toLowerCase().includes(term))
      )
      .slice(0, 8);
  }, [products, productSearchTerm]);

  const handleAddDirectProduct = (prod: Product) => {
    const existingIndex = items.findIndex((i) => i.productId === prod.id);
    if (existingIndex >= 0) {
      handleQtyChange(existingIndex, items[existingIndex].quantity + 1);
    } else {
      const unitCost = prod.costPrice || 0;
      const unitPrice = prod.sellingPrice || prod.costPrice || 0;
      const taxRate = prod.taxRate || 0;
      const inclTax = unitPrice;

      setItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku || 'SKU-RET',
          quantity: 1,
          costPrice: unitCost,
          unitPrice: inclTax,
          sellingPrice: unitPrice,
          taxRate: taxRate,
          total: inclTax,
        },
      ]);
    }
    setProductSearchTerm('');
    setIsProductSearchOpen(false);
    showFlashNotification(`Added ${prod.name} to return list`, 'success');
  };

  const handleQtyChange = (index: number, qty: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const newQty = Math.max(1, qty);
        return {
          ...item,
          quantity: newQty,
          total: newQty * item.unitPrice,
        };
      })
    );
  };

  const handleCostChange = (index: number, newCostExclTax: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const inclTax = newCostExclTax * (1 + item.taxRate / 100);
        return {
          ...item,
          costPrice: newCostExclTax,
          unitPrice: inclTax,
          total: item.quantity * inclTax,
        };
      })
    );
  };

  const handleTaxChange = (index: number, newTaxRate: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const inclTax = item.costPrice * (1 + newTaxRate / 100);
        return {
          ...item,
          taxRate: newTaxRate,
          unitPrice: inclTax,
          total: item.quantity * inclTax,
        };
      })
    );
  };

  const handleSellingPriceChange = (index: number, newSellingPrice: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return { ...item, sellingPrice: newSellingPrice };
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Summary Calculations
  const subtotalItems = items.reduce((acc, item) => acc + item.total, 0);
  const saleTaxAmount = (subtotalItems * parseFloat(saleTaxPercent || '0')) / 100;
  const grandTotal =
    subtotalItems +
    saleTaxAmount +
    parseFloat(shippingCost || '0') -
    parseFloat(saleDiscountAmount || '0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      showFlashNotification('Please select a customer for this return', 'error');
      return;
    }
    if (items.length === 0) {
      showFlashNotification('Please add at least one product to the return list', 'error');
      return;
    }

    const payload = {
      type: 'sell_return' as TransactionType,
      customerId,
      locationId,
      items,
      subtotal: subtotalItems,
      taxAmount: saleTaxAmount,
      discountAmount: parseFloat(saleDiscountAmount || '0'),
      shippingCharges: parseFloat(shippingCost || '0'),
      totalAmount: grandTotal,
      paidAmount: paymentMethod === 'credit' ? 0 : grandTotal,
      paymentMethod,
      notes,
      lotNumber: lotNumber.trim(),
      status,
    };

    if (isEditMode && editingSale) {
      updateSale(editingSale.id, payload);
    } else {
      createSale(payload);
    }

    showFlashNotification(
      isEditMode
        ? `Sale Return ${saleToUse?.invoiceNo} updated successfully.`
        : `Sale Return processed. Inventory restocked and customer ledger updated.`,
      'success'
    );
    setActiveTab('sale_returns');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
      {/* Top Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setActiveTab('sale_returns')}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all text-slate-400 hover:text-white border border-slate-700"
            title="Return to Sale Returns list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <RotateCcw className="w-7 h-7 text-rose-500" />
              {isViewMode ? 'Order Audit' : isEditMode ? 'Modify Sale Return' : 'New Sale Return'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-md border border-rose-800/60">
                Sales & Returns
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Customer Return, Restock & Refund Processing
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 flex flex-col items-end shadow-inner">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
              Refund Valuation
            </span>
            <span className="text-2xl font-mono font-black text-emerald-400">
              {formatCurrency(grandTotal, settings)}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          {/* SECTION 1: Customer Selection & Order Audit */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-500 to-indigo-600"></div>

            {/* Upgraded Customer Selection Dropdown */}
            <div className="border-b border-slate-800/80 pb-6">
              <SaleReturnCustomerDropdown
                customers={customers}
                selectedCustomerId={customerId}
                onSelectCustomer={handleCustomerChange}
                disabled={isViewMode}
                finalSales={finalSales}
                selectedSaleId={selectedSaleId}
                onSelectSaleOrder={handleSelectSale}
                onOpenAddCustomerModal={(searchName) => {
                  setInitialNewCustomerName(searchName || '');
                  setShowAddCustomerModal(true);
                }}
                settings={settings}
              />
            </div>

            {/* Secondary Transaction Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Original Sale Order Link */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                    Original Sale Order
                  </label>
                  {selectedSaleId && !isViewMode && (
                    <button
                      type="button"
                      onClick={() => handleSelectSale('')}
                      className="text-[10px] text-slate-400 hover:text-rose-400 font-bold"
                      title="Unlink order (Direct Return)"
                    >
                      Clear Link
                    </button>
                  )}
                </div>
                <select
                  disabled={isViewMode || isEditMode}
                  value={selectedSaleId}
                  onChange={(e) => handleSelectSale(e.target.value)}
                  className="w-full bg-slate-950 text-white px-4 py-3 rounded-2xl border border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-xs disabled:opacity-50"
                >
                  <option value="">
                    {customerId
                      ? filteredSales.length > 0
                        ? '-- Choose an Order to Return --'
                        : '-- No Orders on File (Direct Return) --'
                      : '-- Select Customer First or Choose Order --'}
                  </option>
                  {filteredSales.map((txn) => {
                    const dateStr = txn.transactionDate
                      ? new Date(txn.transactionDate).toLocaleDateString()
                      : '';
                    return (
                      <option key={txn.id} value={txn.id}>
                        {txn.invoiceNo} — {formatCurrency(txn.totalAmount, settings)} ({dateStr})
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-500">
                  {selectedSaleId
                    ? 'Order items loaded. Adjust return quantities below.'
                    : 'Leave blank to perform a Direct Return without invoice.'}
                </p>
              </div>

              {/* Business Location */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                  Restock Location *
                </label>
                <select
                  required
                  disabled={isViewMode || !!selectedSaleId}
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full bg-slate-950 text-white px-4 py-3 rounded-2xl border border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-xs disabled:opacity-50"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.city ? `(${loc.city})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  Returned products will be restocked to this warehouse.
                </p>
              </div>

              {/* Refund Method */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  Refund / Settlement
                </label>
                <select
                  disabled={isViewMode}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 text-white px-4 py-3 rounded-2xl border border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-xs"
                >
                  <option value="cash">Cash Refund</option>
                  <option value="card">Card / POS Reversal</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit">Store Credit / Due Adjustment</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  Select how refund is disbursed or credited to customer.
                </p>
              </div>

              {/* Return Reference / Lot Number */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-amber-400" />
                  Return Tracking Reference
                </label>
                <input
                  required
                  disabled={isViewMode}
                  type="text"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  className="w-full bg-slate-950 text-amber-400 px-4 py-3 rounded-2xl border border-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-mono font-bold text-xs"
                />
                <p className="text-[10px] text-slate-500">
                  Batch and lot assignment for inventory ledger audit.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Return Item Grid with Product Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-slate-800/20 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-rose-400" />
                  <span>Items to Return & Restock</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                    {items.length} line item{items.length !== 1 ? 's' : ''}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust quantities, tax rates, or unit values. Remove items not being returned.
                </p>
              </div>

              {/* Product Search for Direct Returns or Extra Items */}
              {!isViewMode && (
                <div className="relative w-full md:w-80" ref={productSearchRef}>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Add product by name or SKU..."
                      value={productSearchTerm}
                      onChange={(e) => {
                        setProductSearchTerm(e.target.value);
                        setIsProductSearchOpen(true);
                      }}
                      onFocus={() => setIsProductSearchOpen(true)}
                      className="w-full bg-slate-950 text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs placeholder:text-slate-500"
                    />
                  </div>

                  {isProductSearchOpen && searchFilteredProducts.length > 0 && (
                    <div className="absolute right-0 left-0 mt-1.5 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-800/60">
                      {searchFilteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleAddDirectProduct(p)}
                          className="p-3 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{p.sku}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-emerald-400">
                              {formatCurrency(p.sellingPrice || p.costPrice || 0, settings)}
                            </div>
                            <span className="text-[9px] text-indigo-400 font-semibold">+ Add</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Product Details</th>
                    <th className="px-6 py-4 text-center">Return Qty</th>
                    <th className="px-6 py-4">Unit Cost (Excl. Tax)</th>
                    <th className="px-6 py-4 text-center">Tax (%)</th>
                    <th className="px-6 py-4">Refund Unit Price</th>
                    <th className="px-6 py-4 text-right">Line Total</th>
                    <th className="px-6 py-4 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={`${item.productId}-${idx}`}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-white">{item.productName}</div>
                        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
                          {item.sku}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          disabled={isViewMode}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 text-center text-white font-bold py-2 rounded-lg border border-slate-800 text-xs focus:border-indigo-500 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]">
                            {settings.currencySymbol}
                          </span>
                          <input
                            disabled={isViewMode}
                            type="number"
                            step="0.01"
                            value={item.costPrice}
                            onChange={(e) => handleCostChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-24 bg-slate-950 pl-6 pr-2 py-2 rounded-lg border border-slate-800 text-white font-mono font-bold text-xs outline-none"
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
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          {formatCurrency(item.unitPrice, settings)}
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
                            className="p-2 hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 rounded-xl transition-all"
                            title="Remove item from return"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {items.length === 0 && (
              <div className="p-16 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-950 rounded-3xl border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                  <Calculator className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto">
                  <div className="text-white text-sm font-bold">No Products Added to Return</div>
                  <p className="text-slate-400 text-xs mt-1">
                    Select a Customer and pick one of their eligible past orders to auto-populate
                    items, or use the product search bar above to add items directly.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Summary, Notes & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notes & Reason */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Return Notes / Reason for Customer Return
              </label>
              <textarea
                rows={3}
                disabled={isViewMode}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for return (defective, wrong size, customer dissatisfaction, exchange)..."
                className="w-full bg-slate-950 text-white p-4 rounded-2xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
              />
            </div>

            {/* Totals & Submit */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(subtotalItems, settings)}
                  </span>
                </div>
                {saleTaxAmount > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Tax</span>
                    <span className="font-mono font-bold text-slate-300">
                      {formatCurrency(saleTaxAmount, settings)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-black text-slate-300 uppercase">
                    Refund Grand Total
                  </span>
                  <span className="text-2xl font-mono font-black text-emerald-400">
                    {formatCurrency(grandTotal, settings)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('sale_returns')}
                  className="flex-1 py-3.5 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 transition text-xs"
                >
                  Cancel
                </button>

                {!isViewMode && (
                  <button
                    type="submit"
                    id="submit-sale-return-btn"
                    className="flex-1 py-3.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-rose-950/40 uppercase tracking-wider text-xs active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isEditMode ? 'Save Changes' : 'Save'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Quick Add Customer Modal */}
      <QuickAddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        initialName={initialNewCustomerName}
        onCustomerCreated={(newCust) => {
          setCustomerId(newCust.id);
          setSelectedSaleId('');
          setItems([]);
        }}
      />
    </div>
  );
};
