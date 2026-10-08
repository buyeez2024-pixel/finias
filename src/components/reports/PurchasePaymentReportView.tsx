import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { ExportButtons } from '../common/ExportButtons';
import { formatCurrency, formatDate, normalizeDateToYMD } from '../../utils/formatters';
import {
  Calendar,
  Building,
  Search,
  Filter,
  DollarSign,
  ArrowDownUp,
  Download,
  CreditCard,
  Banknote,
  Landmark,
  Wallet,
  Columns,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Eye,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { PaymentMethod } from '../../types/erp';

export const PurchasePaymentReportView: React.FC = () => {
  const { transactions, suppliers, locations, settings, paymentMethods } = useErp();

  const isLight = settings?.themeMode === 'light';

  // Column Visibility State
  const [showColumnVisibility, setShowColumnVisibility] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    referenceNo: true,
    purchaseNo: true,
    supplier: true,
    paymentMethod: true,
    amount: true,
  });

  const PURCHASE_PAYMENT_COLUMN_DEFINITIONS = [
    { key: 'date', label: 'Date', description: 'Transaction record timestamp', locked: true },
    { key: 'referenceNo', label: 'Reference No', description: 'Voucher serial reference', locked: false },
    { key: 'purchaseNo', label: 'Purchase No', description: 'PO Invoice serial number', locked: false },
    { key: 'supplier', label: 'Supplier', description: 'Supplier entity name & company', locked: false },
    { key: 'paymentMethod', label: 'Payment Method', description: 'Cash, bank, UPI mode', locked: false },
    { key: 'amount', label: 'Amount', description: 'Payment transaction amount', locked: false },
  ];

  const handleColumnPreset = (type: 'all' | 'standard' | 'compact' | 'reset') => {
    if (type === 'all' || type === 'reset') {
      setVisibleColumns({ date: true, referenceNo: true, purchaseNo: true, supplier: true, paymentMethod: true, amount: true });
    } else if (type === 'standard') {
      setVisibleColumns({ date: true, referenceNo: true, purchaseNo: true, supplier: true, paymentMethod: true, amount: true });
    } else if (type === 'compact') {
      setVisibleColumns({ date: true, referenceNo: false, purchaseNo: true, supplier: true, paymentMethod: false, amount: true });
    }
  };

  // Date Filters
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return now.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  
  const [datePreset, setDatePreset] = useState('Last 30 Days');

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const format = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'Today') {
      setStartDate(format(today));
      setEndDate(format(today));
    } else if (preset === 'Yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      setStartDate(format(yesterday));
      setEndDate(format(yesterday));
    } else if (preset === 'Last 7 Days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(format(past));
      setEndDate(format(today));
    } else if (preset === 'Last 30 Days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(format(past));
      setEndDate(format(today));
    } else if (preset === 'This Month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(format(start));
      setEndDate(format(today));
    } else if (preset === 'Last Month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(format(start));
      setEndDate(format(end));
    } else if (preset === 'Current Financial Year') {
      const currentYear = today.getFullYear();
      const isPostApril = today.getMonth() >= 3;
      const startYear = isPostApril ? currentYear : currentYear - 1;
      setStartDate(`${startYear}-04-01`);
      setEndDate(format(today));
    } else if (preset === 'All Time') {
      setStartDate('2020-01-01');
      setEndDate(format(today));
    }
  };

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, selectedSupplierId, selectedLocationId, selectedPaymentMethod, searchQuery]);

  // Extract all payment entries from purchases
  const paymentEntries = useMemo(() => {
    const entries: any[] = [];
    
    transactions.forEach(tx => {
      if (tx.type === 'purchase') {
        if (tx.paymentEntries && tx.paymentEntries.length > 0) {
          tx.paymentEntries.forEach(payment => {
            entries.push({
              ...payment,
              transactionId: tx.id,
              purchaseNo: tx.invoiceNo,
              supplierId: tx.supplierId,
              locationId: tx.locationId,
              date: payment.date || tx.date,
            });
          });
        } else if (tx.paidAmount && tx.paidAmount > 0) {
          entries.push({
            id: `pay_${tx.id}`,
            method: tx.paymentMethod || 'cash',
            amount: tx.paidAmount,
            date: tx.date,
            referenceNo: tx.invoiceNo + '-P1',
            transactionId: tx.id,
            purchaseNo: tx.invoiceNo,
            supplierId: tx.supplierId,
            locationId: tx.locationId,
          });
        }
      }
    });
    
    return entries;
  }, [transactions]);

  // Apply filters
  const filteredPayments = useMemo(() => {
    return paymentEntries.filter(entry => {
      // Date filter - normalize any format (DD-MM-YYYY, YYYY-MM-DD, ISO) into YYYY-MM-DD for accurate comparison
      const entryDate = normalizeDateToYMD(entry.date);
      if (entryDate) {
        if (startDate && entryDate < startDate) {
          return false;
        }
        if (endDate && entryDate > endDate) {
          return false;
        }
      }
      
      // Supplier filter
      if (selectedSupplierId !== 'all' && entry.supplierId !== selectedSupplierId) {
        return false;
      }

      // Location filter
      if (selectedLocationId !== 'all' && entry.locationId !== selectedLocationId) {
        return false;
      }
      
      // Payment Method filter
      if (selectedPaymentMethod !== 'all' && entry.method !== selectedPaymentMethod) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const refNoMatch = entry.referenceNo?.toLowerCase().includes(query) || false;
        const purchaseNoMatch = entry.purchaseNo?.toLowerCase().includes(query) || false;
        
        const supplier = suppliers.find(s => s.id === entry.supplierId);
        const supplierMatch = supplier?.name.toLowerCase().includes(query) || false;

        if (!refNoMatch && !purchaseNoMatch && !supplierMatch) {
          return false;
        }
      }

      return true;
    });
  }, [paymentEntries, startDate, endDate, selectedSupplierId, selectedLocationId, selectedPaymentMethod, searchQuery, suppliers]);

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage) || 1;
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredPayments.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredPayments, currentPage, rowsPerPage]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((sum, entry) => sum + entry.amount, 0);
  }, [filteredPayments]);

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4 text-emerald-400" />;
      case 'card': return <CreditCard className="w-4 h-4 text-blue-400" />;
      case 'bank_transfer': return <Landmark className="w-4 h-4 text-indigo-400" />;
      default: return <Wallet className="w-4 h-4 text-slate-400" />;
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    return method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const processedPaymentsExportData = useMemo(() => {
    return filteredPayments.map((entry) => {
      const supplier = suppliers.find(s => s.id === entry.supplierId);
      return {
        ...entry,
        supplierName: supplier?.name || 'Unknown',
        paymentMethodLabel: getMethodLabel(entry.method),
      };
    });
  }, [filteredPayments, suppliers]);

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-7xl mx-auto">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
      }`}>
        <div>
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <DollarSign className="w-7 h-7 text-emerald-500" />
            Purchase Payment Report
          </h2>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            View and manage all payments made to suppliers for purchases
          </p>
        </div>
        
        <ExportButtons
          headers={['Reference No', 'Paid On', 'Amount', 'Supplier', 'Payment Method', 'Purchase No']}
          keys={['referenceNo', 'date', 'amount', 'supplierName', 'paymentMethodLabel', 'purchaseNo']}
          data={processedPaymentsExportData}
          filename="purchase_payment_report"
          title="Purchase Payment Report"
          isLight={isLight}
        />
      </div>

      <div className={`rounded-2xl border p-6 transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 flex-wrap mb-6">
          {['All Time', 'Today', 'Yesterday', 'This Month', 'Last Month', 'Last 30 Days', 'Last 7 Days', 'Current Financial Year'].map(
            (preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  datePreset === preset
                    ? isLight
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50'
                    : isLight
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {preset}
              </button>
            )
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="min-w-0">
            <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('Custom');
              }}
              className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 text-white border-slate-800'
              }`}
            />
          </div>

          <div className="min-w-0">
            <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('Custom');
              }}
              className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 text-white border-slate-800'
              }`}
            />
          </div>

          <div className="min-w-0">
            <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>Supplier</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className={`w-full text-xs font-semibold pl-10 pr-3 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none appearance-none transition ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 text-white border-slate-800'
                }`}
              >
                <option value="all">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="min-w-0">
            <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>Location</label>
            <div className="relative">
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none appearance-none transition ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 text-white border-slate-800'
                }`}
              >
                <option value="all">All Locations</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="min-w-0">
            <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>Payment Method</label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none appearance-none transition ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 text-white border-slate-800'
              }`}
            >
              <option value="all">All Methods</option>
              {paymentMethods.filter(m => m.enabled).map(m => (
                <option key={m.id} value={m.code}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className={`block text-xs font-medium mb-1.5 ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Ref No, Purchase No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs font-semibold pl-10 pr-3 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 text-white border-slate-800'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
      }`}>
        {/* Column Visibility Section (Reference Screenshot Style) */}
        <div className={`border-b ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800 bg-slate-950/80'}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 ${showColumnVisibility ? (isLight ? 'border-b border-slate-200' : 'border-b border-slate-800') : ''}`}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
                <Columns className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <span>Column Visibility</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {Object.values(visibleColumns).filter(Boolean).length} of {PURCHASE_PAYMENT_COLUMN_DEFINITIONS.length} Visible
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 hidden sm:inline-flex">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Admin Privileges</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                  Select which columns to display in the Purchase Payment Report table.
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
              {showColumnVisibility && (
                <div className="flex items-center gap-1.5 mr-2">
                  <button
                    type="button"
                    onClick={() => handleColumnPreset('all')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleColumnPreset('standard')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleColumnPreset('compact')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer hidden sm:inline-block"
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    onClick={() => handleColumnPreset('reset')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-950/50 text-rose-400 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                    title="Reset to default columns"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setShowColumnVisibility(!showColumnVisibility)}
                className={
                  isLight
                    ? 'relative transition active:scale-95 active:opacity-80 cursor-pointer px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-indigo-100/20 rounded-xl text-xs font-bold flex items-center gap-1.5'
                    : showColumnVisibility
                    ? 'px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                    : 'px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }
              >
                {showColumnVisibility ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Hide Fields</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Show Fields</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showColumnVisibility && (
            <div className={`border-t p-4 ${isLight ? 'border-slate-200 bg-white/50' : 'border-slate-800/50 bg-slate-900/50'}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {PURCHASE_PAYMENT_COLUMN_DEFINITIONS.map((col) => {
                  const isVisible = visibleColumns[col.key as keyof typeof visibleColumns];
                  const isLocked = col.locked;

                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => {
                        if (!isLocked) {
                          setVisibleColumns(prev => ({ ...prev, [col.key]: !isVisible }));
                        }
                      }}
                      disabled={isLocked}
                      className={`flex flex-col items-start justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isVisible
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/20'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-800/40'
                      } ${isLocked ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <div className={`p-1 rounded-md ${
                          isVisible ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isVisible ? <CheckCircle2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </div>
                        {isLocked ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-0.5">
                            Locked
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-slate-500">
                            {isVisible ? 'Visible' : 'Hidden'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white truncate w-full">{col.label}</span>
                      <span className="text-[10px] text-slate-400 truncate w-full mt-0.5">{col.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto scrollbar-thin overscroll-x-contain">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${
                isLight ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-slate-800 bg-slate-900/50 text-slate-400'
              }`}>
                {visibleColumns.date && (
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider">
                    Date
                  </th>
                )}
                {visibleColumns.referenceNo && (
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider">
                    Reference No
                  </th>
                )}
                {visibleColumns.purchaseNo && (
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider">
                    Purchase No
                  </th>
                )}
                {visibleColumns.supplier && (
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider">
                    Supplier
                  </th>
                )}
                {visibleColumns.paymentMethod && (
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider">
                    Payment Method
                  </th>
                )}
                {visibleColumns.amount && (
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-right">
                    Amount
                  </th>
                )}
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/50'}`}>
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((entry, index) => {
                  const supplier = suppliers.find(s => s.id === entry.supplierId);
                  
                  return (
                    <tr key={entry.id || index} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'}`}>
                      {visibleColumns.date && (
                        <td className={`py-4 px-6 text-sm ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                      )}
                      {visibleColumns.referenceNo && (
                        <td className="py-4 px-6">
                          <span className={`text-sm font-medium ${isLight ? 'text-emerald-600 font-bold' : 'text-emerald-400'}`}>
                            {entry.referenceNo || '-'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.purchaseNo && (
                        <td className="py-4 px-6">
                          <span className={`text-sm font-medium ${isLight ? 'text-indigo-600 font-bold' : 'text-indigo-400'}`}>
                            {entry.purchaseNo}
                          </span>
                        </td>
                      )}
                      {visibleColumns.supplier && (
                        <td className="py-4 px-6">
                          <div>
                            <div className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                              {supplier?.name || 'Unknown Supplier'}
                            </div>
                            {supplier?.company && (
                              <div className="text-xs text-slate-500">
                                {supplier.company}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.paymentMethod && (
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {getMethodIcon(entry.method as PaymentMethod)}
                            <span className={`text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              {getMethodLabel(entry.method as PaymentMethod)}
                            </span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.amount && (
                        <td className="py-4 px-6 text-right">
                          <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {formatCurrency(entry.amount, settings)}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length || 1} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <DollarSign className={`w-12 h-12 mb-3 ${isLight ? 'text-slate-300' : 'text-slate-700'}`} />
                      <p className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>No purchase payments found</p>
                      <p className={`text-sm mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className={`border-t ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/30 border-slate-800'}`}>
              <tr>
                <td colSpan={5} className={`py-4 px-6 text-right text-sm font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Total Payments:
                </td>
                <td className={`py-4 px-6 text-right text-lg font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                  {formatCurrency(totalAmount, settings)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 text-xs border-t transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/50 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              {[5, 10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="ml-2">
              Showing {filteredPayments.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
              {Math.min(currentPage * rowsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition ${
                isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  currentPage === page
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm font-bold'
                    : isLight
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition ${
                isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-slate-800 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
