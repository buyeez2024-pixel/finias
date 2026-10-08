import { formatCurrency } from '../../utils/formatters';
import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { ExportButtons } from '../common/ExportButtons';
import { Transaction } from '../../types/erp';
import { NetworkSyncStatusBadge } from '../common/NetworkSyncStatusBadge';
import { OfflineSyncManagerModal } from '../pos/OfflineSyncManagerModal';
import { ViewPaymentsModal } from './ViewPaymentsModal';
import { ViewSaleDetailsModal } from './ViewSaleDetailsModal';
import {
  Receipt,
  Search,
  Printer,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Clock,
  WifiOff,
  CloudCheck,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  CreditCard,
  Banknote,
  Landmark,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Columns,
  ShieldCheck,
  Lock, ChevronDown, ChevronUp,
} from 'lucide-react';

interface SalesViewProps {
  onOpenReceipt: (sale: Transaction) => void;
  onOpenNewSale?: () => void;
  isPosOnly?: boolean;
  initialStatusFilter?: string;
  title?: string;
  addBtnLabel?: string;
  onAddBtnClick?: () => void;
}

interface SalesColumnVisibility {
  date: boolean;
  referenceNo: boolean;
  customerName: boolean;
  location: boolean;
  paymentStatus: boolean;
  paymentMethod: boolean;
  salesRep: boolean;
  totalAmount: boolean;
  totalPaid: boolean;
  sellDue: boolean;
  action: boolean;
}

const DEFAULT_SALES_COLUMNS: SalesColumnVisibility = {
  date: true,
  referenceNo: true,
  customerName: true,
  location: true,
  paymentStatus: true,
  paymentMethod: true,
  salesRep: true,
  totalAmount: true,
  totalPaid: true,
  sellDue: true,
  action: true,
};

interface SalesColumnOption {
  key: keyof SalesColumnVisibility;
  label: string;
  category: 'General' | 'Financial Details' | 'Metadata & Action';
  description: string;
  locked?: boolean;
}

const SALES_COLUMN_DEFINITIONS: SalesColumnOption[] = [
  { key: 'referenceNo', label: 'Reference No', category: 'General', description: 'Unique sale invoice reference number', locked: true },
  { key: 'date', label: 'Date', category: 'General', description: 'Date and timestamp of transaction' },
  { key: 'customerName', label: 'Customer Name', category: 'General', description: 'Buyer name or Walk-In Customer label' },
  { key: 'location', label: 'Location', category: 'General', description: 'Store branch or warehouse location' },
  { key: 'totalAmount', label: 'Total Amount', category: 'Financial Details', description: 'Grand total bill value after discounts' },
  { key: 'totalPaid', label: 'Total Paid', category: 'Financial Details', description: 'Sum total of cash/digital payments received' },
  { key: 'sellDue', label: 'Sell Due', category: 'Financial Details', description: 'Outstanding credit balance left to receive' },
  { key: 'paymentStatus', label: 'Payment Status', category: 'Metadata & Action', description: 'Settlement state (e.g. Paid, Partial, Due)' },
  { key: 'paymentMethod', label: 'Payment Method', category: 'Metadata & Action', description: 'Selected mode of payment used' },
  { key: 'salesRep', label: 'Sales Rep', category: 'Metadata & Action', description: 'Cashier or sales representative name' },
  { key: 'action', label: 'Action Buttons', category: 'Metadata & Action', description: 'Print, view, pay, or refund sale action buttons', locked: true },
];

export const getEffectivePaymentStatus = (sale: Transaction): 'paid' | 'partial' | 'due' => {
  const entriesPaid = sale.paymentEntries && sale.paymentEntries.length > 0
    ? sale.paymentEntries.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
    : 0;
  const paid = Math.max(Number(sale.paidAmount) || 0, entriesPaid);
  const total = Number(sale.totalAmount) || 0;

  if (total <= 0) return 'paid';
  if (paid >= total - 0.01) return 'paid';
  if (paid > 0.01) return 'partial';
  return 'due';
};

