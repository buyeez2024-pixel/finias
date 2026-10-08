import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { TransactionItem, TransactionStatus, PaymentMethod, Product } from '../../types/erp';
import { isTransactionEditable, formatCurrency, applyAmountRounding } from '../../utils/formatters';
import { validatePurchaseData } from '../../utils/validation';
import { Truck, Plus, Trash2, ArrowLeft, CheckCircle2, Boxes, Clock, User, Landmark, CreditCard, Search, Calculator, Percent, Info, X, FileText, Banknote, Building, FileCheck, Sparkles } from 'lucide-react';
import { ProductFormPage } from '../inventory/ProductFormPage';
import { ContactFormPage } from '../contacts/ContactFormPage';
import { SearchableDropdown } from '../common/SearchableDropdown';

export const PurchaseFormPage: React.FC = () => {
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
    taxRates,
    taxGroups,
    paymentMethods
  } = useErp();

  const isEditMode = !!editingPurchase;
  const isViewMode = !!viewingPurchase;
  const purchaseToUse = editingPurchase || viewingPurchase;

  // Helper to normalize any date format (DD-MM-YYYY, YYYY-MM-DD, ISO) into HTML5 input format (YYYY-MM-DD)
  const normalizeToInputDateFormat = (d?: string): string => {
    if (!d) return new Date().toISOString().slice(0, 10);
    const trimmed = String(d).trim().split(' ')[0];
    // Check DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
    const ddmmyyyy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Check YYYY-MM-DD
    const yyyymmdd = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (yyyymmdd) {
      const [, year, month, day] = yyyymmdd;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Try native Date parse
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
  };

  // Header State
  const [supplierId, setSupplierId] = useState(purchaseToUse?.supplierId || '');
  const [locationId, setLocationId] = useState(purchaseToUse?.locationId || '');
  const [status, setStatus] = useState<TransactionStatus>(purchaseToUse?.status || '' as any);
  const [purchaseDate, setPurchaseDate] = useState(() => {
    return normalizeToInputDateFormat(purchaseToUse?.date);
  });

  // Automatically synchronize date when editingPurchase changes
  React.useEffect(() => {
    if (purchaseToUse?.date) {
      setPurchaseDate(normalizeToInputDateFormat(purchaseToUse.date));
    }
  }, [purchaseToUse]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(purchaseToUse?.paymentEntries?.[0]?.method || '');
  const [shippingCost, setShippingCost] = useState(purchaseToUse?.shippingCharges?.toString() || '0.00');
  const [purchaseTaxPercent, setPurchaseTaxPercent] = useState('0');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [purchaseDiscountAmount, setPurchaseDiscountAmount] = useState('0');
  const [notes, setNotes] = useState(purchaseToUse?.notes || '');
  const [shippingDetails, setShippingDetails] = useState(purchaseToUse?.shippingDetails || '');
  const [shippingAddress, setShippingAddress] = useState(purchaseToUse?.shippingAddress || '');
  const [paymentNote, setPaymentNote] = useState('');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  
  // Additional Expenses State
  const [additionalExpenses, setAdditionalExpenses] = useState<{ name: string; amount: string }[]>([]);

  const addExpenseRow = () => {
    setAdditionalExpenses(prev => [...prev, { name: '', amount: '' }]);
  };

  const removeExpenseRow = (index: number) => {
    setAdditionalExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const updateExpenseRow = (index: number, field: 'name' | 'amount', value: string) => {
    setAdditionalExpenses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Card Payment Details State
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolderName: '',
    cardTransactionNo: '',
    cardType: 'Credit Card',
    month: '',
    year: '',
    securityCode: ''
  });

  const updateCardDetail = (field: string, value: string) => {
    setCardDetails(prev => ({ ...prev, [field]: value }));
  };

  // Additional Payment Details State
  const [extraPaymentDetails, setExtraPaymentDetails] = useState({
    bankAccountNo: '',
    chequeNo: '',
    transactionNo: ''
  });

  const updateExtraDetail = (field: string, value: string) => {
    setExtraPaymentDetails(prev => ({ ...prev, [field]: value }));
  };

  const [lotNumber, setLotNumber] = useState(purchaseToUse?.lotNumber || `PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

  // Product Search State
  const [productSearch, setProductSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showFullProductModal, setShowFullProductModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  // Helper to map and sanitize any purchase item (ensuring Selling Price & Margin are always initialized)
  const mapPurchaseItem = (item: any): TransactionItem => {
    const matchedProd = products?.find(
      (p) => (item.productId && p.id === item.productId) || (item.sku && p.sku && p.sku === item.sku) || (item.productName && p.name === item.productName)
    );
    const costExclTax = item.costPrice !== undefined && item.costPrice !== null && !isNaN(Number(item.costPrice))
      ? Number(item.costPrice)
      : (item.unitPrice ? Number(item.unitPrice) : 0);
    const taxRate = item.taxRate !== undefined && item.taxRate !== null && !isNaN(Number(item.taxRate))
      ? Number(item.taxRate)
      : 0;
    const inclTax = item.unitPrice && Number(item.unitPrice) > 0
      ? Number(item.unitPrice)
      : Number((costExclTax * (1 + taxRate / 100)).toFixed(2));

    // Determine Margin %
    let marginPercent: number;
    if (item.marginPercent !== undefined && item.marginPercent !== null && !isNaN(Number(item.marginPercent))) {
      marginPercent = Number(item.marginPercent);
    } else if (item.sellingPrice && Number(item.sellingPrice) > 0 && inclTax > 0) {
      marginPercent = Number((((Number(item.sellingPrice) - inclTax) / inclTax) * 100).toFixed(2));
    } else if (matchedProd?.profitMargin !== undefined && matchedProd.profitMargin !== null && !isNaN(Number(matchedProd.profitMargin))) {
      marginPercent = Number(matchedProd.profitMargin);
    } else if (matchedProd?.costPrice && matchedProd.costPrice > 0 && matchedProd.sellingPrice && matchedProd.sellingPrice > 0) {
      marginPercent = Number((((Number(matchedProd.sellingPrice) - Number(matchedProd.costPrice)) / Number(matchedProd.costPrice)) * 100).toFixed(2));
    } else {
      marginPercent = settings.defaultProfitPercent ? Number(settings.defaultProfitPercent) : 25;
    }

    // Determine Selling Price
    let sellingPrice: number;
    if (item.sellingPrice !== undefined && item.sellingPrice !== null && !isNaN(Number(item.sellingPrice)) && Number(item.sellingPrice) > 0) {
      sellingPrice = Number(item.sellingPrice);
    } else if (matchedProd?.sellingPrice && Number(matchedProd.sellingPrice) > 0) {
      sellingPrice = Number(matchedProd.sellingPrice);
    } else {
      sellingPrice = Number((inclTax * (1 + marginPercent / 100)).toFixed(2));
    }

    return {
      ...item,
      costPrice: costExclTax,
      taxRate,
      unitPrice: inclTax,
      total: item.total || (Number(item.quantity || 1) * inclTax),
      marginPercent,
      sellingPrice,
    };
  };

  // Items State
  const [items, setItems] = useState<TransactionItem[]>(() => {
    if (!purchaseToUse?.items || !Array.isArray(purchaseToUse.items)) return [];
    return purchaseToUse.items.map(mapPurchaseItem);
  });

  // Re-sync items when editing/viewing purchase changes
  React.useEffect(() => {
    if (purchaseToUse?.items && Array.isArray(purchaseToUse.items)) {
      setItems(purchaseToUse.items.map(mapPurchaseItem));
    }
  }, [purchaseToUse?.id]);

  // Filtered Products for Search
  const filteredProducts = useMemo(() => {
    if (!productSearch || !productSearch.trim()) return [];
    const query = productSearch.toLowerCase().trim();
    if (!products || !Array.isArray(products)) return [];

    return products
      .filter((p) => {
        if (!p) return false;
        const name = String(p.name || '').toLowerCase();
        const sku = String(p.sku || '').toLowerCase();
        const barcode = String(p.barcode || '').toLowerCase();
        const category = String(p.category || '').toLowerCase();
        return name.includes(query) || sku.includes(query) || barcode.includes(query) || category.includes(query);
      })
      .slice(0, 10);
  }, [productSearch, products]);

  const isTaxEnabled = settings.taxSystem !== 'disabled';
  const showInlineTax = settings.taxSystem !== 'disabled' && (settings.enableInlineTax ?? true);

  // Build GST options for inline line item dropdown (Select GST, None (0%), Active Default GST, etc.)
  const gstOptions = useMemo(() => {
    const list: { label: string; value: number }[] = [];

    // Tax Groups
    if (taxGroups && Array.isArray(taxGroups)) {
      taxGroups.forEach((g) => {
        if (!list.some((o) => o.value === g.totalRate)) {
          const isDefault = g.isDefault || g.totalRate === settings.defaultTaxRate;
          list.push({
            label: `${g.name}${isDefault ? ' (Active Default)' : ''}`,
            value: g.totalRate,
          });
        }
      });
    }

    // Tax Rates
    if (taxRates && Array.isArray(taxRates)) {
      taxRates.forEach((r) => {
        if (r.rate > 0 && !list.some((o) => o.value === r.rate)) {
          const isDefault = r.rate === settings.defaultTaxRate;
          list.push({
            label: `${r.name} (${r.rate}%)${isDefault ? ' (Active Default)' : ''}`,
            value: r.rate,
          });
        }
      });
    }

    // Common standard GST rates for India / general VAT
    const standardGstRates = [5, 12, 18, 28];
    standardGstRates.forEach((rate) => {
      if (!list.some((o) => o.value === rate)) {
        list.push({
          label: `GST ${rate}%`,
          value: rate,
        });
      }
    });

    // Fallback Active Default GST
    if (settings.defaultTaxRate && settings.defaultTaxRate > 0 && !list.some((o) => o.value === settings.defaultTaxRate)) {
      list.push({
        label: `Active Default GST (${settings.defaultTaxRate}%)`,
        value: settings.defaultTaxRate,
      });
    }

    list.sort((a, b) => a.value - b.value);
    return list;
  }, [taxGroups, taxRates, settings.defaultTaxRate]);

  const addProductToItems = (prod: Product) => {
    const existingIdx = items.findIndex((item) => item.productId === prod.id);
    if (existingIdx >= 0) {
      handleQtyChange(existingIdx, items[existingIdx].quantity + 1);
    } else {
      // Default tax selection is "None" (0%) as requested
      const initialTaxRate = 0;
      const baseCost = prod.costPrice || 0;
      const inclTax = baseCost * (1 + initialTaxRate / 100);

      // Determine default profit margin %
      const defaultProfitMargin =
        prod.profitMargin !== undefined && prod.profitMargin !== null && !isNaN(Number(prod.profitMargin))
          ? Number(prod.profitMargin)
          : (prod.costPrice && prod.costPrice > 0 && prod.sellingPrice && prod.sellingPrice > 0)
            ? Number((((prod.sellingPrice - prod.costPrice) / prod.costPrice) * 100).toFixed(2))
            : (settings.defaultProfitPercent ? Number(settings.defaultProfitPercent) : 25);

      // Calculate selling price with default margin applied
      const initialSellingPrice =
        prod.sellingPrice && prod.sellingPrice > 0
          ? prod.sellingPrice
          : Number((inclTax * (1 + defaultProfitMargin / 100)).toFixed(2));

      const newItem: TransactionItem = {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        quantity: 1,
        costPrice: baseCost, // Base Cost (Excl. Tax)
        taxRate: initialTaxRate,
        taxAmount: (baseCost * initialTaxRate) / 100,
        unitPrice: inclTax, // Cost (Incl. Tax)
        discount: 0,
        total: inclTax,
        marginPercent: defaultProfitMargin,
        sellingPrice: initialSellingPrice,
      };
      setItems((prev) => [...prev, newItem]);
    }
    setProductSearch('');
    setShowSearchResults(false);
  };

  const handleQtyChange = (index: number, qty: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const newQty = Math.max(0, isNaN(qty) ? 0 : qty);
        const rate = item.taxRate || 0;
        const lineTax = ((item.costPrice || 0) * rate / 100) * newQty;
        return {
          ...item,
          quantity: newQty,
          taxAmount: Math.round(lineTax * 100) / 100,
          total: newQty * item.unitPrice,
        };
      })
    );
  };

  const handleCostChange = (index: number, newCostExclTax: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const rate = item.taxRate || 0;
        const inclTax = newCostExclTax * (1 + rate / 100);
        const lineTax = (newCostExclTax * rate / 100) * (item.quantity || 1);
        const itemMargin = item.marginPercent !== undefined && !isNaN(item.marginPercent)
          ? item.marginPercent
          : (settings.defaultProfitPercent ? Number(settings.defaultProfitPercent) : 25);
        const newSellingPrice = Number((inclTax * (1 + itemMargin / 100)).toFixed(2));

        return {
          ...item,
          costPrice: newCostExclTax,
          taxAmount: Math.round(lineTax * 100) / 100,
          unitPrice: inclTax,
          total: item.quantity * inclTax,
          marginPercent: itemMargin,
          sellingPrice: newSellingPrice,
        };
      })
    );
  };

  const handleTaxChange = (index: number, newTaxRate: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const rate = Math.max(0, newTaxRate);
        const inclTax = item.costPrice * (1 + rate / 100);
        const lineTax = (item.costPrice * rate / 100) * (item.quantity || 1);
        const itemMargin = item.marginPercent !== undefined && !isNaN(item.marginPercent)
          ? item.marginPercent
          : (settings.defaultProfitPercent ? Number(settings.defaultProfitPercent) : 25);
        const newSellingPrice = Number((inclTax * (1 + itemMargin / 100)).toFixed(2));

        return {
          ...item,
          taxRate: rate,
          taxAmount: Math.round(lineTax * 100) / 100,
          unitPrice: inclTax,
          total: item.quantity * inclTax,
          marginPercent: itemMargin,
          sellingPrice: newSellingPrice,
        };
      })
    );
  };

  const handleMarginChange = (index: number, newMargin: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const inclTax = item.unitPrice || (item.costPrice * (1 + (item.taxRate || 0) / 100));
        const newSellingPrice = Number((inclTax * (1 + newMargin / 100)).toFixed(2));
        return {
          ...item,
          marginPercent: newMargin,
          sellingPrice: newSellingPrice,
        };
      })
    );
  };

  const handleSellingPriceChange = (index: number, newSellingPrice: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
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
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };


  // Summary Calculations
  const subtotalItems = items.reduce((acc, item) => acc + item.total, 0);
  const itemsTaxAmount = items.reduce((acc, item) => {
    const rate = Number(item.taxRate) || 0;
    const baseCost = Number(item.costPrice) || 0;
    const qty = Number(item.quantity) || 0;
    const itemTax = item.taxAmount !== undefined && item.taxAmount !== null
      ? Number(item.taxAmount)
      : (baseCost * rate / 100) * qty;
    return acc + itemTax;
  }, 0);
  const orderTaxAmount = isTaxEnabled ? (subtotalItems * parseFloat(purchaseTaxPercent || '0')) / 100 : 0;
  const totalPurchaseTax = Math.round((itemsTaxAmount + orderTaxAmount) * 100) / 100;
  
  const additionalExpensesAmount = useMemo(() => {
    return additionalExpenses.reduce((acc, exp) => acc + (parseFloat(exp.amount) || 0), 0);
  }, [additionalExpenses]);

  const grandTotal = applyAmountRounding(subtotalItems + orderTaxAmount + parseFloat(shippingCost || '0') - parseFloat(purchaseDiscountAmount || '0') + additionalExpensesAmount, settings.amountRoundingMethod);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const effectivePaidAmount = paidAmountInput !== '' ? parseFloat(paidAmountInput || '0') : (grandTotal > 0 ? grandTotal : 0);

    const schemaRes = validatePurchaseData({
      supplierId,
      purchaseDate,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitCost: it.unitPrice,
      })),
      paymentAmount: effectivePaidAmount,
    });

    if (!schemaRes.isValid) {
      showFlashNotification(schemaRes.firstError || 'Please correct the purchase order form errors.', 'error');
      return;
    }

    if (effectivePaidAmount > 0 && !paymentMethod) {
      showFlashNotification('Please select a Payment Method for the payment amount', 'error');
      return;
    }

    const payload = {
      supplierId,
      locationId,
      date: purchaseDate,
      items: items.map((it) => {
        const rate = Number(it.taxRate) || 0;
        const lineTax = it.taxAmount !== undefined && it.taxAmount !== null
          ? Number(it.taxAmount)
          : ((Number(it.costPrice) || 0) * rate / 100) * (Number(it.quantity) || 0);
        return {
          ...it,
          taxRate: rate,
          taxAmount: Math.round(lineTax * 100) / 100,
        };
      }),
      subtotal: subtotalItems,
      taxAmount: totalPurchaseTax,
      orderTaxRate: parseFloat(purchaseTaxPercent || '0'),
      discountAmount: parseFloat(purchaseDiscountAmount || '0'),
      discountType,
      shippingCharges: parseFloat(shippingCost || '0'),
      shippingDetails,
      shippingAddress,
      totalAmount: grandTotal,
      paidAmount: effectivePaidAmount,
      paymentMethod: paymentMethod || 'cash',
      paymentEntries: effectivePaidAmount > 0 ? [
        {
          id: `pay_${Date.now()}`,
          method: paymentMethod || 'cash',
          amount: effectivePaidAmount,
          date: purchaseDate,
          note: paymentNote
        }
      ] : [],
      cardDetails: (paymentMethod === 'card' || 
        paymentMethod.toString().toLowerCase().includes('terminal') || 
        paymentMethod.toString().toLowerCase().includes('pos')) ? cardDetails : undefined,
      extraPaymentDetails: (['bank_transfer', 'cheque', 'upi', 'qr', 'phonepay'].includes(paymentMethod) || 
        paymentMethod.toString().toLowerCase().includes('terminal') || 
        paymentMethod.toString().toLowerCase().includes('pos') ||
        paymentMethod.toString().toLowerCase().includes('card')) ? extraPaymentDetails : undefined,
      notes,
      lotNumber: lotNumber.trim(),
      status,
      additionalExpenses: additionalExpenses.filter(e => e.name && parseFloat(e.amount) > 0).map(e => ({ name: e.name, amount: parseFloat(e.amount) })),
    };

    if (isEditMode && editingPurchase) {
      const editCheck = isTransactionEditable(editingPurchase.date, settings.transactionEditDays);
      if (!editCheck.canEdit) {
        showFlashNotification(editCheck.reason || 'Transaction cannot be edited', 'error');
        return;
      }
      updatePurchase(editingPurchase.id, payload);
    } else {
      createPurchase(payload);
    }

    const totalActiveQty = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);

    showFlashNotification(
      isEditMode 
        ? totalActiveQty === 0 
          ? `Purchase Order ${purchaseToUse?.invoiceNo} updated to 0 quantity. Record can now be deleted from All Purchases, and removed products have been cleared from All Products.`
          : `Purchase Order ${purchaseToUse?.invoiceNo} updated.` 
        : `Purchase successful. Stock updated under Lot: ${lotNumber}`, 
      'success'
    );
    setActiveTab('purchases');
  };

  return (
    <div className="max-w-7xl mx-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 pb-28 animate-fadeIn w-full max-w-full min-w-0 overflow-x-hidden text-slate-100">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-sm w-full min-w-0">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setActiveTab('purchases')}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-400 hover:text-white border border-slate-700/80 cursor-pointer"
            title="Back to All Purchases"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800/40">
                Procurement
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium">Inward Stock & Purchase Invoice</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
              <Truck className="w-6 h-6 text-indigo-400" />
              <span>{isViewMode ? 'Purchase Order Audit' : isEditMode ? 'Modify Purchase Order' : 'New Inward & Purchase'}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Payable:</span>
            <span className="text-base sm:text-lg font-mono font-black text-emerald-400">{formatCurrency(grandTotal, settings)}</span>
          </div>

          {!isViewMode && (
            <button
              type="button"
              onClick={handleSubmit as any}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 text-xs uppercase tracking-wider cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditMode ? 'Update' : 'Save Purchase'}</span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Master Header Information (Supplier, Location, Date, Status, Lot) */}
        <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Purchase Order & Supplier Details</span>
            </h2>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 1 of 3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
            {/* Supplier Field with integrated + button */}
            <div className="space-y-1.5 relative z-30">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 h-5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Supplier *</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <SearchableDropdown
                    options={suppliers.map(s => ({
                      id: s.id,
                      name: `${s.name} ${s.businessName ? `(${s.businessName})` : ''}`,
                      phone: s.phone
                    }))}
                    value={supplierId}
                    onChange={(value) => setSupplierId(value)}
                    disabled={isViewMode}
                    placeholder="-- Select Supplier --"
                    triggerClassName="px-3 py-2.5 rounded-xl border-slate-700 text-xs font-medium h-11"
                  />
                </div>
                {!isViewMode && (
                  <button
                    type="button"
                    id="btn-quick-add-supplier-beside"
                    onClick={() => setShowAddSupplierModal(true)}
                    className="h-11 w-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border border-indigo-500/40 shadow-sm flex items-center justify-center transition-all shrink-0 active:scale-95 group cursor-pointer"
                    title="Add New Supplier"
                  >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                )}
              </div>
            </div>

            {/* Business Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 h-5">
                <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                <span>Business Location *</span>
              </label>
              <select
                required
                disabled={isViewMode}
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full h-11 bg-slate-950 text-white px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-xs font-medium cursor-pointer"
              >
                <option value="" disabled>-- Select Location --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.city ? `(${loc.city})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Purchase Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 h-5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Purchase Date *</span>
              </label>
              <input
                required
                disabled={isViewMode}
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full h-11 bg-slate-950 text-white px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-xs font-medium"
              />
            </div>

            {/* Purchase Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 h-5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Purchase Status *</span>
              </label>
              <select
                required
                disabled={isViewMode}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-11 bg-slate-950 text-white px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-xs font-medium cursor-pointer"
              >
                <option value="" disabled>-- Select Status --</option>
                <option value="received">Received (In Stock)</option>
                <option value="ordered">Ordered</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Global Lot Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 h-5">
                <Boxes className="w-3.5 h-3.5 text-amber-400" />
                <span>Global Lot Number</span>
              </label>
              <input
                required
                disabled={isViewMode}
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="PUR-2026-0000"
                className="w-full h-11 bg-slate-950 text-amber-400 px-3 py-2.5 rounded-xl border border-slate-700 focus:border-amber-500/50 outline-none transition-all font-mono font-bold text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Product Search & Item Matrix */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-800/40 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Scan barcode or type product name, SKU, or category to add..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full h-11 bg-slate-950 text-white pl-10 pr-4 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-xs font-medium"
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProductToItems(p)}
                        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800 transition-colors text-left border-b border-slate-800/80 last:border-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-indigo-400">
                            {p.sku ? p.sku.slice(-4) : 'PROD'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {p.sku} • In Stock: {p.currentStock} {p.unit}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-bold font-mono text-xs">{formatCurrency(p.costPrice, settings)}</div>
                          <div className="text-[10px] text-slate-400">Default Cost</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!isViewMode && (
                <button
                  type="button"
                  onClick={() => setShowFullProductModal(true)}
                  className="h-11 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/20 text-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Product</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto w-full min-w-0 scrollbar-thin">
            <table className="w-full border-collapse text-left min-w-[850px]">
              <thead>
                <tr className="bg-slate-950/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[220px]">Product Details</th>
                  <th className="py-3 px-4 w-28 text-center">Qty</th>
                  <th className="py-3 px-4 min-w-[130px]">Cost (Excl. Tax)</th>
                  {showInlineTax && <th className="py-3 px-4 min-w-[150px] text-center">Tax / GST</th>}
                  <th className="py-3 px-4 min-w-[130px]">Cost (Incl. Tax)</th>
                  <th className="py-3 px-4 min-w-[110px] text-center">Margin (%)</th>
                  <th className="py-3 px-4 min-w-[130px]">Selling Price</th>
                  <th className="py-3 px-4 min-w-[130px] text-right">Line Total</th>
                  <th className="py-3 px-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item, idx) => {
                  const currentMargin = item.marginPercent !== undefined && !isNaN(item.marginPercent)
                    ? item.marginPercent
                    : (item.unitPrice > 0 ? ((item.sellingPrice! - item.unitPrice) / item.unitPrice) * 100 : 0);
                  
                  return (
                    <tr key={`${item.productId}-${idx}`} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 text-xs font-bold text-slate-500 text-center">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-bold text-white">{item.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{item.sku}</span>
                          {item.unit && (
                            <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[9px]">
                              {item.unit}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          disabled={isViewMode}
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-20 bg-slate-950 text-center text-white font-bold py-1.5 px-2 rounded-lg border border-slate-700 text-xs focus:border-indigo-500 outline-none"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-xs text-slate-500 font-mono">{settings.currencySymbol || '$'}</span>
                          <input
                            disabled={isViewMode}
                            type="number"
                            step="0.01"
                            value={item.costPrice}
                            onChange={(e) => handleCostChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-28 bg-slate-950 pl-6 pr-2 py-1.5 rounded-lg border border-slate-700 text-white font-mono font-bold text-xs outline-none focus:border-indigo-500"
                          />
                        </div>
                      </td>
                      {showInlineTax && (
                        <td className="py-3 px-4 text-center">
                          {(() => {
                            const baseCost = Number(item.costPrice || 0);
                            const taxRate = Number(item.taxRate || 0);
                            const taxPerUnit = (baseCost * taxRate) / 100;
                            const totalLineTax = taxPerUnit * (Number(item.quantity) || 0);

                            return isViewMode ? (
                              <div className="flex flex-col items-center">
                                <span className="font-mono text-xs text-slate-300 font-semibold">
                                  {taxRate > 0 ? `${taxRate}%` : 'None (0%)'}
                                </span>
                                {taxRate > 0 ? (
                                  <div className="text-[10px] text-amber-400 font-mono font-medium mt-0.5">
                                    +{formatCurrency(totalLineTax, settings)}
                                    <span className="text-slate-500 ml-1">({formatCurrency(taxPerUnit, settings)}/u)</span>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">₹0.00</div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <select
                                  id={`purchase-item-tax-${idx}`}
                                  value={item.taxRate !== undefined && item.taxRate !== null ? item.taxRate : 0}
                                  onChange={(e) => handleTaxChange(idx, parseFloat(e.target.value) || 0)}
                                  className="w-32 bg-slate-950 text-slate-200 font-mono text-xs py-1.5 px-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500 font-medium cursor-pointer"
                                >
                                  <option value="0">None (0%)</option>
                                  {gstOptions.map((opt) => (
                                    <option key={`${opt.label}-${opt.value}`} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="text-[10px] font-mono flex items-center justify-center">
                                  {taxRate > 0 ? (
                                    <span className="text-amber-400 font-semibold" title={`Applied Tax: ${formatCurrency(totalLineTax, settings)} total (${formatCurrency(taxPerUnit, settings)} per unit)`}>
                                      +{formatCurrency(totalLineTax, settings)} <span className="text-slate-500 font-normal">({formatCurrency(taxPerUnit, settings)}/u)</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 font-normal">No tax (0%)</span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="text-xs font-mono font-bold text-emerald-400">{formatCurrency(item.unitPrice, settings)}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isViewMode ? (
                          <span className="font-mono text-xs font-bold text-indigo-400">
                            {currentMargin.toFixed(1)}%
                          </span>
                        ) : (
                          <div className="relative inline-flex items-center justify-center">
                            <input
                              id={`purchase-item-margin-${idx}`}
                              type="number"
                              step="0.1"
                              value={item.marginPercent !== undefined && !isNaN(item.marginPercent) ? item.marginPercent : Number(currentMargin.toFixed(1))}
                              onChange={(e) => handleMarginChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-20 bg-slate-950 text-center text-indigo-400 font-mono font-bold py-1.5 px-2 rounded-lg border border-slate-700 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none transition"
                              placeholder="0.0"
                              title="Profit Margin % (Admin can adjust to automatically update Selling Price)"
                            />
                            <span className="ml-1 text-[10px] font-mono text-slate-500 font-bold">%</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-xs text-slate-500 font-mono">{settings.currencySymbol || '$'}</span>
                          <input
                            disabled={isViewMode}
                            type="number"
                            step="0.01"
                            value={item.sellingPrice !== undefined && item.sellingPrice !== null && !isNaN(item.sellingPrice) ? item.sellingPrice : ''}
                            onChange={(e) => handleSellingPriceChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-28 bg-slate-950 pl-6 pr-2 py-1.5 rounded-lg border border-slate-700 text-indigo-300 font-mono font-bold text-xs outline-none focus:border-indigo-500"
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono font-black text-white">
                        {formatCurrency(item.total, settings)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!isViewMode && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                            title="Remove Product"
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
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <Calculator className="w-6 h-6" />
              </div>
              <div className="text-slate-300 text-xs font-semibold">
                {isEditMode ? 'All products removed from this purchase order' : 'No products added yet'}
              </div>
              <p className="text-slate-500 text-[11px] max-w-md mx-auto">
                {isEditMode 
                  ? 'Click "Update Purchase" below to save with 0 quantity. This will reverse all stocks, purge removed direct-purchase products from All Products, and allow deleting this purchase record.'
                  : 'Scan a barcode or use the product search bar above to populate items in this inward purchase.'}
              </p>
            </div>
          )}
        </div>

        {/* SECTION 3: Financial Modifiers (Discounts, Taxes, Shipping & Expenses) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card A: Discounts & Order Tax & Notes */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Percent className="w-4 h-4 text-amber-400" />
              <span>Discount, Order Taxes & Purchase Notes</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Discount Type</label>
                <select
                  value={discountType}
                  disabled={isViewMode}
                  onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                  className="w-full h-11 bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none"
                >
                  <option value="fixed">Fixed Amount ({settings.currencySymbol || '$'})</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Discount Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchaseDiscountAmount}
                  disabled={isViewMode}
                  onChange={(e) => setPurchaseDiscountAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 bg-slate-950 font-mono text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Purchase Order Tax (%) {!isTaxEnabled && <span className="text-[10px] text-amber-400 font-normal">(Tax Engine Disabled)</span>}
              </label>
              <input
                type="number"
                value={purchaseTaxPercent}
                disabled={isViewMode || !isTaxEnabled}
                onChange={(e) => setPurchaseTaxPercent(e.target.value)}
                className={`w-full h-11 bg-slate-950 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none ${
                  !isTaxEnabled ? 'text-slate-600 cursor-not-allowed opacity-60' : 'text-white font-mono'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Purchase Notes / Terms</label>
              <textarea
                value={notes}
                disabled={isViewMode}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Supplier stock replenishment, net 30 days terms, inward gate pass no..."
                rows={3}
                className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Card B: Shipping & Additional Expenses */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Truck className="w-4 h-4 text-sky-400" />
              <span>Shipping & Additional Expenses</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Shipping Charges ({settings.currencySymbol || '$'})</label>
                <input
                  type="number"
                  step="0.01"
                  value={shippingCost}
                  disabled={isViewMode}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 bg-slate-950 font-mono text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Shipping Status</label>
                <select
                  value={status}
                  disabled={isViewMode}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-11 bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none"
                >
                  <option value="received">Received</option>
                  <option value="pending">Pending</option>
                  <option value="ordered">Ordered</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Shipping Destination Address</label>
              <textarea
                value={shippingAddress}
                disabled={isViewMode}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="e.g. Warehouse Bay 4, 1200 Commerce Blvd..."
                rows={2}
                className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none resize-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Additional Expenses</h3>
                  {additionalExpensesAmount > 0 && (
                    <span 
                      id="additional-expenses-amount-badge"
                      className="additional-expenses-badge text-[10px] font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40"
                    >
                      +{formatCurrency(additionalExpensesAmount, settings)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addExpenseRow}
                  disabled={isViewMode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Expense</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {additionalExpenses.map((exp, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={exp.name}
                        disabled={isViewMode}
                        onChange={(e) => updateExpenseRow(idx, 'name', e.target.value)}
                        placeholder="Expense title (e.g. Packaging, Customs)"
                        className="w-full h-10 bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-sky-500 outline-none"
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        value={exp.amount}
                        disabled={isViewMode}
                        onChange={(e) => updateExpenseRow(idx, 'amount', e.target.value)}
                        placeholder="0.00"
                        className="w-full h-10 bg-slate-950 font-mono text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-sky-500 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isViewMode}
                      onClick={() => removeExpenseRow(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {additionalExpenses.length === 0 && (
                  <div className="py-4 text-center border border-dashed border-slate-800 rounded-xl">
                    <p className="text-[11px] text-slate-500">No additional expenses added</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Payment Settlement & Financial Summary */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Payment Settlement & Inward Accounting</span>
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs text-slate-400">
                Subtotal: <span className="font-mono text-slate-200 font-bold">{formatCurrency(subtotalItems, settings)}</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="text-xs text-slate-400">
                Grand Total: <span className="font-mono text-emerald-400 font-black">{formatCurrency(grandTotal, settings)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Payment Amount ({settings.currencySymbol || '$'})</label>
                {!isViewMode && (
                  <button
                    type="button"
                    onClick={() => setPaidAmountInput(grandTotal.toFixed(2))}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/40 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    title="Quickly fill the full grand total balance"
                  >
                    Pay Full
                  </button>
                )}
              </div>
              <input
                type="number"
                step="0.01"
                value={paidAmountInput !== '' ? paidAmountInput : grandTotal.toFixed(2)}
                onChange={(e) => setPaidAmountInput(e.target.value)}
                className="w-full h-11 bg-slate-950 font-mono text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Payment Method {parseFloat(paidAmountInput !== '' ? paidAmountInput : grandTotal.toString()) > 0 && <span className="text-indigo-400">*</span>}
              </label>
              <select
                required={parseFloat(paidAmountInput !== '' ? paidAmountInput : grandTotal.toString()) > 0}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full h-11 bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="" disabled>-- Select Payment Method --</option>
                {paymentMethods.filter(m => m.enabled).map(m => (
                  <option key={m.id} value={m.code}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Note</label>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="e.g. Paid in full via company account"
                className="w-full h-11 bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Conditional Payment Fields */}
          {(paymentMethod === 'card' || 
            (paymentMethod.toString().toLowerCase().includes('pos') && !paymentMethod.toString().toLowerCase().includes('terminal'))) && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Card Record Details</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardDetails.cardNumber}
                    onChange={(e) => updateCardDetail('cardNumber', e.target.value)}
                    placeholder="•••• •••• •••• ••••"
                    className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Card Holder Name</label>
                  <input
                    type="text"
                    value={cardDetails.cardHolderName}
                    onChange={(e) => updateCardDetail('cardHolderName', e.target.value)}
                    placeholder="Name on card"
                    className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Transaction Ref No.</label>
                  <input
                    type="text"
                    value={cardDetails.cardTransactionNo}
                    onChange={(e) => updateCardDetail('cardTransactionNo', e.target.value)}
                    placeholder="POS / Ref #"
                    className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 mb-3">
                <Building className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Bank Transfer Details</span>
              </div>
              <div className="max-w-md">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Bank Account Number / IBAN</label>
                <input
                  type="text"
                  value={extraPaymentDetails.bankAccountNo}
                  onChange={(e) => updateExtraDetail('bankAccountNo', e.target.value)}
                  placeholder="Enter Bank Account Number"
                  className="w-full bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'cheque' && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Cheque Details</span>
              </div>
              <div className="max-w-md">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Cheque Number</label>
                <input
                  type="text"
                  value={extraPaymentDetails.chequeNo}
                  onChange={(e) => updateExtraDetail('chequeNo', e.target.value)}
                  placeholder="Enter Cheque Number"
                  className="w-full bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {(['upi', 'qr', 'phonepay'].includes(paymentMethod) || 
            paymentMethod.toString().toLowerCase().includes('terminal') ||
            (!['cash', 'card', 'bank_transfer', 'cheque', 'credit'].includes(paymentMethod) && 
             !paymentMethod.toString().toLowerCase().includes('pos'))) && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Digital / UPI Reference Details</span>
              </div>
              <div className="max-w-md">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Transaction Ref / UTR Number</label>
                <input
                  type="text"
                  value={extraPaymentDetails.transactionNo}
                  onChange={(e) => updateExtraDetail('transactionNo', e.target.value)}
                  placeholder="Enter UPI / Transaction Reference Number"
                  className="w-full bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('purchases')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition uppercase tracking-wider cursor-pointer"
            >
              {isViewMode ? 'Exit Audit' : 'Discard'}
            </button>

            {!isViewMode && (
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-wider text-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditMode ? 'Update Purchase' : 'Save Purchase Order'}</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Full Product Creation Modal */}
      {showFullProductModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] shadow-2xl overflow-hidden relative flex flex-col">
            <div className="absolute top-6 right-6 z-[110]">
              <button 
                onClick={() => setShowFullProductModal(false)}
                className="p-3 bg-slate-800 hover:bg-rose-500 text-slate-400 hover:text-white rounded-2xl transition-all border border-slate-700 shadow-xl cursor-pointer"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
              <ProductFormPage 
                isModal={true}
                onBack={() => setShowFullProductModal(false)}
                onSaved={(newProd) => {
                  addProductToItems(newProd);
                  setShowFullProductModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden relative flex flex-col">
            <div className="absolute top-6 right-6 z-[110]">
              <button 
                onClick={() => setShowAddSupplierModal(false)}
                className="p-3 bg-slate-800 hover:bg-rose-500 text-slate-400 hover:text-white rounded-2xl transition-all border border-slate-700 shadow-xl cursor-pointer"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
              <ContactFormPage 
                isModal={true}
                initialType="supplier"
                onBack={() => setShowAddSupplierModal(false)}
                onSaved={(newSupp) => {
                  if (newSupp && newSupp.id) {
                    setSupplierId(newSupp.id);
                  }
                  setShowAddSupplierModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
