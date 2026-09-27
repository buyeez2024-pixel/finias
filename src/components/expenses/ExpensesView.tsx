import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { ExportButtons } from '../common/ExportButtons';
import { formatCurrency } from '../../utils/formatters';
import {
  DollarSign,
  Plus,
  Building,
  TrendingDown,
  Calendar,
  X,
  CreditCard,
  Banknote,
  Search,
  FileText,
  Repeat,
  Check,
  Trash2,
  Paperclip,
  UploadCloud,
  User,
  Users,
  Info,
  Edit,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const categorySubOptions: Record<string, string[]> = {
  'Rent': ['Store Rent', 'Warehouse Rent', 'Office Lease', 'Land Lease'],
  'Utilities': ['Electricity', 'Water', 'High-Speed Internet', 'Gas & Heating', 'Sewer & Trash'],
  'Salaries': ['Base Employee Salaries', 'Manager Incentives', 'Sales Commissions', 'Hourly Wages', 'Freelancer Contracts'],
  'Logistics': ['Courier Freight & Shipping', 'Warehouse Delivery Transport', 'Delivery Van Fuel', 'Packaging Materials'],
  'Marketing': ['Google/Facebook Ad Budget', 'Signage & Flyer Print', 'SEO & Agency Fees', 'Sponsorships'],
  'Maintenance': ['Equipment Servicing', 'AC & Heating Repairs', 'POS Hardware Fixed Costs', 'Software SaaS Subscriptions'],
  'Office Supplies': ['Stationery & Notebooks', 'Printer Ink & Thermal Rolls', 'Pantry & Coffee Lounge Supplies'],
  'Other': ['Miscellaneous Overheads', 'Guest Entertainment', 'Audit Adjustments', 'Petty Cash Discrepancies']
};

export const ExpensesView: React.FC = () => {
  const { 
    expenses, 
    accounts, 
    locations, 
    selectedLocationId, 
    addExpense,
    updateExpense,
    deleteExpense, 
    settings,
    users,
    suppliers,
    taxRates,
    paymentMethods
  } = useErp();

  const paymentAccounts = accounts || [];

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'create'>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      if (p.includes('expenses/create')) {
        return 'create';
      }
    }
    return 'list';
  });

  React.useEffect(() => {
    if (viewMode === 'create') {
      if (typeof window !== 'undefined') {
        const current = window.location.pathname;
        if (current !== '/expenses/create' || window.location.hash) {
          window.history.replaceState(null, '', '/expenses/create');
        }
      }
    } else {
      if (typeof window !== 'undefined') {
        const current = window.location.pathname;
        if (current === '/expenses/create' || window.location.hash.includes('expenses/create')) {
          window.history.replaceState(null, '', '/expenses');
        }
      }
    }
  }, [viewMode]);

  // Comprehensive states matching finias POS expenses/create
  const [locationId, setLocationId] = useState(selectedLocationId || 'loc_main');
  const [category, setCategory] = useState<'Rent' | 'Utilities' | 'Salaries' | 'Logistics' | 'Marketing' | 'Maintenance' | 'Office Supplies' | 'Other'>('Utilities');
  const [subCategory, setSubCategory] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format
  });
  const [expenseForUserId, setExpenseForUserId] = useState('');
  const [expenseForContactId, setExpenseForContactId] = useState('');
  const [taxRateId, setTaxRateId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'cheque' | 'other'>('cash');
  const [accountId, setAccountId] = useState(paymentAccounts[0]?.id || '');
  const [paymentNote, setPaymentNote] = useState('');
  const [notes, setNotes] = useState('');
  
  // Refund states
  const [isRefund, setIsRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundPaymentDetails, setRefundPaymentDetails] = useState('');
  
  // Recurring states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recurringRepetitions, setRecurringRepetitions] = useState('12');

  // Document attachments mockup
  const [documentName, setDocumentName] = useState('');
  const [documentSize, setDocumentSize] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Update dynamic subcategories when category changes
  React.useEffect(() => {
    const subOptions = categorySubOptions[category] || [];
    if (subOptions.length > 0) {
      setSubCategory(subOptions[0]);
    } else {
      setSubCategory('');
    }
  }, [category]);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(
    (e) =>
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.note && e.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e as any).subCategory?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const expensesExportData = React.useMemo(() => {
    return filteredExpenses.map((exp) => {
      const location = locations?.find((l) => l.id === exp.locationId);
      const paymentAccount = paymentAccounts?.find((pa) => pa.id === exp.paymentAccountId);
      return {
        ...exp,
        locationName: location?.name || 'Main Location',
        paymentAccountName: paymentAccount?.name || 'N/A',
      };
    });
  }, [filteredExpenses, locations, paymentAccounts]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const totalPages = Math.ceil(filteredExpenses.length / pageSize);

  const paginatedExpenses = React.useMemo(() => {
    if (!isLight) return filteredExpenses;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(startIndex, startIndex + pageSize);
  }, [filteredExpenses, isLight, currentPage, pageSize]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount) || 0;
    if (numAmt <= 0) return;

    // Calculate tax if any
    let taxRateVal = 0;
    if (taxRateId) {
      const selectedTax = taxRates.find((t) => t.id === taxRateId);
      if (selectedTax) {
        taxRateVal = selectedTax.rate;
      }
    }
    const calculatedTaxAmount = (numAmt * taxRateVal) / 100;
    const finalAmount = numAmt + calculatedTaxAmount;

    // Find related employee/supplier info
    const employeeObj = users.find((u) => u.id === expenseForUserId);
    const supplierObj = suppliers.find((s) => s.id === expenseForContactId);

    const expensePayload = {
      locationId,
      category,
      subCategory,
      referenceNo: referenceNo.trim() || undefined,
      date: date ? date.split('T')[0] : undefined,
      amount: finalAmount,
      paymentAccountId: accountId,
      accountId,
      paymentMethod,
      expenseForUserId: expenseForUserId || undefined,
      expenseForContactId: expenseForContactId || undefined,
      taxRateId: taxRateId || undefined,
      taxAmount: calculatedTaxAmount > 0 ? calculatedTaxAmount : undefined,
      paymentNote: paymentNote.trim() || undefined,
      note: notes.trim() || undefined,
      notes: notes.trim() || undefined,
      paidBy: employeeObj ? `${employeeObj.name} (${employeeObj.role})` : 'Sarah Jenkins (Store Manager)',
      paidTo: supplierObj ? supplierObj.name : 'Vetted Vendor Partner',
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : undefined,
      recurringRepetitions: isRecurring ? parseInt(recurringRepetitions) || undefined : undefined,
      documentName: documentName || undefined,
      isRefund,
      refundAmount: isRefund ? parseFloat(refundAmount) || 0 : undefined,
      refundPaymentDetails: isRefund ? refundPaymentDetails.trim() || undefined : undefined,
    };

    if (editingExpenseId) {
      updateExpense(editingExpenseId, expensePayload);
    } else {
      addExpense(expensePayload);
    }

    // Reset fields
    setEditingExpenseId(null);
    setAmount('');
    setReferenceNo('');
    setPaymentNote('');
    setNotes('');
    setExpenseForUserId('');
    setExpenseForContactId('');
    setTaxRateId('');
    setIsRecurring(false);
    setIsRefund(false);
    setRefundAmount('');
    setRefundPaymentDetails('');
    setDocumentName('');
    setDocumentSize('');
    setViewMode('list');
  };

  const handleEditExpense = (exp: any) => {
    setEditingExpenseId(exp.id);
    setLocationId(exp.locationId || selectedLocationId || 'loc_main');
    setCategory(exp.category || 'Utilities');
    setSubCategory(exp.subCategory || '');
    setReferenceNo(exp.referenceNo || '');
    setDate(exp.date ? `${exp.date}T10:00` : new Date().toISOString().slice(0, 16));
    setExpenseForUserId(exp.expenseForUserId || '');
    setExpenseForContactId(exp.expenseForContactId || '');
    setTaxRateId(exp.taxRateId || '');
    setAmount(exp.amount ? exp.amount.toString() : '');
    setPaymentMethod(exp.paymentMethod || 'cash');
    setAccountId(exp.accountId || exp.paymentAccountId || (paymentAccounts[0]?.id || ''));
    setPaymentNote(exp.paymentNote || '');
    setNotes(exp.notes || exp.note || '');
    setIsRefund(!!exp.isRefund);
    setRefundAmount(exp.refundAmount ? exp.refundAmount.toString() : '');
    setRefundPaymentDetails(exp.refundPaymentDetails || '');
    setIsRecurring(!!exp.isRecurring);
    setRecurringInterval(exp.recurringInterval || 'monthly');
    setRecurringRepetitions(exp.recurringRepetitions ? exp.recurringRepetitions.toString() : '12');
    setDocumentName(exp.documentName || '');
    setViewMode('create');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocumentName(file.name);
      setDocumentSize((file.size / 1024).toFixed(1) + ' KB');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setDocumentName(file.name);
      setDocumentSize((file.size / 1024).toFixed(1) + ' KB');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {viewMode === 'create' ? (
        <div className="space-y-6">
          {/* Breadcrumbs & Navigation */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <button onClick={() => setViewMode('list')} className="hover:text-slate-300 transition">Expenses</button>
            <span>/</span>
            <span className="text-slate-400">{editingExpenseId ? 'Edit POS Expense' : 'Record POS Expense'}</span>
          </div>

          {/* Header section with back button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-400" />
                <span>{editingExpenseId ? 'Edit POS Expense' : 'Record POS Expense (finias POS Enterprise)'}</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {editingExpenseId ? 'Update an existing business expenditure entry or refund details.' : 'Create a new business expenditure ledger entry. All inputs compile dynamically in your accounting balance sheet.'}
              </p>
            </div>
            <button
              onClick={() => setViewMode('list')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"
            >
              <X className="w-4 h-4" />
              <span>Cancel & Go Back</span>
            </button>
          </div>

          {/* Creation Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <form onSubmit={handleCreateExpense} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT COL: Core Classification */}
                <div className="space-y-4 bg-slate-950/40 p-5 rounded-xl border border-slate-800/60">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">
                    1. Basic Classification
                  </h4>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Business Location *</label>
                    <select
                      required
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none transition"
                    >
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Expense Category *</label>
                      <select
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none transition"
                      >
                        <option value="Utilities">Utilities</option>
                        <option value="Rent">Rent & Lease</option>
                        <option value="Salaries">Staff Salaries</option>
                        <option value="Logistics">Logistics & Freight</option>
                        <option value="Marketing">Marketing & Ads</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Office Supplies">Office Supplies</option>
                        <option value="Other">Other Category</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Sub-Category</label>
                      <select
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none transition"
                      >
                        {categorySubOptions[category]?.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Reference No</label>
                      <input
                        type="text"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="Auto-generated if blank"
                        className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Date & Time *</label>
                      <input
                        required
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none transition font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Expense For (Employee)</label>
                      <select
                        value={expenseForUserId}
                        onChange={(e) => setExpenseForUserId(e.target.value)}
                        className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none transition"
                      >
                        <option value="">None (General Store Expense)</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Expense For Contact (Vendor)</label>
                      <select
                        value={expenseForContactId}
                        onChange={(e) => setExpenseForContactId(e.target.value)}
                        className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none transition"
                      >
                        <option value="">None (Direct cash payment)</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.company || 'Supplier'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* RIGHT COL: Finance & Payment */}
                <div className="space-y-4 bg-slate-950/40 p-5 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">
                      2. Financial Details & Payment
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">Applicable Tax Rate</label>
                        <select
                          value={taxRateId}
                          onChange={(e) => setTaxRateId(e.target.value)}
                          className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none transition"
                        >
                          <option value="">No Tax / Tax Exempt</option>
                          {taxRates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.rate}%)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-rose-400 font-bold block mb-1">Amount ({settings.currencySymbol || '$'}) *</label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-950 text-rose-400 font-bold px-3 py-2.5 rounded-lg border border-rose-950 focus:border-rose-500 focus:outline-none transition text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div className="col-span-1">
                        <label className="text-slate-300 font-semibold block mb-1">Method *</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="w-full bg-slate-950 text-white px-3.5 py-2 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none transition capitalize text-[11px]"
                        >
                          {paymentMethods.filter(m => m.enabled).map(m => (
                            <option key={m.id} value={m.code}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-slate-300 font-semibold block mb-1">Payment Account *</label>
                        <select
                          required
                          value={accountId}
                          onChange={(e) => setAccountId(e.target.value)}
                          className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none transition text-[11px]"
                        >
                          {paymentAccounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({settings.currencySymbol || '$'}{a.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="text-slate-300 font-semibold block mb-1">Payment Notes (Transaction Ref / Cheque No)</label>
                      <input
                        type="text"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="e.g. Bank Transfer TXN-29384, Cheque No. 2093"
                        className="w-full bg-slate-950 text-slate-300 px-3 py-2.5 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none transition"
                      />
                    </div>

                    {/* Refund Checkbox and Fields */}
                    <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isRefundCheck"
                          checked={isRefund}
                          onChange={(e) => setIsRefund(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-slate-700 focus:ring-rose-500 accent-rose-500 cursor-pointer"
                        />
                        <label htmlFor="isRefundCheck" className="text-slate-300 font-bold select-none cursor-pointer flex items-center gap-1 text-[11px]">
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                          <span>This expense is refunded / has a refund?</span>
                        </label>
                      </div>

                      {isRefund && (
                        <div className="mt-3 space-y-3 pt-2 border-t border-slate-800/60 animate-fadeIn">
                          <div>
                            <label className="text-emerald-400 font-bold block mb-1">Refund Amount ({settings.currencySymbol || '$'}) *</label>
                            <input
                              required={isRefund}
                              type="number"
                              step="0.01"
                              value={refundAmount}
                              onChange={(e) => setRefundAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-slate-950 text-emerald-400 font-bold px-3 py-2 rounded-lg border border-emerald-950 focus:border-emerald-500 focus:outline-none transition text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-300 font-semibold block mb-1">Refund Payment Details *</label>
                            <input
                              required={isRefund}
                              type="text"
                              value={refundPaymentDetails}
                              onChange={(e) => setRefundPaymentDetails(e.target.value)}
                              placeholder="e.g. Returned to Cash Account, Cashier refund slip ref #101"
                              className="w-full bg-slate-950 text-slate-300 px-3 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none transition text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Attachment Widget */}
                  <div className="mt-4">
                    <label className="text-slate-300 font-semibold block mb-1">Upload Document Attachment</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition ${
                        isDragOver ? 'border-rose-500 bg-rose-500/10' : 'border-slate-800 bg-slate-950/20 hover:border-slate-700'
                      }`}
                    >
                      {documentName ? (
                        <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
                          <div className="flex items-center gap-2 text-slate-300 truncate">
                            <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                            <div className="text-left truncate">
                              <p className="text-[10px] font-bold truncate max-w-[180px]">{documentName}</p>
                              <p className="text-[9px] text-slate-500 font-mono">{documentSize}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDocumentName('');
                              setDocumentSize('');
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <UploadCloud className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                          <span className="text-[10px] text-slate-400 font-semibold">Drag & drop files or </span>
                          <span className="text-[10px] text-rose-400 font-bold underline hover:text-rose-300">browse</span>
                          <p className="text-[9px] text-slate-600 mt-0.5">Max size: 5MB (PDF, JPG, PNG)</p>
                          <input type="file" onChange={handleFileChange} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM: Descriptions, Note & Recurring options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/20 p-5 rounded-xl border border-slate-800/40">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-slate-300 font-semibold block">Expense Notes / Description</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide store rent breakdown, logistics invoices, specific equipment repaired, or other billing contexts..."
                    className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 focus:border-rose-500 focus:outline-none transition resize-none text-xs"
                  />
                </div>

                <div className="space-y-3 border-l border-slate-800 md:pl-6">
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="isRecurringCheck"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-slate-700 focus:ring-rose-500 accent-rose-500"
                    />
                    <label htmlFor="isRecurringCheck" className="text-slate-300 font-bold select-none cursor-pointer flex items-center gap-1">
                      <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Is Recurring Expense?</span>
                    </label>
                  </div>

                  {isRecurring && (
                    <div className="space-y-3 pt-1 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 text-[10px] block mb-0.5">Interval</label>
                          <select
                            value={recurringInterval}
                            onChange={(e) => setRecurringInterval(e.target.value as any)}
                            className="w-full bg-slate-950 text-white px-2 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-rose-500"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px] block mb-0.5">Repetitions</label>
                          <input
                            type="number"
                            min="1"
                            value={recurringRepetitions}
                            onChange={(e) => setRecurringRepetitions(e.target.value)}
                            className="w-full bg-slate-950 text-white px-2 py-1 rounded border border-slate-800 font-mono focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-lg shadow-rose-950 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save POS Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-400" />
                <span>Operating Expenses & Financial Accounts</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Track store overheads, logistics rent, employee outlays, and multi-currency payment accounts.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingExpenseId(null);
                setAmount('');
                setReferenceNo('');
                setPaymentNote('');
                setNotes('');
                setExpenseForUserId('');
                setExpenseForContactId('');
                setTaxRateId('');
                setIsRecurring(false);
                setIsRefund(false);
                setRefundAmount('');
                setRefundPaymentDetails('');
                setDocumentName('');
                setDocumentSize('');
                if (paymentAccounts.length > 0 && !accountId) {
                  setAccountId(paymentAccounts[0].id);
                }
                setViewMode('create');
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record POS Expense</span>
            </button>
          </div>

          {/* Payment Accounts Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {paymentAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold">{acc.name}</div>
                  <div className="text-xl font-extrabold text-white font-mono mt-1">
                    {settings.currencySymbol}
                    {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 capitalize">Type: {acc.type.replace('_', ' ')}</div>
                </div>
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  {acc.type === 'cash' ? <Banknote className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                </div>
              </div>
            ))}
          </div>

          {/* Expense History Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm">Operating Expense Ledger</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Showing categorized expenses with related tax rates, employee assignments and attachment metadata.</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <ExportButtons
                  headers={[
                    'Reference No',
                    'Date',
                    'Category',
                    'Sub-Category',
                    'Location',
                    'Payment Account',
                    'Amount',
                    'Payment Method',
                    'Note',
                  ]}
                  keys={[
                    'referenceNo',
                    'date',
                    'category',
                    'subCategory',
                    'locationName',
                    'paymentAccountName',
                    'amount',
                    'paymentMethod',
                    'note',
                  ]}
                  data={expensesExportData}
                  filename="expenses_list"
                  title="Operating Expense Ledger"
                  isLight={isLight}
                />

                {/* Page size filter (Light Mode Only) */}
                {isLight && (
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                )}

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search expenses (category, note, ref)..."
                    className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-y border-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-3">Ref No.</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Expense Category</th>
                    <th className="py-3 px-3">Payment details</th>
                    <th className="py-3 px-3">Business location</th>
                    <th className="py-3 px-3">Expense For</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">Attachments & Metadata</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        <Info className="w-5 h-5 mx-auto mb-2 text-slate-600" />
                        No expenses found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    paginatedExpenses.map((exp) => {
                      const acc = paymentAccounts.find((a) => a.id === (exp.accountId || exp.paymentAccountId));
                      const loc = locations.find((l) => l.id === exp.locationId);
                      const relatedUser = users.find((u) => u.id === (exp as any).expenseForUserId);
                      const relatedSupplier = suppliers.find((s) => s.id === (exp as any).expenseForContactId);

                      return (
                        <tr key={exp.id} className="hover:bg-slate-850 transition">
                          <td className="py-3.5 px-3 font-mono font-bold text-white">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>{exp.referenceNo}</span>
                                {(exp as any).isRecurring && (
                                  <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                              </div>
                              {exp.isRefund && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold border border-emerald-500/20 w-fit leading-none mt-0.5">
                                  <TrendingDown className="w-2.5 h-2.5 shrink-0" />
                                  <span>Refund</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-slate-400 font-mono">{exp.date}</td>
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-amber-300">
                              <span className="px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20 text-[10px]">
                                {exp.category}
                              </span>
                            </div>
                            {(exp as any).subCategory && (
                              <div className="text-[10px] text-slate-400 mt-1 pl-1">
                                ↳ {(exp as any).subCategory}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="text-slate-200 font-medium">{acc?.name || 'General Cash'}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <span className="uppercase bg-slate-800 text-slate-300 px-1 py-0.5 rounded text-[9px]">
                                {exp.paymentMethod?.replace('_', ' ') || 'Cash'}
                              </span>
                              {(exp as any).paymentNote && (
                                <span className="truncate max-w-[120px]" title={(exp as any).paymentNote}>
                                  • {(exp as any).paymentNote}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-slate-300 font-medium">{loc?.name || 'Main Warehouse'}</td>
                          <td className="py-3.5 px-3">
                            {relatedUser || relatedSupplier ? (
                              <div className="space-y-1">
                                {relatedUser && (
                                  <div className="flex items-center gap-1 text-[11px] text-indigo-300">
                                    <User className="w-3 h-3 text-indigo-400" />
                                    <span>{relatedUser.name}</span>
                                  </div>
                                )}
                                {relatedSupplier && (
                                  <div className="flex items-center gap-1 text-[11px] text-emerald-300">
                                    <Users className="w-3 h-3 text-emerald-400" />
                                    <span>{relatedSupplier.name}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">None assigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="font-mono font-bold text-rose-400 text-sm">
                              -{formatCurrency(exp.amount, settings)}
                            </div>
                            {exp.isRefund && (
                              <div className="mt-1 space-y-0.5">
                                <div className="text-[10px] text-emerald-400 font-bold font-mono">
                                  +{formatCurrency(exp.refundAmount || 0, settings)} Refund
                                </div>
                                <div className="text-[9px] text-slate-400 font-mono font-semibold">
                                  Net: {formatCurrency(exp.amount - (exp.refundAmount || 0), settings)}
                                </div>
                              </div>
                            )}
                            {(exp as any).taxAmount > 0 && (
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                Inc. Tax: {formatCurrency((exp as any).taxAmount, settings)}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-slate-400">
                            <div className="max-w-[200px] truncate" title={exp.note || exp.notes}>
                              {exp.note || exp.notes || <span className="text-slate-600 italic">No description</span>}
                            </div>
                            {exp.isRefund && exp.refundPaymentDetails && (
                              <div className="text-[10px] text-emerald-300 font-medium mt-1 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-md w-fit">
                                <span className="font-bold text-emerald-400">Refund:</span> {exp.refundPaymentDetails}
                              </div>
                            )}
                            {(exp as any).documentName ? (
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer">
                                <Paperclip className="w-3 h-3" />
                                <span className="truncate max-w-[130px]" title={(exp as any).documentName}>
                                  {(exp as any).documentName}
                                </span>
                              </div>
                            ) : null}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditExpense(exp)}
                                title="Edit Expense & Refund Details"
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete expense reference ${exp.referenceNo}?`)) {
                                    deleteExpense(exp.id);
                                  }
                                }}
                                title="Delete Expense"
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (Light Mode Only) */}
            {isLight && totalPages > 1 && (
              <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border-t border-slate-800 rounded-b-2xl shadow-sm">
                <div className="text-xs text-slate-400 font-medium">
                  Showing <span className="font-bold text-white">{Math.min((currentPage - 1) * pageSize + 1, filteredExpenses.length)}</span> to <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredExpenses.length)}</span> of <span className="font-bold text-white">{filteredExpenses.length}</span> entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-xs font-semibold text-slate-300">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

