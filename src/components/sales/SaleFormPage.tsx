import React, { useState, useMemo, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { TransactionItem, TransactionStatus, PaymentMethod, Product, Customer } from '../../types/erp';
import { isTransactionEditable, formatCurrency, applyAmountRounding, validateEmail } from '../../utils/formatters';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import {
  Receipt,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Boxes,
  Clock,
  User,
  Building,
  CreditCard,
  Search,
  Calculator,
  Percent,
  Info,
  X,
  Truck,
  AlertTriangle,
  FileText,
  DollarSign,
  ShieldCheck,
  Calendar,
  Banknote,
  Landmark,
  Save,
  Printer,
  ChevronDown,
  ChevronRight,
  Layers,
  Users,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { ProductFormPage } from '../inventory/ProductFormPage';
import { SearchableDropdown } from '../common/SearchableDropdown';

interface SaleFormPageProps {
  onOpenReceiptModal?: (sale: any) => void;
  initialStatus?: TransactionStatus;
}

export const SaleFormPage: React.FC<SaleFormPageProps> = ({ onOpenReceiptModal, initialStatus }) => {
  const {
    customers,
    customerGroups,
    getCustomerGroupPrice,
    addCustomer,
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
    taxRates,
    taxGroups,
    accounts,
    cashRegister,
    users,
    currentUser,
    salesCommissionAgents,
    paymentMethods,
  } = useErp();

  const isEditMode = !!editingSale;
  const isViewMode = !!viewingSale;
  const saleToUse = editingSale || viewingSale;

  // Sales Representative State
  const [commissionAgentId, setCommissionAgentId] = useState<string>(() => {
    if (saleToUse?.commissionAgentId) return saleToUse.commissionAgentId;
    if (settings.salesCommissionAgent === 'logged_in_user') {
      return currentUser?.id || 'usr_sarah';
    }
    return '';
  });

  // Header State
  const [locationId, setLocationId] = useState(saleToUse?.locationId || selectedLocationId);
  const [customerId, setCustomerId] = useState(saleToUse?.customerId || '');
  const [invoiceNo, setInvoiceNo] = useState(saleToUse?.invoiceNo || '');
  
  const generateInvoiceNo = () => {
    const year = new Date().getFullYear();
    const num = Math.floor(10000 + Math.random() * 90000);
    const resolvedStatus = status || 'final';
    if (resolvedStatus === 'quotation') return `Q-${year}-${num}`;
    if (resolvedStatus === 'draft') return `DRF-${year}-${num}`;
    return `INV-${year}-${num}`;
  };
  const [transactionDate, setTransactionDate] = useState(
    saleToUse?.date || new Date().toISOString().replace('T', ' ').slice(0, 16)
  );
  const [status, setStatus] = useState<TransactionStatus>(saleToUse?.status || initialStatus || 'final');

  useEffect(() => {
    if (!saleToUse) {
      if (status === 'quotation' && !invoiceNo.startsWith('Q-')) {
        setInvoiceNo(invoiceNo.replace(/^(INV|DRF)-/, 'Q-'));
      } else if (status === 'draft' && !invoiceNo.startsWith('DRF-')) {
        setInvoiceNo(invoiceNo.replace(/^(INV|Q)-/, 'DRF-'));
      } else if (status !== 'quotation' && status !== 'draft' && !invoiceNo.startsWith('INV-')) {
        setInvoiceNo(invoiceNo.replace(/^(Q|DRF)-/, 'INV-'));
      }
    }
  }, [status, invoiceNo, saleToUse]);
  const [invoiceLayout, setInvoiceLayout] = useState(settings.defaultInvoiceLayout || 'classic');

  // Customer quick add modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCreditLimit, setNewCustCreditLimit] = useState('5000');

  // Product Search State
  const [productSearch, setProductSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showFullProductModal, setShowFullProductModal] = useState(false);
  const [lotSelectionProduct, setLotSelectionProduct] = useState<Product | null>(null);

  // Items State
  const [items, setItems] = useState<TransactionItem[]>(() => {
    if (saleToUse?.items && saleToUse.items.length > 0) {
      return saleToUse.items;
    }
    return [];
  });

  // Discounts, Taxes & Shipping
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>(() => {
    if (saleToUse?.discountType) return saleToUse.discountType as any;
    if (settings.defaultSaleDiscount !== undefined && settings.defaultSaleDiscount > 0) return 'percentage';
    return 'fixed';
  });
  const [discountValue, setDiscountValue] = useState<string>(() => {
    if (saleToUse?.discountAmount !== undefined) return saleToUse.discountAmount.toString();
    if (settings.defaultSaleDiscount !== undefined && settings.defaultSaleDiscount > 0) {
      return settings.defaultSaleDiscount.toString();
    }
    return '0';
  });

  useEffect(() => {
    // Find Walk-in customer
    const walkInCustomer = customers.find(c => c.name.toLowerCase().includes('walk-in'));
    if (!saleToUse && walkInCustomer) {
      setCustomerId(walkInCustomer.id);
    }
    
    // Restore discount logic
    if (!saleToUse && settings.defaultSaleDiscount !== undefined && settings.defaultSaleDiscount > 0) {
      setDiscountType('percentage');
      setDiscountValue(settings.defaultSaleDiscount.toString());
    }
  }, [customers, saleToUse, settings.defaultSaleDiscount]);
  const [orderTaxRate, setOrderTaxRate] = useState(
    saleToUse?.orderTaxRate?.toString() || '0'
  );
  const [shippingCharges, setShippingCharges] = useState(
    saleToUse?.shippingCharges?.toString() || '0'
  );
  const [shippingDetails, setShippingDetails] = useState(
    saleToUse?.shippingDetails || ''
  );
  const [shippingAddress, setShippingAddress] = useState(
    saleToUse?.shippingAddress || ''
  );
  const [shippingStatus, setShippingStatus] = useState<'ordered' | 'packed' | 'shipped' | 'delivered' | 'cancelled'>(
    saleToUse?.shippingStatus || 'ordered'
  );
  const [deliveredTo, setDeliveredTo] = useState(saleToUse?.deliveredTo || '');
  const [notes, setNotes] = useState(saleToUse?.notes || '');

  // Payment State
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    saleToUse?.paymentEntries?.[0]?.method || 'cash'
  );
  const [paymentAccountId, setPaymentAccountId] = useState(
    accounts[0]?.id || ''
  );
  const [paymentNote, setPaymentNote] = useState('');
  
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

  // Selected Customer details
  const currentCustomer = useMemo(() => {
    return customers.find(c => c.id === customerId) || customers[0];
  }, [customers, customerId]);

  // Filtered Products for Search Dropdown (Safely handles missing or non-string fields)
  const filteredProducts = useMemo(() => {
    if (!productSearch || !productSearch.trim()) return [];
    const query = productSearch.toLowerCase().trim();
    if (!products || !Array.isArray(products)) return [];

    return products
      .filter((p) => {
        if (!p) return false;
        const name = String(p.name || '').toLowerCase();
        const sku = String(p.sku || '').toLowerCase();
        const category = String(p.category || '').toLowerCase();
        const brand = String(p.brand || '').toLowerCase();
        const barcode = String(p.barcode || '').toLowerCase();

        return (
          name.includes(query) ||
          sku.includes(query) ||
          category.includes(query) ||
          brand.includes(query) ||
          barcode.includes(query)
        );
      })
      .slice(0, 12);
  }, [productSearch, products]);

  const isTaxEnabled = settings.enableTax && settings.taxSystem !== 'disabled';
  const showInlineTax = settings.enableTax && settings.taxSystem !== 'disabled' && (settings.enableInlineTax ?? true);

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

  // Add Product to Items table
  const addProductToItems = (prod: Product, selectedLotId?: string) => {
    if (!prod) return;
    const locStock = prod.locationStocks?.[locationId] ?? prod.currentStock ?? 0;

    if (!settings.allowOverselling && locStock <= 0) {
      showFlashNotification(`${prod.name} is Out of Stock (${locStock} available).`, 'error');
      return;
    }

    if (prod.lots && prod.lots.length > 1 && !selectedLotId) {
      setLotSelectionProduct(prod);
      setProductSearch('');
      setShowSearchResults(false);
      return;
    }

    const selectedLot = selectedLotId && prod.lots ? prod.lots.find((l) => l.id === selectedLotId) : null;
    const additionMethod = settings.salesItemAdditionMethod || 'add_to_existing_qty';
    const existingIdx = additionMethod === 'add_to_existing_qty'
      ? items.findIndex((item) => item.productId === prod.id && (!selectedLotId || item.lotId === selectedLotId))
      : -1;

    if (existingIdx >= 0) {
      handleQtyChange(existingIdx, items[existingIdx].quantity + 1);
    } else {
      const selectedCust = customers.find((c) => c.id === customerId);
      const basePrice = selectedLot ? Number(selectedLot.sellingPrice) : (Number(prod.sellingPrice) || 0);
      const unitPrice = getCustomerGroupPrice(basePrice, selectedCust);
      // Default tax selection is "None" (0%) as requested
      const taxRate = 0;
      const taxAmt = 0;
      const lineTotal = unitPrice;

      const newItem: TransactionItem = {
        productId: prod.id,
        productName: prod.name || 'Unnamed Product',
        sku: prod.sku || 'N/A',
        unit: prod.unit || 'Pc',
        quantity: 1,
        unitPrice: unitPrice,
        costPrice: selectedLot ? (Number(selectedLot.costPrice) || 0) : (Number(prod.costPrice) || 0),
        taxRate: taxRate,
        taxAmount: taxAmt,
        discount: 0,
        total: lineTotal,
        hsnCode: prod.hsnCode || '',
        taxGroupId: prod.taxGroupId,
        warrantyId: prod.warrantyId,
        lotId: selectedLot?.id,
        lotNumber: selectedLot?.lotNumber,
      };
      setItems((prev) => [...prev, newItem]);
    }
    setProductSearch('');
    setShowSearchResults(false);
  };

  // Recalculate item unit prices when customer changes in Sale Form
  useEffect(() => {
    if (items.length === 0 || isEditMode || isViewMode) return;
    const selectedCust = customers.find((c) => c.id === customerId);
    setItems((prevItems) =>
      prevItems.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return item;
        const lot = item.lotId && prod.lots ? prod.lots.find((l) => l.id === item.lotId) : null;
        const basePrice = lot ? Number(lot.sellingPrice) : (Number(prod.sellingPrice) || 0);
        const targetPrice = getCustomerGroupPrice(basePrice, selectedCust);
        if (targetPrice === item.unitPrice) return item;
        return {
          ...item,
          unitPrice: targetPrice,
          total: Math.max(0, (item.quantity * targetPrice) - (item.discount || 0)),
        };
      })
    );
  }, [customerId, customerGroups, customers, products]);

  const handleQtyChange = (index: number, newQty: number) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const validQty = Math.max(1, newQty);
      const lineSubtotal = (validQty * item.unitPrice) - (item.discount || 0);
      return {
        ...item,
        quantity: validQty,
        total: Math.max(0, lineSubtotal)
      };
    }));
  };

  const handlePriceChange = (index: number, newPrice: number) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const prod = products.find(p => p.id === item.productId);
      const minFloorPrice = prod ? (prod.minSellingPrice ?? prod.sellingPrice) : 0;
      const isMinPriceEnabled = settings.salesPriceIsMinPrice ?? true;

      let validPrice = Math.max(0, newPrice);
      if (isMinPriceEnabled && minFloorPrice > 0 && validPrice < minFloorPrice) {
        showFlashNotification(
          `Sales price cannot be set below minimum price of ${settings.currencySymbol || '$'}${minFloorPrice.toFixed(2)}`,
          'error'
        );
        validPrice = minFloorPrice;
      }
      const lineSubtotal = (item.quantity * validPrice) - (item.discount || 0);
      return {
        ...item,
        unitPrice: validPrice,
        total: Math.max(0, lineSubtotal)
      };
    }));
  };

  const handleLineDiscountChange = (index: number, discountAmt: number) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const validDisc = Math.max(0, discountAmt);
      const lineSubtotal = (item.quantity * item.unitPrice) - validDisc;
      return {
        ...item,
        discount: validDisc,
        total: Math.max(0, lineSubtotal)
      };
    }));
  };

  const handleTaxRateChange = (index: number, rate: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const validRate = Math.max(0, rate);
        const taxAmt = (item.unitPrice * validRate) / 100;
        return {
          ...item,
          taxRate: validRate,
          taxAmount: taxAmt,
        };
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotalItems = useMemo(() => {
    return items.reduce((acc, item) => acc + item.total, 0);
  }, [items]);

  const discountAmountCalculated = useMemo(() => {
    const rawDisc = parseFloat(discountValue) || 0;
    if (discountType === 'percentage') {
      return (subtotalItems * Math.min(100, rawDisc)) / 100;
    }
    return Math.min(subtotalItems, rawDisc);
  }, [subtotalItems, discountType, discountValue]);

  const taxableAmount = Math.max(0, subtotalItems - discountAmountCalculated);

  const orderTaxAmount = useMemo(() => {
    if (!isTaxEnabled) return 0;
    const rate = parseFloat(orderTaxRate) || 0;
    return (taxableAmount * rate) / 100;
  }, [taxableAmount, orderTaxRate, isTaxEnabled]);

  const shippingCostAmount = parseFloat(shippingCharges) || 0;

  const additionalExpensesAmount = useMemo(() => {
    return additionalExpenses.reduce((acc, exp) => acc + (parseFloat(exp.amount) || 0), 0);
  }, [additionalExpenses]);

  const grandTotal = useMemo(() => {
    const rawTotal = Math.max(0, taxableAmount + orderTaxAmount + shippingCostAmount + additionalExpensesAmount);
    return applyAmountRounding(rawTotal, settings.amountRoundingMethod);
  }, [taxableAmount, orderTaxAmount, shippingCostAmount, additionalExpensesAmount, settings.amountRoundingMethod]);

  // Keep paid amount in sync with grand total if not manually edited or if viewing
  useEffect(() => {
    if (!isEditMode && !paidAmountInput && grandTotal > 0) {
      setPaidAmountInput(grandTotal.toFixed(2));
    }
  }, [grandTotal, isEditMode, paidAmountInput]);

  const effectivePaidAmount = isViewMode 
    ? (saleToUse?.paidAmount || 0)
    : (paidAmountInput === '' ? grandTotal : Math.max(0, parseFloat(paidAmountInput) || 0));

  const changeReturnAmount = Math.max(0, effectivePaidAmount - grandTotal);
  const dueAmount = Math.max(0, grandTotal - effectivePaidAmount);

  // Commission metadata & calculations
  const isCommissionEnabled = settings.salesCommissionAgent && settings.salesCommissionAgent !== 'disable';
  const commissionMode = settings.salesCommissionAgent || 'disable';

  const selectedAgentInfo = useMemo(() => {
    if (commissionMode === 'logged_in_user') {
      return {
        id: currentUser?.id || 'usr_sarah',
        name: currentUser?.name || 'Admin Sarah',
        role: currentUser?.role || 'admin',
        rate: currentUser?.commissionPercentage ?? 5.0,
      };
    }
    if (commissionMode === 'user') {
      const u = users.find((usr) => usr.id === commissionAgentId);
      if (u) {
        return {
          id: u.id,
          name: u.name,
          role: u.role,
          rate: u.commissionPercentage ?? 0,
        };
      }
    }
    if (commissionMode === 'commission_agent') {
      const a = salesCommissionAgents.find((agent) => agent.id === commissionAgentId);
      if (a) {
        return {
          id: a.id,
          name: `${a.firstName} ${a.lastName}`.trim(),
          role: 'Sales Commission Agent',
          rate: a.commissionPercentage ?? 0,
        };
      }
    }
    return null;
  }, [commissionMode, commissionAgentId, currentUser, users, salesCommissionAgents]);

  const commissionRate = selectedAgentInfo?.rate || 0;

  const commissionCalculationMode = settings.commissionCalculationType || (settings.commissionAgentMethod === 'payment' ? 'payment_received' : 'invoice_value');

  const calculatedCommission = useMemo(() => {
    if (!isCommissionEnabled || !selectedAgentInfo || commissionRate <= 0) {
      return 0;
    }
    const baseVal = commissionCalculationMode === 'payment_received' 
      ? Math.min(grandTotal, effectivePaidAmount) 
      : grandTotal;
    return (baseVal * commissionRate) / 100;
  }, [isCommissionEnabled, selectedAgentInfo, commissionRate, commissionCalculationMode, grandTotal, effectivePaidAmount]);

  // Quick Customer Creation Handler
  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      showFlashNotification('Customer name is required', 'error');
      return;
    }

    if (newCustPhone.trim()) {
      const phoneVal = validatePhoneNumber(newCustPhone);
      if (!phoneVal.isValid) {
        showFlashNotification(`Phone Error: ${phoneVal.error}`, 'error');
        return;
      }
    }

    if (newCustEmail.trim() && newCustEmail.trim().toUpperCase() !== 'N/A') {
      if (!validateEmail(newCustEmail)) {
        showFlashNotification('Please enter a valid email address with a proper domain (e.g. name@mail.com).', 'error');
        return;
      }
    }
    const created = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim() || 'N/A',
      email: newCustEmail.trim() || `${newCustName.toLowerCase().replace(/\s+/g, '')}@client.com`,
      address: newCustAddress.trim() || 'City Center',
      creditLimit: parseFloat(newCustCreditLimit) || 5000,
      customerGroup: 'Standard Retail',
      priceTier: 'retail'
    });
    setCustomerId(created.id);
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewCustAddress('');
    showFlashNotification(`Customer ${created.name} added successfully!`, 'success');
  };

  // Form Submission
  const handleSaveSale = (targetStatus: TransactionStatus = 'final') => {
    if (items.length === 0) {
      showFlashNotification('Please add at least one product line to create a sale invoice', 'error');
      return;
    }

    if (!customerId) {
      showFlashNotification('Please select a customer for this invoice', 'error');
      return;
    }

    // Validation: Check stock levels if creating a final sale
    if (targetStatus === 'final') {
      for (const item of items) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          const availableStock = prod.locationStocks?.[locationId] ?? prod.currentStock;
          if (availableStock < item.quantity) {
            showFlashNotification(
              `Insufficient stock for "${prod.name}" at this location. Available: ${availableStock}, Requested: ${item.quantity}`,
              'error'
            );
            return;
          }
        }
      }
    }

    const isDraftOrQuotation = targetStatus === 'draft' || targetStatus === 'quotation';
    const finalPaidAmount = isDraftOrQuotation ? 0 : Math.min(grandTotal, effectivePaidAmount);

    const payload = {
      invoiceNo: invoiceNo || generateInvoiceNo(),
      locationId,
      customerId,
      date: transactionDate,
      items,
      subtotal: subtotalItems,
      taxAmount: orderTaxAmount,
      orderTaxRate: parseFloat(orderTaxRate) || 0,
      discountAmount: discountAmountCalculated,
      discountType,
      shippingCharges: shippingCostAmount,
      shippingDetails,
      shippingAddress,
      shippingStatus,
      deliveredTo,
      totalAmount: grandTotal,
      paidAmount: finalPaidAmount,
      paymentMethod: isDraftOrQuotation ? 'credit' : paymentMethod,
      paymentEntries: isDraftOrQuotation ? [] : [
        {
          id: `pay_${Date.now()}`,
          method: paymentMethod,
          amount: finalPaidAmount,
          date: transactionDate,
          note: paymentNote
        }
      ],
      cardDetails: !isDraftOrQuotation && (paymentMethod === 'card' || 
        paymentMethod.toString().toLowerCase().includes('terminal') || 
        paymentMethod.toString().toLowerCase().includes('pos')) ? cardDetails : undefined,
      extraPaymentDetails: !isDraftOrQuotation && ((['bank_transfer', 'cheque', 'upi', 'qr', 'phonepay'].includes(paymentMethod) || 
        paymentMethod.toString().toLowerCase().includes('terminal') || 
        paymentMethod.toString().toLowerCase().includes('pos') ||
        paymentMethod.toString().toLowerCase().includes('card'))) ? extraPaymentDetails : undefined,
      additionalExpenses: additionalExpenses.filter(e => e.name && parseFloat(e.amount) > 0).map(e => ({ name: e.name, amount: parseFloat(e.amount) })),
      notes,
      status: targetStatus,
      commissionAgentId: selectedAgentInfo ? selectedAgentInfo.id : undefined,
      commissionAgentType: isCommissionEnabled ? (commissionMode as any) : undefined,
      commissionAgentName: selectedAgentInfo ? selectedAgentInfo.name : undefined,
      commissionPercentage: selectedAgentInfo ? commissionRate : undefined,
      commissionAmount: isCommissionEnabled && selectedAgentInfo ? calculatedCommission : undefined,
      isPos: false,
      saleChannel: 'standard',
    };

    const navigateToTab = (status: TransactionStatus) => {
      if (status === 'quotation') setActiveTab('list_quotations');
      else if (status === 'draft') setActiveTab('list_drafts');
      else setActiveTab('sales');
    };

    if (isEditMode && saleToUse?.id) {
      const editCheck = isTransactionEditable(saleToUse.date, settings.transactionEditDays);
      if (!editCheck.canEdit) {
        showFlashNotification(editCheck.reason || 'Transaction cannot be edited', 'error');
        return;
      }
      updateSale(saleToUse.id, payload);
      showFlashNotification(`Sale invoice ${invoiceNo} updated successfully`, 'success');
      navigateToTab(targetStatus);
    } else {
      try {
        const createdSale = createSale(payload as any);
        showFlashNotification(`Sale invoice ${invoiceNo} created successfully!`, 'success');
        navigateToTab(targetStatus);
      } catch (err) {
        // Error handled in context flash notification
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 pb-24 overflow-x-hidden">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('sales')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">All Sales</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-400" />
              <span>
                {isViewMode
                  ? `View Sale Invoice #${invoiceNo}`
                  : isEditMode
                  ? `Edit Sale #${invoiceNo}`
                  : 'Add Sale'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Standard finias POS sales entry with customer ledger, location stock validation, discounts, taxes & payment settlement.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isViewMode && (
            <>
              <button
                type="button"
                id="sale-save-draft-btn"
                onClick={() => handleSaveSale('draft')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                id="sale-save-quotation-btn"
                onClick={() => handleSaveSale('quotation' as any)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Quotation</span>
              </button>

              <button
                type="button"
                id="sale-submit-final-btn"
                onClick={() => handleSaveSale('final')}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950 flex items-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditMode ? 'Update Invoice' : 'Finalize & Save'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* SECTION 1: Master Header Information (Location, Customer, Invoice, Date, Status) */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-sm relative z-20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-400" />
            <span>Sale Information & Customer Ledger</span>
          </h2>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 1 of 3</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Business Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Business Location *</span>
            </label>
            <select
              value={locationId}
              disabled={isViewMode}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.city ? `(${loc.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Selection with Quick Add */}
          <div className="relative z-30">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Customer *</label>
                {!isViewMode && (
                 <div className="flex gap-2">
                   <button
                     type="button"
                     onClick={() => setShowAddCustomerModal(true)}
                     className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                   >
                     <Plus className="w-3 h-3" />
                     <span>+ Add Customer</span>
                   </button>
                 </div>
               )}
              </div>
            <SearchableDropdown
              options={customers.map(c => ({ id: c.id, name: c.name, phone: c.phone }))}
              value={customerId}
              onChange={(value) => setCustomerId(value)}
              disabled={isViewMode}
              placeholder="-- Select Customer --"
            />
            {/* Customer due & credit snapshot */}
            {currentCustomer && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
                <span>Credit: {formatCurrency(currentCustomer.creditLimit || 5000, settings)}</span>
                <span className={currentCustomer.totalDue > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                  Due: {formatCurrency((currentCustomer.totalDue || 0), settings)}
                </span>
              </div>
            )}
          </div>

          {/* Invoice Scheme / Number */}
          {status === 'quotation' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quotation Number</label>
              <input
                type="text"
                value={invoiceNo}
                disabled={isViewMode}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. Q-2026-10023"
                className="w-full bg-slate-950 font-mono text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          ) : status === 'draft' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Draft Number</label>
              <input
                type="text"
                value={invoiceNo}
                disabled={isViewMode}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. DRF-2026-10023"
                className="w-full bg-slate-950 font-mono text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Invoice / Reference No.</label>
              <input
                type="text"
                value={invoiceNo}
                disabled={isViewMode}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. INV-2026-10023"
                className="w-full bg-slate-950 font-mono text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Transaction Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Transaction Date *</label>
            <input
              type="datetime-local"
              value={transactionDate.replace(' ', 'T').slice(0, 16)}
              disabled={isViewMode}
              onChange={(e) => setTransactionDate(e.target.value.replace('T', ' '))}
              className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status *</label>
            <select
              value={status}
              disabled={isViewMode}
              onChange={(e) => setStatus(e.target.value as TransactionStatus)}
              className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Select Status --</option>
              <option value="final">Final (Deducts Stock)</option>
              <option value="draft">Draft (No Stock Change)</option>
              <option value="quotation">Quotation / Estimate</option>
              <option value="ordered">Ordered</option>
            </select>
          </div>

          {/* Invoice Layout Preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Invoice Print Layout</label>
            <select
              value={invoiceLayout}
              disabled={isViewMode}
              onChange={(e) => setInvoiceLayout(e.target.value as any)}
              className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Select Layout --</option>
              <option value="classic">Classic Standard Layout</option>
              <option value="elegant">Elegant Corporate (With Header Banner)</option>
              <option value="detailed">Detailed B2B (With HSN & Warranty)</option>
              <option value="columnize_taxes">Columnized GST / Tax Breakdown</option>
              <option value="pos_thermal">POS Thermal 80mm Slip</option>
              <option value="slim2">Slim Gift / Quick Receipt</option>
            </select>
          </div>

          {/* Sales Representative / Commission Agent Section */}
          {isCommissionEnabled && (
            <div className="md:col-span-2 lg:col-span-2 bg-slate-950/80 p-3.5 rounded-xl border border-indigo-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sales Representative</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                  {commissionMode === 'logged_in_user' && 'Logged in User'}
                  {commissionMode === 'user' && 'Business User'}
                  {commissionMode === 'commission_agent' && 'Commission Agent'}
                </span>
              </div>

              {commissionMode === 'logged_in_user' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
                      {(currentUser?.name || 'A')[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{currentUser?.name || 'Admin Sarah'}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 capitalize">
                          {currentUser?.role || 'Admin'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Auto-assigned to logged in user ({commissionRate}% commission)
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase">Est. Commission</div>
                    <div className="text-xs font-bold font-mono text-emerald-400">
                      {formatCurrency(calculatedCommission, settings)}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        ({commissionCalculationMode === 'payment_received' ? 'on payment' : 'on invoice'})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {commissionMode === 'user' && (
                <div className="space-y-1.5">
                  <select
                    value={commissionAgentId}
                    disabled={isViewMode}
                    onChange={(e) => setCommissionAgentId(e.target.value)}
                    className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select Sales Representative (From Users) --</option>
                    {users.map((usr) => (
                      <option key={usr.id} value={usr.id}>
                        {usr.name} ({usr.role.replace('_', ' ')} - {usr.commissionPercentage ?? 0}% commission)
                      </option>
                    ))}
                  </select>

                  {selectedAgentInfo && (
                    <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                      <span>Rate: <strong className="text-indigo-300 font-mono">{commissionRate}%</strong></span>
                      <span className="text-emerald-400 font-mono font-bold">
                        Payable Commission: {formatCurrency(calculatedCommission, settings)}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({commissionCalculationMode === 'payment_received' ? 'on payment' : 'on invoice'})
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {commissionMode === 'commission_agent' && (
                <div className="space-y-1.5">
                  <select
                    value={commissionAgentId}
                    disabled={isViewMode}
                    onChange={(e) => setCommissionAgentId(e.target.value)}
                    className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select Sales Commission Agent --</option>
                    {salesCommissionAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.firstName} {agent.lastName} ({agent.commissionPercentage}% commission)
                      </option>
                    ))}
                  </select>

                  {selectedAgentInfo && (
                    <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                      <span>Rate: <strong className="text-indigo-300 font-mono">{commissionRate}%</strong></span>
                      <span className="text-emerald-400 font-mono font-bold">
                        Payable Commission: {formatCurrency(calculatedCommission, settings)}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({commissionCalculationMode === 'payment_received' ? 'on payment' : 'on invoice'})
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Product Search & Line Items Matrix */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-400" />
              <span>Search Products & Line Items</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Type product name, barcode, or SKU to add items to invoice.
            </p>
          </div>

          {!isViewMode && (
            <button
              type="button"
              onClick={() => setShowFullProductModal(true)}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New Product</span>
            </button>
          )}
        </div>

        {/* Product Search Bar */}
        {!isViewMode && (
          <div className="relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onFocus={() => setShowSearchResults(true)}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowSearchResults(true);
                }}
                placeholder="Search by product name, SKU, or scan barcode..."
                className="w-full bg-slate-950 text-white text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Search Dropdown Results */}
            {showSearchResults && productSearch.trim() && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                <div className="p-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-900/90 border-b border-slate-800 flex justify-between items-center">
                  <span>
                    {filteredProducts.length > 0
                      ? `Matching Inventory Products (${filteredProducts.length})`
                      : 'No Matching Products'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSearchResults(false)}
                    className="p-1 text-slate-400 hover:text-white rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {filteredProducts.length > 0 ? (
                  filteredProducts.map((prod) => {
                    const locStock = prod.locationStocks?.[locationId] ?? prod.currentStock ?? 0;
                    const isOutOfStock = locStock <= 0;
                    const sellPrice = Number(prod.sellingPrice) || 0;
                    const initialChar = prod.name ? prod.name.charAt(0).toUpperCase() : 'P';
                    const alertQty = prod.alertQuantity ?? 5;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => addProductToItems(prod)}
                        className="p-3 hover:bg-slate-900 border-b border-slate-900/60 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                            {initialChar}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition truncate">
                              {prod.name || 'Unnamed Product'}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                              <span className="font-mono text-slate-500">SKU: {prod.sku || 'N/A'}</span>
                              <span>•</span>
                              <span className="capitalize">{prod.category || 'General'}</span>
                              {prod.unit && <span>({prod.unit})</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <div className="text-xs font-mono font-bold text-emerald-400">
                            {formatCurrency(sellPrice, settings)}
                          </div>
                          <div className="mt-0.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isOutOfStock
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : locStock <= alertQty
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              Stock: {locStock} {prod.unit || 'Pc'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    <p>No products found matching "{productSearch}"</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSearchResults(false);
                        setShowFullProductModal(true);
                      }}
                      className="mt-2 text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create new product "{productSearch}"</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Line Items Table */}
        <div className="overflow-x-auto scrollbar-thin touch-pan-x rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3 px-3 w-10">#</th>
                <th className="py-3 px-3 min-w-[200px]">Product & SKU</th>
                <th className="py-3 px-3 text-center min-w-[120px]">Quantity</th>
                <th className="py-3 px-3 text-right min-w-[120px]">Unit Price ({settings.currencySymbol})</th>
                <th className="py-3 px-3 text-right min-w-[110px]">Discount</th>
                {showInlineTax && <th className="py-3 px-3 text-center min-w-[140px]">Tax Rate / GST</th>}
                <th className="py-3 px-3 text-right min-w-[120px]">Subtotal</th>
                {!isViewMode && <th className="py-3 px-3 text-center w-12">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={isViewMode ? (showInlineTax ? 7 : 6) : (showInlineTax ? 8 : 7)} className="py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Boxes className="w-8 h-8 text-slate-600" />
                      <span>No products added yet. Use the search bar above to add items.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const prod = products.find(p => p.id === item.productId);
                  const availableLocStock = prod ? (prod.locationStocks?.[locationId] ?? prod.currentStock) : 999;
                  const isExceedingStock = availableLocStock < item.quantity;

                  return (
                    <tr key={`${item.productId}-${idx}`} className="hover:bg-slate-950/40 transition">
                      <td className="py-3 px-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{item.productName}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono text-slate-500">SKU: {item.sku}</span>
                          {item.lotNumber && (
                            <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              Lot: {item.lotNumber}
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isExceedingStock
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            Avail: {availableLocStock} {item.unit}
                          </span>
                        </div>
                        {isExceedingStock && (
                          <div className="text-[10px] text-rose-400 flex items-center gap-1 mt-1 font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Warning: Quantity exceeds current location stock</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isViewMode ? (
                          <span className="font-mono font-bold text-white">
                            {item.quantity} {item.unit}
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, item.quantity - 1)}
                              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center font-bold text-sm"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                              className="w-14 bg-slate-950 text-center font-mono font-bold text-white text-xs py-1 px-1 rounded-lg border border-slate-700 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, item.quantity + 1)}
                              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center font-bold text-sm"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isViewMode ? (
                          <span className="font-mono font-bold text-white">
                            {formatCurrency(item.unitPrice, settings)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-24 bg-slate-950 text-right font-mono font-bold text-white text-xs py-1 px-2 rounded-lg border border-slate-700 focus:outline-none"
                          />
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isViewMode ? (
                          <span className="font-mono text-slate-300">
                            {formatCurrency((item.discount || 0), settings)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            value={item.discount || 0}
                            onChange={(e) => handleLineDiscountChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-slate-950 text-right font-mono text-white text-xs py-1 px-2 rounded-lg border border-slate-700 focus:outline-none"
                          />
                        )}
                      </td>
                      {showInlineTax && (
                        <td className="py-3 px-3 text-center">
                          {isViewMode ? (
                            <span className="font-mono text-xs text-slate-300">
                              {item.taxRate && item.taxRate > 0 ? `${item.taxRate}%` : 'None (0%)'}
                            </span>
                          ) : (
                            <select
                              id={`sale-item-tax-${idx}`}
                              value={item.taxRate !== undefined && item.taxRate !== null ? item.taxRate : 0}
                              onChange={(e) => handleTaxRateChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-36 bg-slate-950 text-slate-200 font-mono text-xs py-1.5 px-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                            >
                              <option value="">Select GST</option>
                              <option value="0">None (0%)</option>
                              {gstOptions.map((opt) => (
                                <option key={`${opt.label}-${opt.value}`} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(item.total, settings)}
                      </td>
                      {!isViewMode && (
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                            title="Remove line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Discounts, Order Taxes, Shipping & Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discounts, Order Tax & Notes */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Percent className="w-4 h-4 text-amber-400" />
            <span>Discount, Order Taxes & Sale Notes</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Discount Type</label>
              <select
                value={discountType}
                disabled={isViewMode}
                onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
              >
                <option value="fixed">Fixed Amount ({settings.currencySymbol})</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Discount Value</label>
              <input
                type="number"
                step="0.01"
                value={discountValue}
                disabled={isViewMode}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 font-mono text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Order Tax (%) {!isTaxEnabled && <span className="text-[10px] text-amber-400 font-normal">(Tax Engine Disabled)</span>}
            </label>
            <div className="flex gap-2">
              <select
                value={isTaxEnabled ? orderTaxRate : '0'}
                disabled={isViewMode || !isTaxEnabled}
                onChange={(e) => setOrderTaxRate(e.target.value)}
                className={`w-full bg-slate-950 text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none ${
                  !isTaxEnabled ? 'text-slate-600 cursor-not-allowed opacity-60' : 'text-white'
                }`}
              >
                <option value="0">None (0%)</option>
                {taxRates.map(t => (
                  <option key={t.id} value={t.rate}>
                    {t.name} ({t.rate}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sale Notes / Invoice Terms</label>
            <textarea
              value={notes}
              disabled={isViewMode}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Thanks for your business. 30 days replacement on manufactured warranty."
              rows={3}
              className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Shipping & Logistics */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Truck className="w-4 h-4 text-sky-400" />
            <span>Shipping & Fulfillment Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Shipping Charges ({settings.currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                value={shippingCharges}
                disabled={isViewMode}
                onChange={(e) => setShippingCharges(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 font-mono text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Shipping Status</label>
              <select
                value={shippingStatus}
                disabled={isViewMode}
                onChange={(e) => setShippingStatus(e.target.value as any)}
                className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
              >
                <option value="ordered">Ordered</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Delivered To / Contact Person</label>
            <input
              type="text"
              value={deliveredTo}
              disabled={isViewMode}
              onChange={(e) => setDeliveredTo(e.target.value)}
              placeholder="e.g. John Doe (+1 555-0199)"
              className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Shipping Destination Address</label>
            <textarea
              value={shippingAddress}
              disabled={isViewMode}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="e.g. Warehouse Bay 4, 1200 Commerce Blvd..."
              rows={2}
              className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-700 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-8 border-t border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-white tracking-tight">ADDITIONAL EXPENSES</h3>
              <button
                type="button"
                onClick={addExpenseRow}
                disabled={isViewMode}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-[11px] font-black rounded-xl transition-all shadow-lg shadow-sky-900/20"
              >
                <Plus className="w-4 h-4" />
                Add additional expenses
              </button>
            </div>

            <div className="space-y-4">
              {additionalExpenses.length > 0 && (
                <>
                  <div className="flex gap-4 px-1">
                    <div className="flex-[3]">
                      <span className="text-sm font-bold text-slate-200">Additional expense name</span>
                    </div>
                    <div className="flex-[1] min-w-[200px]">
                      <span className="text-sm font-bold text-slate-200">Amount</span>
                    </div>
                    <div className="w-[44px]"></div>
                  </div>
                  
                  <div className="space-y-3">
                    {additionalExpenses.map((exp, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <div className="flex-[3]">
                          <input
                            type="text"
                            value={exp.name}
                            disabled={isViewMode}
                            onChange={(e) => updateExpenseRow(idx, 'name', e.target.value)}
                            placeholder=""
                            className="w-full bg-white text-slate-900 text-sm px-4 py-3 rounded border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all shadow-sm"
                          />
                        </div>
                        <div className="flex-[1] min-w-[200px]">
                          <input
                            type="number"
                            step="0.01"
                            value={exp.amount}
                            disabled={isViewMode}
                            onChange={(e) => updateExpenseRow(idx, 'amount', e.target.value)}
                            placeholder="0"
                            className="w-full bg-white font-mono text-slate-900 text-sm px-4 py-3 rounded border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all shadow-sm"
                          />
                        </div>
                        <div className="w-[44px] flex justify-center">
                          <button
                            type="button"
                            disabled={isViewMode}
                            onClick={() => removeExpenseRow(idx)}
                            className="text-slate-500 hover:text-red-500 transition-colors p-1"
                            title="Remove Row"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {additionalExpenses.length === 0 && !isViewMode && (
                <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-500 italic">Click the button above to add additional expenses</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Payment Settlement Section */}
      {status !== 'draft' && status !== 'quotation' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Payment Settlement (Add Payment)</span>
            </h2>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-slate-400">Total Payable:</span>
              <span className="text-emerald-400 font-extrabold text-sm">
                {formatCurrency(grandTotal, settings)}
              </span>
            </div>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Amount Received *</label>
            <input
              type="number"
              step="0.01"
              value={paidAmountInput}
              disabled={isViewMode}
              onChange={(e) => setPaidAmountInput(e.target.value)}
              placeholder={grandTotal.toFixed(2)}
              className="w-full bg-slate-950 font-mono font-bold text-emerald-400 text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Method *</label>
            <select
              value={paymentMethod}
              disabled={isViewMode}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
            >
              {paymentMethods.filter(m => m.enabled).map(m => (
                <option key={m.id} value={m.code}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Account</label>
            <select
              value={paymentAccountId}
              disabled={isViewMode}
              onChange={(e) => setPaymentAccountId(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Note</label>
            <input
              type="text"
              value={paymentNote}
              disabled={isViewMode}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="e.g. Reference / Transaction ID"
              className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
            />
          </div>
        </div>

        {/* Conditional Payment Fields */}
        {(paymentMethod === 'card' || 
          (paymentMethod.toString().toLowerCase().includes('pos') && !paymentMethod.toString().toLowerCase().includes('terminal'))) && (
          <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Card Record Details</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Card Number</label>
                <input
                  type="text"
                  value={cardDetails.cardNumber}
                  onChange={(e) => updateCardDetail('cardNumber', e.target.value)}
                  placeholder="Card Number"
                  className="w-full bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Card holder name</label>
                <input
                  type="text"
                  value={cardDetails.cardHolderName}
                  onChange={(e) => updateCardDetail('cardHolderName', e.target.value)}
                  placeholder="Card holder name"
                  className="w-full bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Card Transaction No.</label>
                <input
                  type="text"
                  value={cardDetails.cardTransactionNo}
                  onChange={(e) => updateCardDetail('cardTransactionNo', e.target.value)}
                  placeholder="Card Transaction No."
                  className="w-full bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Card Type</label>
                <select
                  value={cardDetails.cardType}
                  onChange={(e) => updateCardDetail('cardType', e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-all appearance-none"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="Amex">Amex</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Month</label>
                <input
                  type="text"
                  value={cardDetails.month}
                  onChange={(e) => updateCardDetail('month', e.target.value)}
                  placeholder="MM"
                  className="w-full bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Year</label>
                <input
                  type="text"
                  value={cardDetails.year}
                  onChange={(e) => updateCardDetail('year', e.target.value)}
                  placeholder="YYYY"
                  className="w-full bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Security Code</label>
                <input
                  type="text"
                  value={cardDetails.securityCode}
                  onChange={(e) => updateCardDetail('securityCode', e.target.value)}
                  placeholder="CVV"
                  className="w-full bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'bank_transfer' && (
          <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-3">
              <Building className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Bank Transfer Details</span>
            </div>
            <div className="max-w-md">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Bank Account No</label>
              <input
                type="text"
                value={extraPaymentDetails.bankAccountNo}
                onChange={(e) => updateExtraDetail('bankAccountNo', e.target.value)}
                placeholder="Enter Bank Account Number"
                className="w-full bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {paymentMethod === 'cheque' && (
          <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Cheque Details</span>
            </div>
            <div className="max-w-md">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Cheque No.</label>
              <input
                type="text"
                value={extraPaymentDetails.chequeNo}
                onChange={(e) => updateExtraDetail('chequeNo', e.target.value)}
                placeholder="Enter Cheque Number"
                className="w-full bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {(['upi', 'qr', 'phonepay'].includes(paymentMethod) || 
          paymentMethod.toString().toLowerCase().includes('terminal') ||
          (!['cash', 'card', 'bank_transfer', 'cheque', 'credit'].includes(paymentMethod) && 
           !paymentMethod.toString().toLowerCase().includes('pos'))) && (
          <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Digital Transaction Details</span>
            </div>
            <div className="max-w-md">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Transaction No</label>
              <input
                type="text"
                value={extraPaymentDetails.transactionNo}
                onChange={(e) => updateExtraDetail('transactionNo', e.target.value)}
                placeholder="Enter UPI / Transaction Reference Number"
                className="w-full bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Change Return / Due summary */}
        <div className="flex flex-wrap items-center justify-end gap-6 pt-3 border-t border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total Items:</span>
            <span className="font-bold text-white">{items.length} ({items.reduce((a, b) => a + b.quantity, 0)} Units)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total Paid:</span>
            <span className="font-bold text-emerald-400">
              {formatCurrency(effectivePaidAmount, settings)}
            </span>
          </div>
          {changeReturnAmount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Change Return:</span>
              <span className="font-bold text-sky-400">
                {formatCurrency(changeReturnAmount, settings)}
              </span>
            </div>
          )}
          {dueAmount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Outstanding Due:</span>
              <span className="font-bold text-rose-400">
                {formatCurrency(dueAmount, settings)}
              </span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* STICKY BOTTOM BAR: Final Calculations & Action Trigger */}
      <div className="sticky bottom-0 z-20 bg-slate-950/95 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400">Subtotal: </span>
            <span className="text-white font-bold">{formatCurrency(subtotalItems, settings)}</span>
          </div>
          {discountAmountCalculated > 0 && (
            <div>
              <span className="text-slate-400">Discount: </span>
              <span className="text-amber-400 font-bold">-{formatCurrency(discountAmountCalculated, settings)}</span>
            </div>
          )}
          {orderTaxAmount > 0 && (
            <div>
              <span className="text-slate-400">Tax: </span>
              <span className="text-sky-400 font-bold">+{formatCurrency(orderTaxAmount, settings)}</span>
            </div>
          )}
          {shippingCostAmount > 0 && (
            <div>
              <span className="text-slate-400">Shipping: </span>
              <span className="text-slate-200 font-bold">+{formatCurrency(shippingCostAmount, settings)}</span>
            </div>
          )}
          <div className="pl-2 border-l border-slate-700">
            <span className="text-slate-300 font-bold text-sm">Grand Total: </span>
            <span className="text-emerald-400 font-extrabold text-base">
              {formatCurrency(grandTotal, settings)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
          >
            Cancel
          </button>

          {!isViewMode && (
            <button
              type="button"
              id="sale-bottom-submit-btn"
              onClick={() => handleSaveSale(status)}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950 flex items-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditMode ? 'Update Sale Invoice' : 'Finalize & Save Invoice'}</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>Quick Add Customer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="City, State"
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Credit Limit ({formatCurrency(0, settings).replace('0.00', '').trim()})</label>
                <input
                  type="number"
                  value={newCustCreditLimit}
                  onChange={(e) => setNewCustCreditLimit(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PRODUCT CREATION MODAL */}
      {showFullProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-400" />
                <span>Create New Product</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFullProductModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProductFormPage
              isModal={true}
              onBack={() => setShowFullProductModal(false)}
              onSaved={(savedProduct) => {
                setShowFullProductModal(false);
                addProductToItems(savedProduct);
                showFlashNotification(`Product "${savedProduct.name}" added to sale invoice!`, 'success');
              }}
            />
          </div>
        </div>
      )}

      {/* LOT SELECTION MODAL */}
      {lotSelectionProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                  <Layers className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Select Price Lot</h3>
                  <p className="text-xs text-slate-400 font-medium">{lotSelectionProduct.name}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setLotSelectionProduct(null)}
                className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200 leading-relaxed">
                  This product has multiple price batches (Lots). Please select the correct batch to continue.
                </p>
              </div>

              <div className="space-y-3">
                {lotSelectionProduct.lots?.map((lot) => {
                  const isLotOutOfStock = lot.currentStock <= 0;
                  const isLotDisabled = isLotOutOfStock && !settings.allowOverselling;
                  return (
                    <button
                      key={lot.id}
                      type="button"
                      disabled={isLotDisabled}
                      onClick={() => {
                        addProductToItems(lotSelectionProduct, lot.id);
                        setLotSelectionProduct(null);
                        showFlashNotification(`Added Lot ${lot.lotNumber} at ${formatCurrency(lot.sellingPrice, settings)}`, 'success');
                      }}
                      className={`w-full flex items-center justify-between p-4 border rounded-2xl transition group relative overflow-hidden ${
                        isLotDisabled 
                          ? 'bg-slate-900/50 border-slate-800 cursor-not-allowed opacity-60' 
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-start text-left">
                          <span className={`text-xs font-bold ${isLotOutOfStock ? 'text-slate-500' : 'text-slate-100 group-hover:text-white'}`}>
                            Lot: {lot.lotNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                            <Clock className="w-3 h-3" />
                            Created: {lot.createdDate}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-black tracking-tight ${isLotOutOfStock ? 'text-slate-600' : 'text-emerald-400'}`}>
                            {formatCurrency(lot.sellingPrice, settings)}
                          </div>
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${isLotOutOfStock ? 'text-rose-500' : 'text-slate-500'}`}>
                            Stock: {lot.currentStock} {isLotOutOfStock && '(OUT)'}
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition ${isLotOutOfStock ? 'text-slate-800' : 'text-slate-600 group-hover:text-indigo-400'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-slate-800/30 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setLotSelectionProduct(null)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
