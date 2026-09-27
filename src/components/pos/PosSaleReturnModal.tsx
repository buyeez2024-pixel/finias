import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { formatCurrency } from '../../utils/formatters';
import {
  RotateCcw,
  Search,
  Receipt,
  Check,
  AlertCircle,
  X,
  Banknote,
  CreditCard,
  Building,
  Plus,
  Minus,
  Trash2,
  Printer,
  ShoppingBag,
  Package,
  History,
  User,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Transaction, TransactionItem } from '../../types/erp';

interface PosSaleReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReceipt?: (sale: Transaction) => void;
  onApplyCreditToCart?: (amount: number, description: string) => void;
}

interface ReturnItemSelection {
  productId: string;
  productName: string;
  sku?: string;
  lotId?: string;
  originalQty: number;
  returnQty: number;
  unitPrice: number;
  taxRate?: number;
  reason: string;
  restock: boolean;
}

export const PosSaleReturnModal: React.FC<PosSaleReturnModalProps> = ({
  isOpen,
  onClose,
  onOpenReceipt,
  onApplyCreditToCart,
}) => {
  const {
    transactions = [],
    customers = [],
    products = [],
    currentLocation,
    currentUser,
    cashRegister = { openingCash: 0, cashSales: 0, totalExpenses: 0, status: 'open' },
    settings = {},
    createSale,
    showFlashNotification,
  } = useErp();

  // Active mode: 'invoice' (with receipt) or 'direct' (no receipt) or 'history' (recent returns)
  const [activeTab, setActiveTab] = useState<'invoice' | 'direct' | 'history'>('invoice');

  // Search invoice query
  const [searchInvoiceQuery, setSearchInvoiceQuery] = useState('');
  const [selectedOriginalSale, setSelectedOriginalSale] = useState<Transaction | null>(null);

  // Return items selected
  const [selectedItems, setSelectedItems] = useState<{ [productId: string]: ReturnItemSelection }>({});

  // Direct return state (no receipt)
  const [directCustomerId, setDirectCustomerId] = useState('');
  const [directProductSearch, setDirectProductSearch] = useState('');
  const [directItems, setDirectItems] = useState<ReturnItemSelection[]>([]);

  // Refund payment settings
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [returnNotes, setReturnNotes] = useState('');
  const [globalReturnReason, setGlobalReturnReason] = useState('Customer Request / Changed Mind');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCreatedReturn, setLastCreatedReturn] = useState<Transaction | null>(null);

  // Cash in drawer calculation
  const cashInDrawer = useMemo(() => {
    return (cashRegister?.openingCash || 0) + (cashRegister?.cashSales || 0) - (cashRegister?.totalExpenses || 0);
  }, [cashRegister]);

  // Recent sales for quick one-click lookup
  const recentSales = useMemo(() => {
    return transactions
      .filter((t) => (t.type === 'sale' || !t.type) && t.status === 'final')
      .slice(0, 6);
  }, [transactions]);

  // Recent sale returns for history tab
  const recentReturns = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'sell_return')
      .slice(0, 15);
  }, [transactions]);

  // Calculate previously returned quantities for items in the selected sale
  const previouslyReturnedQuantities = useMemo(() => {
    if (!selectedOriginalSale) return {};
    const map: { [productId: string]: number } = {};
    const saleReturns = transactions.filter(
      (t) =>
        t.type === 'sell_return' &&
        ((t.notes && t.notes.includes(selectedOriginalSale.invoiceNo)) ||
          t.originalSaleId === selectedOriginalSale.id)
    );

    saleReturns.forEach((ret) => {
      ret.items?.forEach((item: TransactionItem) => {
        map[item.productId] = (map[item.productId] || 0) + (item.quantity || 0);
      });
    });
    return map;
  }, [selectedOriginalSale, transactions]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLastCreatedReturn(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Select an original sale
  const handleSelectSale = (sale: Transaction) => {
    setSelectedOriginalSale(sale);
    // Initialize items
    const initialSelection: { [productId: string]: ReturnItemSelection } = {};
    sale.items?.forEach((item: TransactionItem) => {
      const alreadyReturned = previouslyReturnedQuantities[item.productId] || 0;
      const availableToReturn = Math.max(0, item.quantity - alreadyReturned);
      if (availableToReturn > 0) {
        initialSelection[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          lotId: item.lotId,
          originalQty: item.quantity,
          returnQty: availableToReturn,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          reason: globalReturnReason,
          restock: true,
        };
      }
    });
    setSelectedItems(initialSelection);
  };

  // Search invoice handler
  const handleSearchInvoice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInvoiceQuery.trim().toLowerCase();
    if (!query) return;

    const matched = transactions.find(
      (t) =>
        (t.type === 'sale' || !t.type) &&
        (t.invoiceNo.toLowerCase() === query ||
          t.invoiceNo.toLowerCase().includes(query) ||
          (t.id && t.id.toLowerCase() === query))
    );

    if (matched) {
      handleSelectSale(matched);
      showFlashNotification(`Found sale invoice: ${matched.invoiceNo}`, 'success');
    } else {
      // Try searching customer name
      const customerMatch = customers.find((c) => c.name.toLowerCase().includes(query));
      if (customerMatch) {
        const custSale = transactions.find(
          (t) => (t.type === 'sale' || !t.type) && t.customerId === customerMatch.id
        );
        if (custSale) {
          handleSelectSale(custSale);
          showFlashNotification(`Loaded recent invoice for ${customerMatch.name}`, 'info');
          return;
        }
      }
      showFlashNotification(`No sale invoice found matching "${searchInvoiceQuery}".`, 'error');
    }
  };

  // Toggle item in invoice mode
  const handleToggleItem = (item: TransactionItem) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[item.productId]) {
        delete next[item.productId];
      } else {
        const alreadyReturned = previouslyReturnedQuantities[item.productId] || 0;
        const available = Math.max(1, item.quantity - alreadyReturned);
        next[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          lotId: item.lotId,
          originalQty: item.quantity,
          returnQty: available,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          reason: globalReturnReason,
          restock: true,
        };
      }
      return next;
    });
  };

  // Update return qty in invoice mode
  const handleUpdateReturnQty = (productId: string, qty: number, maxQty: number) => {
    const validQty = Math.max(1, Math.min(qty, maxQty));
    setSelectedItems((prev) => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          returnQty: validQty,
        },
      };
    });
  };

  // Update return item field
  const handleUpdateItemField = (productId: string, field: keyof ReturnItemSelection, value: any) => {
    setSelectedItems((prev) => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          [field]: value,
        },
      };
    });
  };

  // Add item to direct return
  const handleAddDirectProduct = (product: any) => {
    const existingIndex = directItems.findIndex((i) => i.productId === product.id);
    if (existingIndex >= 0) {
      setDirectItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, returnQty: item.returnQty + 1 } : item
        )
      );
    } else {
      setDirectItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          originalQty: 1,
          returnQty: 1,
          unitPrice: product.sellingPrice || product.price || 0,
          reason: globalReturnReason,
          restock: true,
        },
      ]);
    }
    setDirectProductSearch('');
  };

  // Financial calculations
  const activeItemsToReturn: ReturnItemSelection[] = useMemo(() => {
    if (activeTab === 'invoice') {
      return Object.values(selectedItems);
    } else {
      return directItems;
    }
  }, [activeTab, selectedItems, directItems]);

  const refundSubtotal = useMemo(() => {
    return activeItemsToReturn.reduce((sum, item) => sum + item.returnQty * item.unitPrice, 0);
  }, [activeItemsToReturn]);

  const refundTax = useMemo(() => {
    if (!settings.enableTax || settings.taxSystem === 'disabled') return 0;
    const defaultTaxRate = settings.defaultTaxRate || 0;
    return activeItemsToReturn.reduce((sum, item) => {
      const rate = item.taxRate !== undefined ? item.taxRate : defaultTaxRate;
      return sum + (item.returnQty * item.unitPrice * rate) / 100;
    }, 0);
  }, [activeItemsToReturn, settings.enableTax, settings.taxSystem, settings.defaultTaxRate]);

  const grandRefundTotal = useMemo(() => {
    return refundSubtotal + refundTax;
  }, [refundSubtotal, refundTax]);

  // Execute Immediate Return
  const handleProcessReturn = () => {
    if (activeItemsToReturn.length === 0) {
      showFlashNotification('Please select at least one item to return.', 'error');
      return;
    }

    if (grandRefundTotal <= 0) {
      showFlashNotification('Return amount must be greater than zero.', 'error');
      return;
    }

    // Determine target customer
    let targetCustId = '';
    if (activeTab === 'invoice' && selectedOriginalSale) {
      targetCustId = selectedOriginalSale.customerId;
    } else {
      targetCustId = directCustomerId || customers[0]?.id || 'cust_walkin';
    }

    const currentYear = new Date().getFullYear();
    const returnInvoiceNo = `POS-RET-${currentYear}-${Math.floor(10000 + Math.random() * 90000)}`;

    setIsProcessing(true);

    try {
      // Build return transaction payload
      const returnSaleData = {
        invoiceNo: returnInvoiceNo,
        type: 'sell_return' as any,
        customerId: targetCustId,
        locationId: currentLocation?.id,
        items: activeItemsToReturn.map((item) => {
          const matchingProduct = products.find((p) => p.id === item.productId);
          return {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku || matchingProduct?.sku || '',
            unit: matchingProduct?.unit || 'pc',
            quantity: item.returnQty,
            unitPrice: item.unitPrice,
            costPrice: matchingProduct?.purchasePrice || matchingProduct?.costPrice || 0,
            taxRate: item.taxRate || 0,
            taxAmount: (item.returnQty * item.unitPrice * (item.taxRate || 0)) / 100,
            total: item.returnQty * item.unitPrice,
            lotId: item.lotId,
            notes: item.reason,
          };
        }),
        subtotal: refundSubtotal,
        taxAmount: refundTax,
        discountAmount: 0,
        shippingCharges: 0,
        totalAmount: grandRefundTotal,
        paidAmount: refundMethod === 'credit' ? 0 : grandRefundTotal,
        paymentMethod: refundMethod,
        notes: `POS Quick Return: ${activeTab === 'invoice' ? `Orig Invoice #${selectedOriginalSale?.invoiceNo}. ` : ''}Reason: ${globalReturnReason}. ${returnNotes}`.trim(),
        status: 'final' as const,
        isPos: true,
        saleChannel: 'pos' as const,
      };

      const createdReturn = createSale(returnSaleData);
      setLastCreatedReturn(createdReturn);
      showFlashNotification(`Sale Return ${returnInvoiceNo} processed successfully!`, 'success');

      // Clear selection
      setSelectedItems({});
      setDirectItems([]);
    } catch (err: any) {
      console.error('POS return failed:', err);
      showFlashNotification(err.message || 'Failed to process sale return.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter products for direct return lookup
  const filteredProducts = useMemo(() => {
    if (!directProductSearch.trim()) return [];
    const query = directProductSearch.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.toLowerCase().includes(query))
      )
      .slice(0, 8);
  }, [directProductSearch, products]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  POS Quick Sale Return & Refund
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  Instant POS Return
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Location: <strong className="text-slate-200">{currentLocation?.name || 'Main Branch'}</strong></span>
                <span>•</span>
                <span>Drawer Cash: <strong className="text-emerald-400 font-mono">{formatCurrency(cashInDrawer, settings)}</strong></span>
              </p>
            </div>
          </div>

          <button
            id="close-pos-return-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* POST-RETURN SUCCESS BANNER */}
        {lastCreatedReturn ? (
          <div className="p-6 sm:p-8 flex-1 flex flex-col items-center justify-center text-center space-y-5 overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-3xl border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                Return Processed Successfully
              </span>
              <h3 className="text-2xl font-black text-white pt-2">
                {lastCreatedReturn.invoiceNo}
              </h3>
              <p className="text-sm text-slate-300 max-w-md">
                Refund amount of{' '}
                <strong className="text-rose-400 font-mono text-base">
                  {formatCurrency(lastCreatedReturn.totalAmount, settings)}
                </strong>{' '}
                has been recorded via <strong className="text-white capitalize">{lastCreatedReturn.paymentMethod}</strong>. Returned items have been restocked to inventory.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full max-w-md">
              {onOpenReceipt && (
                <button
                  id="print-return-receipt-btn"
                  onClick={() => {
                    onOpenReceipt(lastCreatedReturn);
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 transition active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Refund Receipt</span>
                </button>
              )}

              <button
                id="done-return-btn"
                onClick={() => {
                  setLastCreatedReturn(null);
                  setSelectedOriginalSale(null);
                  onClose();
                }}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Return to POS Cart</span>
              </button>
            </div>

            <button
              onClick={() => {
                setLastCreatedReturn(null);
                setSelectedOriginalSale(null);
              }}
              className="text-xs text-indigo-400 hover:underline pt-2"
            >
              + Process Another Return
            </button>
          </div>
        ) : (
          <>
            {/* NAVIGATION TABS */}
            <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2 gap-2 shrink-0">
              <button
                id="tab-return-by-invoice"
                onClick={() => setActiveTab('invoice')}
                className={`pb-2.5 px-3.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                  activeTab === 'invoice'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Return by Sale Invoice</span>
              </button>

              <button
                id="tab-return-direct"
                onClick={() => setActiveTab('direct')}
                className={`pb-2.5 px-3.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                  activeTab === 'direct'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Direct Item Return (No Receipt)</span>
              </button>

              <button
                id="tab-return-history"
                onClick={() => setActiveTab('history')}
                className={`pb-2.5 px-3.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ml-auto ${
                  activeTab === 'history'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Recent Returns ({recentReturns.length})</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* TAB 1: RETURN BY ORIGINAL INVOICE */}
              {activeTab === 'invoice' && (
                <div className="space-y-4">
                  {/* SEARCH INVOICE BAR */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                    <form onSubmit={handleSearchInvoice} className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="pos-return-invoice-input"
                          type="text"
                          value={searchInvoiceQuery}
                          onChange={(e) => setSearchInvoiceQuery(e.target.value)}
                          placeholder="Enter / scan sale invoice # (e.g. POS-2026-..., INV-...) or customer name..."
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs sm:text-sm focus:outline-none focus:border-rose-500 font-mono"
                          autoFocus
                        />
                      </div>
                      <button
                        id="pos-return-search-btn"
                        type="submit"
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950 transition"
                      >
                        <Search className="w-4 h-4" />
                        <span>Find Invoice</span>
                      </button>
                    </form>

                    {/* Quick Recent Sales Chips */}
                    {!selectedOriginalSale && recentSales.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3 text-indigo-400" />
                          <span>Quick Select from Recent Sales:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSales.map((sale) => {
                            const customer = customers.find((c) => c.id === sale.customerId);
                            return (
                              <button
                                key={sale.id}
                                type="button"
                                onClick={() => handleSelectSale(sale)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-rose-500/50 rounded-xl text-left transition flex items-center gap-2 text-xs"
                              >
                                <span className="font-mono font-bold text-white">{sale.invoiceNo}</span>
                                <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                                  {customer?.name || 'Walk-in'}
                                </span>
                                <span className="font-mono font-bold text-emerald-400 text-[11px]">
                                  {formatCurrency(sale.totalAmount, settings)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SELECTED INVOICE DETAILS & ITEMS */}
                  {selectedOriginalSale ? (
                    <div className="space-y-3">
                      {/* Sale Summary Banner */}
                      <div className="p-3.5 bg-slate-950 rounded-2xl border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                            <Receipt className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white font-mono">
                                {selectedOriginalSale.invoiceNo}
                              </h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
                                {selectedOriginalSale.paymentStatus || 'Paid'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Date: {selectedOriginalSale.date} • Customer:{' '}
                              <strong className="text-slate-200">
                                {customers.find((c) => c.id === selectedOriginalSale.customerId)?.name ||
                                  'Walk-in Customer'}
                              </strong>{' '}
                              • Total: <strong className="text-emerald-400 font-mono">{formatCurrency(selectedOriginalSale.totalAmount, settings)}</strong>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedOriginalSale(null)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition"
                        >
                          Change Invoice
                        </button>
                      </div>

                      {/* Items Return Table */}
                      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-rose-400" />
                            <span>Select Items to Return from Invoice</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {Object.keys(selectedItems).length} of {selectedOriginalSale.items?.length || 0} selected
                          </span>
                        </div>

                        <div className="divide-y divide-slate-800/80">
                          {selectedOriginalSale.items?.map((item: TransactionItem) => {
                            const isSelected = !!selectedItems[item.productId];
                            const selectedData = selectedItems[item.productId];
                            const alreadyReturned = previouslyReturnedQuantities[item.productId] || 0;
                            const maxReturnable = Math.max(0, item.quantity - alreadyReturned);

                            if (maxReturnable <= 0) {
                              return (
                                <div key={item.productId} className="p-3 bg-slate-900/40 opacity-50 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">{item.productName}</span>
                                    <span className="text-[10px] text-rose-400 bg-rose-950 px-2 py-0.5 rounded">
                                      Fully Returned ({alreadyReturned}/{item.quantity})
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={item.productId}
                                className={`p-3.5 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                  isSelected ? 'bg-rose-950/15' : 'hover:bg-slate-900/50'
                                }`}
                              >
                                <div className="flex items-start gap-3 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleItem(item)}
                                    className="mt-1 w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700 focus:ring-rose-500 cursor-pointer"
                                  />
                                  <div>
                                    <h5 className="text-xs sm:text-sm font-bold text-white">
                                      {item.productName}
                                    </h5>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                      <span>Sold Qty: <strong className="text-slate-200">{item.quantity}</strong></span>
                                      {alreadyReturned > 0 && (
                                        <span className="text-amber-400 font-semibold">
                                          (Prev Returned: {alreadyReturned})
                                        </span>
                                      )}
                                      <span>•</span>
                                      <span>Price: <strong className="text-slate-200 font-mono">{formatCurrency(item.unitPrice, settings)}</strong></span>
                                    </div>
                                  </div>
                                </div>

                                {isSelected && selectedData && (
                                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                                    {/* Qty Stepper */}
                                    <div className="flex items-center border border-slate-700 bg-slate-900 rounded-xl overflow-hidden">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateReturnQty(
                                            item.productId,
                                            selectedData.returnQty - 1,
                                            maxReturnable
                                          )
                                        }
                                        disabled={selectedData.returnQty <= 1}
                                        className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <input
                                        type="number"
                                        value={selectedData.returnQty}
                                        onChange={(e) =>
                                          handleUpdateReturnQty(
                                            item.productId,
                                            parseInt(e.target.value) || 1,
                                            maxReturnable
                                          )
                                        }
                                        min={1}
                                        max={maxReturnable}
                                        className="w-12 text-center bg-transparent text-xs font-bold text-white focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateReturnQty(
                                            item.productId,
                                            selectedData.returnQty + 1,
                                            maxReturnable
                                          )
                                        }
                                        disabled={selectedData.returnQty >= maxReturnable}
                                        className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Restock checkbox */}
                                    <label className="text-[11px] text-slate-300 flex items-center gap-1.5 cursor-pointer bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800">
                                      <input
                                        type="checkbox"
                                        checked={selectedData.restock}
                                        onChange={(e) =>
                                          handleUpdateItemField(item.productId, 'restock', e.target.checked)
                                        }
                                        className="w-3 h-3 text-rose-500 rounded bg-slate-800"
                                      />
                                      <span>Restock</span>
                                    </label>

                                    {/* Item Refund Subtotal */}
                                    <div className="font-mono font-bold text-rose-400 text-xs sm:text-sm min-w-[70px] text-right">
                                      {formatCurrency(selectedData.returnQty * selectedData.unitPrice, settings)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                      <Search className="w-8 h-8 text-slate-600" />
                      <div className="text-sm font-semibold text-slate-400">
                        Scan or enter a sale invoice above
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm">
                        You can also click on any of the recent sales chips above to immediately load its items for return.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DIRECT ITEM RETURN (NO INVOICE) */}
              {activeTab === 'direct' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Customer Selector */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                          Select Customer
                        </label>
                        <select
                          id="pos-direct-customer-select"
                          value={directCustomerId}
                          onChange={(e) => setDirectCustomerId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                        >
                          <option value="">Walk-in Customer</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.businessName ? `(${c.businessName})` : ''} • Points: {c.loyaltyPoints}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Return Reason */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                          Primary Return Reason
                        </label>
                        <select
                          value={globalReturnReason}
                          onChange={(e) => setGlobalReturnReason(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                        >
                          <option value="Customer Request / Changed Mind">Customer Request / Changed Mind</option>
                          <option value="Defective / Damaged Item">Defective / Damaged Item</option>
                          <option value="Wrong Item / Size">Wrong Item / Size</option>
                          <option value="Expired / Spoiled">Expired / Spoiled</option>
                          <option value="Exchange / Replacement">Exchange / Replacement</option>
                          <option value="Other">Other Reason</option>
                        </select>
                      </div>
                    </div>

                    {/* Product Search Input */}
                    <div className="relative pt-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Search & Add Product to Return
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="pos-direct-product-search"
                          type="text"
                          value={directProductSearch}
                          onChange={(e) => setDirectProductSearch(e.target.value)}
                          placeholder="Search product by name, barcode, or SKU..."
                          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {/* Filtered Dropdown */}
                      {filteredProducts.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-800">
                          {filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleAddDirectProduct(p)}
                              className="w-full p-2.5 text-left hover:bg-slate-800 flex items-center justify-between transition text-xs"
                            >
                              <div>
                                <div className="font-bold text-white">{p.name}</div>
                                <div className="text-[10px] text-slate-400">SKU: {p.sku}</div>
                              </div>
                              <div className="font-mono font-bold text-emerald-400">
                                {formatCurrency(p.sellingPrice || p.price || 0, settings)}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direct Items List */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Items to Return ({directItems.length})
                      </span>
                    </div>

                    {directItems.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No items added yet. Search and pick a product above.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800">
                        {directItems.map((item, idx) => (
                          <div key={`${item.productId}-${idx}`} className="p-3 flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="text-xs font-bold text-white">{item.productName}</div>
                              <div className="text-[10px] text-slate-400">SKU: {item.sku}</div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Quantity */}
                              <div className="flex items-center border border-slate-700 bg-slate-900 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDirectItems((prev) =>
                                      prev.map((it, i) =>
                                        i === idx ? { ...it, returnQty: Math.max(1, it.returnQty - 1) } : it
                                      )
                                    )
                                  }
                                  className="px-2 py-1 text-slate-400 hover:text-white"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-xs font-bold text-white">
                                  {item.returnQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDirectItems((prev) =>
                                      prev.map((it, i) => (i === idx ? { ...it, returnQty: it.returnQty + 1 } : it))
                                    )
                                  }
                                  className="px-2 py-1 text-slate-400 hover:text-white"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="font-mono font-bold text-rose-400 text-xs w-20 text-right">
                                {formatCurrency(item.returnQty * item.unitPrice, settings)}
                              </div>

                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => setDirectItems((prev) => prev.filter((_, i) => i !== idx))}
                                className="p-1 text-slate-500 hover:text-rose-400 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: RECENT RETURNS HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <History className="w-4 h-4 text-indigo-400" />
                        <span>Recently Processed POS Returns</span>
                      </span>
                    </div>

                    {recentReturns.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No sale returns recorded yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800">
                        {recentReturns.map((ret) => {
                          const customer = customers.find((c) => c.id === ret.customerId);
                          return (
                            <div key={ret.id} className="p-3.5 hover:bg-slate-900/50 flex items-center justify-between gap-3 text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-white">{ret.invoiceNo}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                                    {ret.paymentMethod || 'cash'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {ret.date} • {customer?.name || 'Walk-in'} • {ret.items?.length || 0} item(s)
                                </div>
                                {ret.notes && <div className="text-[10px] text-slate-500 italic mt-0.5">{ret.notes}</div>}
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="font-mono font-black text-rose-400 text-sm">
                                  -{formatCurrency(ret.totalAmount, settings)}
                                </div>

                                {onOpenReceipt && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenReceipt(ret)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition"
                                    title="Reprint Return Receipt"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* REFUND CONTROLS & BOTTOM ACTIONS (Visible if activeTab is not history) */}
            {activeTab !== 'history' && (
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/95 shrink-0 space-y-4">
                {/* Method & Notes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Refund Method Selector */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Refund Method
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRefundMethod('cash')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition border ${
                          refundMethod === 'cash'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Cash</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRefundMethod('credit')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition border ${
                          refundMethod === 'credit'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        <Building className="w-3.5 h-3.5" />
                        <span>Credit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRefundMethod('card')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition border ${
                          refundMethod === 'card'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Return Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Cashier Return Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      placeholder="e.g. Customer returned sealed box, manager approved refund"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Financial Summary & Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                  {/* Total Refund Due */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Total Refund Amount
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                        {formatCurrency(grandRefundTotal, settings)}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 hidden sm:block pl-2 border-l border-slate-800">
                      <div>Items: <strong className="text-slate-300">{activeItemsToReturn.length}</strong></div>
                      <div>Tax: <strong className="text-slate-300">{formatCurrency(refundTax, settings)}</strong></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {onApplyCreditToCart && grandRefundTotal > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onApplyCreditToCart(grandRefundTotal, `Return Credit (#${selectedOriginalSale?.invoiceNo || 'Direct'})`);
                          handleProcessReturn();
                        }}
                        className="py-2.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        title="Apply return credit towards currently active POS cart"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Exchange / Cart Credit</span>
                      </button>
                    )}

                    <button
                      id="pos-process-return-submit-btn"
                      type="button"
                      disabled={isProcessing || activeItemsToReturn.length === 0 || grandRefundTotal <= 0}
                      onClick={handleProcessReturn}
                      className="flex-1 sm:flex-initial py-2.5 px-5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                      <span>{isProcessing ? 'Processing...' : 'Complete Sale Return'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function ClockIcon(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