export const getEffectivePaidAmount = (sale: Transaction): number => {
  const entriesPaid = sale.paymentEntries && sale.paymentEntries.length > 0
    ? sale.paymentEntries.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
    : 0;
  return Math.max(Number(sale.paidAmount) || 0, entriesPaid);
};

export const SalesView: React.FC<SalesViewProps> = ({
  onOpenReceipt,
  onOpenNewSale,
  isPosOnly = false,
  initialStatusFilter = 'all',
  title,
  addBtnLabel,
  onAddBtnClick,
}) => {
  const {
    transactions,
    customers,
    settings,
    setActiveTab,
    offlineQueue,
    locations,
    openAddSalePage,
    openEditSalePage,
    openViewSalePage,
    deleteSale,
    hasPermission,
    currentUser
  } = useErp();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supreme_admin';
  const isManager = currentUser?.role === 'manager';
  const isAuthorizedForColumns = !currentUser || isAdmin || isManager;

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedPaymentSale, setSelectedPaymentSale] = useState<Transaction | null>(null);
  const [selectedDetailsSale, setSelectedDetailsSale] = useState<Transaction | null>(null);
  const [showColumnVisibility, setShowColumnVisibility] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<SalesColumnVisibility>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_sales_columns_visibility');
      if (saved) {
        try {
          return { ...DEFAULT_SALES_COLUMNS, ...JSON.parse(saved) };
        } catch (e) {
          // ignore
        }
      }
    }
    return DEFAULT_SALES_COLUMNS;
  });

  const toggleColumn = (key: keyof SalesColumnVisibility) => {
    if (key === 'referenceNo' || key === 'action') return; // Fixed columns
    if (!isAuthorizedForColumns) return;
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('erp_sales_columns_visibility', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleApplyPreset = (preset: 'all' | 'standard' | 'compact' | 'reset') => {
    if (!isAuthorizedForColumns) return;
    let next: SalesColumnVisibility;
    switch (preset) {
      case 'all':
        next = {
          date: true, referenceNo: true, customerName: true, location: true,
          paymentStatus: true, paymentMethod: true, salesRep: true,
          totalAmount: true, totalPaid: true, sellDue: true, action: true
        };
        break;
      case 'standard':
        next = {
          date: true, referenceNo: true, customerName: true, location: true,
          paymentStatus: true, paymentMethod: false, salesRep: false,
          totalAmount: true, totalPaid: true, sellDue: true, action: true
        };
        break;
      case 'compact':
        next = {
          date: true, referenceNo: true, customerName: true, location: false,
          paymentStatus: true, paymentMethod: false, salesRep: false,
          totalAmount: true, totalPaid: false, sellDue: false, action: true
        };
        break;
      case 'reset':
      default:
        next = { ...DEFAULT_SALES_COLUMNS };
        break;
    }
    setVisibleColumns(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp_sales_columns_visibility', JSON.stringify(next));
    }
  };

  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const salesList = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'sale') return false;
      const isPosTx = t.isPos === true || t.saleChannel === 'pos' || (t.invoiceNo && t.invoiceNo.toUpperCase().startsWith('POS'));

      if (initialStatusFilter === 'quotation') {
        return t.status === 'quotation';
      }
      if (initialStatusFilter === 'draft') {
        return t.status === 'draft';
      }
      if (isPosOnly) {
        return isPosTx && t.status !== 'quotation' && t.status !== 'draft';
      }
      // For All Sales: exclude quotations and drafts
      if (t.status === 'quotation' || t.status === 'draft') {
        return false;
      }
      return !isPosTx;
    });
  }, [transactions, isPosOnly, initialStatusFilter]);

  const filteredSales = useMemo(() => {
    return salesList.filter((s) => {
      const customer = customers.find((c) => c.id === s.customerId);
      const matchSearch =
        s.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const effPaymentStatus = getEffectivePaymentStatus(s);
      const matchPayment = paymentFilter === 'all' || effPaymentStatus === paymentFilter;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchPayment && matchStatus;
    });
  }, [salesList, customers, searchQuery, paymentFilter, statusFilter]);

  const salesExportData = useMemo(() => {
    return filteredSales.map((s) => {
      const customer = customers.find((c) => c.id === s.customerId);
      const location = locations?.find((l) => l.id === s.locationId);
      const effPaid = getEffectivePaidAmount(s);
      const due = Math.max(0, Number(s.totalAmount || 0) - effPaid);
      const effStatus = getEffectivePaymentStatus(s);
      let paymentMethodStr = 'N/A';
      if (s.paymentEntries && s.paymentEntries.length > 0) {
        const methods = s.paymentEntries.map(p => p.method);
        paymentMethodStr = [...new Set(methods)].map((m: string) => m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')).join(', ');
      }
      return {
        ...s,
        customerName: customer?.name || 'Walk-In Customer',
        locationName: location?.name || 'Main Location',
        paidAmount: effPaid,
        dueAmount: due,
        paymentStatus: effStatus,
        paymentMethodStr,
      };
    });
  }, [filteredSales, customers, locations]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, paymentFilter, statusFilter, pageSize]);

  const totalPages = Math.ceil(filteredSales.length / pageSize);

  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSales.slice(startIndex, startIndex + pageSize);
  }, [filteredSales, currentPage, pageSize]);

  const totalSalesRevenue = salesList.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalDueReceivables = salesList.reduce(
    (sum, s) => sum + Math.max(0, s.totalAmount - s.paidAmount),
    0
  );

  const isDraftOrQuotation = initialStatusFilter === 'draft' || initialStatusFilter === 'quotation';
  const displayTitle = title || (initialStatusFilter === 'quotation' ? 'List Quotations' : initialStatusFilter === 'draft' ? 'List Drafts' : isPosOnly ? 'List POS Sale' : 'Sales & Commercial Invoices');
  const finalAddLabel = addBtnLabel || '+ Add Sale';
  const finalAddAction = onAddBtnClick || openAddSalePage;

  return (
    <div className="p-3 sm:p-6 pb-20 sm:pb-16 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0 flex-shrink-0">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 transition-colors duration-300 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Receipt className={`w-5 h-5 ${isPosOnly ? 'text-emerald-400' : 'text-indigo-400'}`} />
              <span>{displayTitle}</span>
            </h1>
            <NetworkSyncStatusBadge onClick={() => setShowOfflineModal(true)} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isPosOnly
              ? 'Recorded transactions, payments, and thermal receipts generated exclusively from the cash register POS terminal.'
              : 'Browse all completed customer invoices, offline queued payments, quotations, and commercial sales.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {offlineQueue.length > 0 && (
            <button
              id="sales-view-offline-queue-btn"
              onClick={() => setShowOfflineModal(true)}
              className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Queue ({offlineQueue.length})</span>
            </button>
          )}

          <button
            id="sales-add-sale-btn"
            onClick={finalAddAction}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{finalAddLabel}</span>
          </button>

          <button
            id="sales-new-pos-sale-btn"
            onClick={onOpenNewSale}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950 flex items-center gap-2 transition"
          >
            <Receipt className="w-4 h-4" />
            <span>POS Terminal</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between transition-colors shadow-sm">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Total Revenue Invoiced</div>
            <div className="text-xl font-extrabold text-white font-mono mt-1">
              {formatCurrency(totalSalesRevenue, settings)}
            </div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between transition-colors shadow-sm">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Total Invoices Issued</div>
            <div className="text-xl font-extrabold text-white font-mono mt-1">
              {salesList.length} Transactions
            </div>
          </div>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between transition-colors shadow-sm">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Pending Due Receivables</div>
            <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">
              {formatCurrency(totalDueReceivables, settings)}
            </div>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Column Visibility Section (Above Filters & Table) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm transition-colors duration-300 mb-6 animate-in fade-in slide-in-from-top-2 duration-150">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 bg-slate-950/80 ${showColumnVisibility ? 'border-b border-slate-800' : ''}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
              <Columns className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Column Visibility</span>
                </h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {Object.values(visibleColumns).filter(Boolean).length} of {SALES_COLUMN_DEFINITIONS.length} Visible
                </span>
                {isAuthorizedForColumns ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 hidden sm:inline-flex">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Admin Privileges</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 hidden sm:inline-flex">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Locked</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                Select which columns to display in the Sales transaction table.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
            {showColumnVisibility && (
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  disabled={!isAuthorizedForColumns}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('standard')}
                  disabled={!isAuthorizedForColumns}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('compact')}
                  disabled={!isAuthorizedForColumns}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer hidden sm:inline-block"
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('reset')}
                  disabled={!isAuthorizedForColumns}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-950/50 text-rose-400 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                  title="Reset to default columns"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}
            
            <button
              type="button"
              onClick={() => setShowColumnVisibility(!showColumnVisibility)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                showColumnVisibility 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
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
          <div className="border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 bg-slate-900/50">
            {/* Role restriction notice if non-admin/manager */}
            {!isAuthorizedForColumns && (
              <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center gap-2.5 text-xs text-amber-300">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  You are logged in as <strong>{currentUser?.name || 'Staff'}</strong> ({currentUser?.role || 'user'}). Only <strong>Administrators</strong> and <strong>Store Managers</strong> have permissions to change table column visibility.
                </span>
              </div>
            )}

            {/* Column Toggles Card Grid */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {SALES_COLUMN_DEFINITIONS.map((col) => {
                const isVisible = visibleColumns[col.key];
                const isLocked = col.locked;

                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => toggleColumn(col.key)}
                    disabled={!isAuthorizedForColumns || isLocked}
                    className={`flex flex-col items-start justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isVisible
                        ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-800/40'
                    } ${!isAuthorizedForColumns ? 'cursor-not-allowed' : isLocked ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className={`p-1 rounded-md ${
                        isVisible ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isVisible ? <CheckCircle2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </div>
                      {isLocked ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> FIXED
                        </span>
                      ) : (
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isVisible
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}>
                          {isVisible ? 'SHOWN' : 'HIDDEN'}
                        </span>
                      )}
                    </div>
                    <div className="w-full">
                      <div className={`text-xs font-bold ${isVisible ? 'text-white' : 'text-slate-400'}`}>
                        {col.label}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5 hidden sm:block">
                        {col.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Unified Attached Container for Filters & Sales Table (Zero Gap) */}
      <div className="shadow-sm">
        {/* Filter Bar (Attached to Table Top) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-t-2xl border border-b-0 border-slate-800 transition-colors flex-wrap">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number or customer name..."
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          {/* Page size filter (Light Mode Only) */}
          {isLight && (
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer transition-colors"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          )}

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors"
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Paid in Full</option>
            <option value="partial">Partial Payment</option>
            <option value="due">Credit / Due</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors"
          >
            <option value="all">All Document Types</option>
            <option value="final">Final Sale Invoices</option>
            <option value="draft">Quotations / Drafts</option>
          </select>

          <div className="pl-2 border-l border-slate-800 ml-1 flex items-center">
            <ExportButtons
              headers={[
                'Invoice No',
                'Date',
                'Customer',
                'Location',
                'Total Amount',
                'Paid Amount',
                'Due Amount',
                'Payment Status',
                'Payment Method',
                'Document Status',
              ]}
              keys={[
                'invoiceNo',
                'date',
                'customerName',
                'locationName',
                'totalAmount',
                'paidAmount',
                'dueAmount',
                'paymentStatus',
                'paymentMethodStr',
                'status',
              ]}
              data={salesExportData}
              filename="sales_list"
              title={displayTitle}
              isLight={isLight}
            />
          </div>
        </div>
      </div>

      {/* Sales Invoices Table (Attached Directly with Zero Gap) */}
      <div className="bg-slate-900 rounded-b-2xl border border-slate-800 w-full max-w-full overflow-hidden min-w-0 shadow-sm transition-colors duration-300">
        <div className="overflow-x-auto scrollbar-thin overscroll-x-contain w-full max-w-full">
          <table className="w-full min-w-[950px] text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                {visibleColumns.date && <th className="py-3 px-3">Date</th>}
                {visibleColumns.referenceNo && <th className="py-3 px-3">Reference No</th>}
                {visibleColumns.customerName && <th className="py-3 px-3">Customer Name</th>}
                {isDraftOrQuotation && (
                  <th className="py-3 px-3">Contact Number</th>
                )}
                {visibleColumns.location && <th className="py-3 px-3">Location</th>}
                {!isDraftOrQuotation ? (
                  <>
                    {visibleColumns.paymentStatus && <th className="py-3 px-3 text-center">Payment Status</th>}
                    {visibleColumns.paymentMethod && <th className="py-3 px-3 text-center">Payment Method</th>}
                    {visibleColumns.salesRep && settings.salesCommissionAgent && settings.salesCommissionAgent !== 'disable' && (
                      <th className="py-3 px-3">Sales Rep</th>
                    )}
                    {visibleColumns.totalAmount && <th className="py-3 px-3 text-right">Total Amount</th>}
                    {visibleColumns.totalPaid && <th className="py-3 px-3 text-right">Total Paid</th>}
                    {visibleColumns.sellDue && <th className="py-3 px-3 text-right">Sell Due</th>}
                  </>
                ) : (
                  <>
                    <th className="py-3 px-3 text-center">Total Items</th>
                    <th className="py-3 px-3">Added By</th>
                  </>
                )}
                {visibleColumns.action && <th className="py-3 px-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-200">
              {Object.values(visibleColumns).filter(Boolean).length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                    No columns selected. Click the <span className="font-bold text-indigo-400">Columns</span> dropdown above to select table columns to display.
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => {
                  const customer = customers.find((c) => c.id === sale.customerId);
                  const location = locations?.find((l) => l.id === sale.locationId);
                  const effectivePaid = getEffectivePaidAmount(sale);
                  const effectiveTotal = Number(sale.totalAmount || 0);
                  const due = Math.max(0, effectiveTotal - effectivePaid);
                  const effectivePaymentStatus = getEffectivePaymentStatus(sale);
                  const isItemOffline = sale.isOffline || sale.syncStatus === 'pending';
                  
                  // Get primary payment method if available
                  let paymentMethodStr = 'N/A';
                  if (sale.paymentEntries && sale.paymentEntries.length > 0) {
                    const methods = sale.paymentEntries.map(p => p.method);
                    paymentMethodStr = [...new Set(methods)].map((m: string) => m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')).join(', ');
                  }

                  return (
                    <tr key={sale.id} className="hover:bg-slate-850 transition-colors border-b border-slate-800">
                      {visibleColumns.date && <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{sale.date}</td>}
                      {visibleColumns.referenceNo && (
                        <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{sale.invoiceNo}</span>
                            {isItemOffline && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Offline Queue" />
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.customerName && (
                        <td className="py-3 px-3 font-semibold text-slate-200">
                          {customer?.name || 'Walk-In Customer'}
                        </td>
                      )}
                      {isDraftOrQuotation && (
                        <td className="py-3 px-3 text-slate-300">
                          {customer?.mobile || '--'}
                        </td>
                      )}
                      {visibleColumns.location && (
                        <td className="py-3 px-3 text-slate-300">
                          {location?.name || 'Main Location'}
                        </td>
                      )}
                      {!isDraftOrQuotation ? (
                        <>
                          {visibleColumns.paymentStatus && (
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => setSelectedPaymentSale(sale)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition hover:opacity-80 cursor-pointer ${
                                  effectivePaymentStatus === 'paid'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : effectivePaymentStatus === 'partial'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                                }`}
                                title="Click to view payments"
                              >
                                {effectivePaymentStatus}
                              </button>
                            </td>
                          )}
                          {visibleColumns.paymentMethod && (
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1 text-slate-300 text-xs">
                                {paymentMethodStr.toLowerCase().includes('cash') && <Banknote className="w-3.5 h-3.5 text-emerald-400" />}
                                {paymentMethodStr.toLowerCase().includes('card') && <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                                {paymentMethodStr.toLowerCase().includes('bank') && <Landmark className="w-3.5 h-3.5 text-indigo-400" />}
                                <span>{paymentMethodStr}</span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.salesRep && settings.salesCommissionAgent && settings.salesCommissionAgent !== 'disable' && (
                            <td className="py-3 px-3 text-slate-300">
                              {sale.commissionAgentName ? (
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-200">{sale.commissionAgentName}</span>
                                  <span className="text-[10px] text-emerald-400 font-mono">
                                    {sale.commissionPercentage}% ({formatCurrency(sale.commissionAmount || 0, settings)})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">None</span>
                              )}
                            </td>
                          )}
                          {visibleColumns.totalAmount && (
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                              {formatCurrency(sale.totalAmount, settings)}
                            </td>
                          )}
                          {visibleColumns.totalPaid && (
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                              {formatCurrency(effectivePaid, settings)}
                            </td>
                          )}
                          {visibleColumns.sellDue && (
                            <td className={`py-3 px-3 text-right font-mono font-bold ${due > 0.005 ? 'text-rose-400' : 'text-slate-400'}`}>
                              {formatCurrency(due, settings)}
                            </td>
                          )}
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-3 text-center font-mono text-slate-300">
                            {sale.items.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {sale.cashierName || 'Admin'}
                          </td>
                        </>
                      )}
                      {visibleColumns.action && (
                        <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDetailsSale(sale)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="View Sale Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isDraftOrQuotation ? (
                          <button
                            onClick={() => {
                              openEditSalePage({
                                ...sale,
                                status: 'final',
                                invoiceNo: sale.invoiceNo.replace(/^(Q|DRF)-/, 'INV-')
                              });
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-colors"
                            title="Convert to Final Sale"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTab('add_sale_return')}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-colors"
                            title="Return Product"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditSalePage(sale)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors"
                          title="Edit Sale"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {(effectivePaymentStatus === 'partial' || effectivePaymentStatus === 'due') && (
                          <button
                            onClick={() => setSelectedPaymentSale(sale)}
                            className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-colors"
                            title="Add Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onOpenReceipt(sale)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors"
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(sale.id)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-rose-400 hover:text-rose-400 rounded-lg transition-colors"
                          title="Delete Sale"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    )}
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 px-4 py-3 border border-slate-800 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-400 font-medium text-center sm:text-left">
            Showing <span className="font-bold text-white">{Math.min((currentPage - 1) * pageSize + 1, filteredSales.length)}</span> to <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredSales.length)}</span> of <span className="font-bold text-white">{filteredSales.length}</span> entries
          </div>
          <div className="flex items-center justify-center gap-2">
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

      {/* Delete Sale Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Sale Invoice</h3>
                <p className="text-xs text-slate-400">This action will reverse inventory deduction if final.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete this sale transaction? Stock quantities will be returned to inventory.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteSale(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Sync Manager Modal */}
      <OfflineSyncManagerModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
      />

      {/* View Payments Modal */}
      <ViewPaymentsModal
        isOpen={!!selectedPaymentSale}
        sale={transactions.find((t) => t.id === selectedPaymentSale?.id) || selectedPaymentSale}
        onClose={() => setSelectedPaymentSale(null)}
        onOpenReceipt={onOpenReceipt}
      />

      {/* View Sale Details Modal */}
      <ViewSaleDetailsModal
        isOpen={!!selectedDetailsSale}
        sale={transactions.find((t) => t.id === selectedDetailsSale?.id) || selectedDetailsSale}
        onClose={() => setSelectedDetailsSale(null)}
        onOpenReceipt={onOpenReceipt}
      />
    </div>
  );
};
