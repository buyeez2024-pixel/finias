import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { ExportButtons } from '../common/ExportButtons';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  DollarSign,
  Clock,
  FileText,
  Package,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Columns,
  RotateCcw,
  ShieldCheck,
  Eye,
  Lock,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  AlertTriangle,
  AlertCircle,
  Ban,
  ArrowRight,
  LayoutGrid,
  Table as TableIcon,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ViewPurchasePaymentsModal } from './ViewPurchasePaymentsModal';
import { ViewPurchaseDetailsModal } from './ViewPurchaseDetailsModal';
import { ImportPurchasesPage } from './ImportPurchasesPage';
import { Transaction } from '../../types/erp';

interface PurchasesViewProps {
  onOpenNewPurchase: () => void;
  onOpenImportPurchases?: () => void;
}

interface PurchaseColumnVisibility {
  invoiceNo: boolean;
  date: boolean;
  supplierName: boolean;
  receivingBranch: boolean;
  globalLotNumber: boolean;
  itemsOrdered: boolean;
  grandTotal: boolean;
  paymentDue: boolean;
  orderStatus: boolean;
  paymentStatus: boolean;
  addedBy: boolean;
  action: boolean;
}

const DEFAULT_PURCHASE_COLUMNS: PurchaseColumnVisibility = {
  invoiceNo: true,
  date: true,
  supplierName: true,
  receivingBranch: true,
  globalLotNumber: true,
  itemsOrdered: true,
  grandTotal: true,
  paymentDue: true,
  orderStatus: true,
  paymentStatus: true,
  addedBy: true,
  action: true,
};

interface PurchaseColumnOption {
  key: keyof PurchaseColumnVisibility;
  label: string;
  category: 'General' | 'Financial Metrics' | 'Order Progress & Users';
  description: string;
  locked?: boolean;
}

const PURCHASE_COLUMN_DEFINITIONS: PurchaseColumnOption[] = [
  { key: 'invoiceNo', label: 'PO Invoice No.', category: 'General', description: 'Unique Purchase Order reference number', locked: true },
  { key: 'date', label: 'Date', category: 'General', description: 'Date when the purchase was added' },
  { key: 'supplierName', label: 'Supplier Name', category: 'General', description: 'Selected merchant or vendor supplier' },
  { key: 'receivingBranch', label: 'Receiving Branch', category: 'General', description: 'Store location receiving the stock' },
  { key: 'globalLotNumber', label: 'Global Lot Number', category: 'General', description: 'Batch/Lot Number assigned to the purchase' },
  { key: 'itemsOrdered', label: 'Items Ordered', category: 'General', description: 'Total number of items in the order' },
  { key: 'grandTotal', label: 'Grand Total', category: 'Financial Metrics', description: 'Total bill amount after taxes and discount' },
  { key: 'paymentDue', label: 'Payment Due', category: 'Financial Metrics', description: 'Outstanding unpaid balance due to vendor' },
  { key: 'orderStatus', label: 'Order Status', category: 'Order Progress & Users', description: 'Order delivery status (e.g. Ordered, Received)' },
  { key: 'paymentStatus', label: 'Payment Status', category: 'Order Progress & Users', description: 'Financial settlement progress' },
  { key: 'addedBy', label: 'Added By', category: 'Order Progress & Users', description: 'User or representative who entered it' },
  { key: 'action', label: 'Action Buttons', category: 'Order Progress & Users', description: 'View, edit, pay, or delete purchase order', locked: true },
];

export const PurchasesView: React.FC<PurchasesViewProps> = ({ onOpenNewPurchase, onOpenImportPurchases }) => {
  const { 
    transactions, 
    suppliers, 
    locations, 
    settings, 
    receivePurchaseOrder,
    openEditPurchasePage,
    openViewPurchasePage,
    deletePurchase,
    updatePurchaseSupplier,
    splitPurchaseItems,
    currentUser,
    users
  } = useErp();

  const [showImportPage, setShowImportPage] = useState(false);
  const [editingSupplierPo, setEditingSupplierPo] = useState<Transaction | null>(null);
  const [deleteTargetPo, setDeleteTargetPo] = useState<Transaction | null>(null);
  const [selectedNewSupplierId, setSelectedNewSupplierId] = useState<string>('');
  const [itemSupplierAssignments, setItemSupplierAssignments] = useState<Record<number, string>>({});

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supreme_admin';
  const isManager = currentUser?.role === 'manager';
  const isAuthorizedForColumns = !currentUser || isAdmin || isManager;
  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');
  const [activeSwipeIndex, setActiveSwipeIndex] = useState(0);

  const [showColumnVisibility, setShowColumnVisibility] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<PurchaseColumnVisibility>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_purchase_columns_visibility');
      if (saved) {
        try {
          return { ...DEFAULT_PURCHASE_COLUMNS, ...JSON.parse(saved) };
        } catch (e) {
          // ignore
        }
      }
    }
    return DEFAULT_PURCHASE_COLUMNS;
  });

  const toggleColumn = (key: keyof PurchaseColumnVisibility) => {
    if (key === 'invoiceNo' || key === 'action') return; // Fixed columns
    if (!isAuthorizedForColumns) return;
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('erp_purchase_columns_visibility', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleApplyPreset = (preset: 'all' | 'standard' | 'compact' | 'reset') => {
    if (!isAuthorizedForColumns) return;
    let next: PurchaseColumnVisibility;
    switch (preset) {
      case 'all':
        next = {
          invoiceNo: true, date: true, supplierName: true, receivingBranch: true,
          globalLotNumber: true,
          itemsOrdered: true, grandTotal: true, paymentDue: true, orderStatus: true,
          paymentStatus: true, addedBy: true, action: true
        };
        break;
      case 'standard':
        next = {
          invoiceNo: true, date: true, supplierName: true, receivingBranch: true,
          globalLotNumber: true,
          itemsOrdered: false, grandTotal: true, paymentDue: false, orderStatus: true,
          paymentStatus: true, addedBy: false, action: true
        };
        break;
      case 'compact':
        next = {
          invoiceNo: true, date: true, supplierName: true, receivingBranch: false,
          globalLotNumber: false,
          itemsOrdered: false, grandTotal: true, paymentDue: false, orderStatus: false,
          paymentStatus: true, addedBy: false, action: true
        };
        break;
      case 'reset':
      default:
        next = { ...DEFAULT_PURCHASE_COLUMNS };
        break;
    }
    setVisibleColumns(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp_purchase_columns_visibility', JSON.stringify(next));
    }
  };

  const [selectedPaymentPurchase, setSelectedPaymentPurchase] = useState<Transaction | null>(null);
  const [selectedDetailsPurchase, setSelectedDetailsPurchase] = useState<Transaction | null>(null);

  const purchaseList = useMemo(() => {
    return transactions.filter((t) => t.type === 'purchase');
  }, [transactions]);

  const resolveSupplierForPurchase = (p: Transaction) => {
    // 1. Name match if p.supplierName is provided
    if (p.supplierName) {
      const nameMatch = suppliers.find((s) => 
        (s.name && s.name.trim().toLowerCase() === p.supplierName.trim().toLowerCase()) ||
        (s.businessName && s.businessName.trim().toLowerCase() === p.supplierName.trim().toLowerCase())
      );
      if (nameMatch) return nameMatch;
    }

    // 2. Direct ID match
    if (p.supplierId) {
      const idMatch = suppliers.find((s) => s.id === p.supplierId);
      if (idMatch) return idMatch;
    }

    // 3. Check items if item has supplierName or supplierId
    if (p.items && p.items.length > 0) {
      for (const item of p.items) {
        if ((item as any).supplierName) {
          const itemSupp = suppliers.find((s) => 
            (s.name && s.name.trim().toLowerCase() === (item as any).supplierName.trim().toLowerCase()) ||
            (s.businessName && s.businessName.trim().toLowerCase() === (item as any).supplierName.trim().toLowerCase())
          );
          if (itemSupp) return itemSupp;
        }
        if ((item as any).supplierId) {
          const itemSupp = suppliers.find((s) => s.id === (item as any).supplierId);
          if (itemSupp) return itemSupp;
        }
      }
    }
    return undefined;
  };

  const filteredPurchases = useMemo(() => {
    return purchaseList.filter((p) => {
      const supplier = resolveSupplierForPurchase(p);
      const supplierDisplayName = p.supplierName || supplier?.name || (p.items?.[0] as any)?.supplierName || '';
      const matchSearch =
        p.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplierDisplayName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [purchaseList, suppliers, searchQuery, statusFilter]);

  const purchasesExportData = useMemo(() => {
    return filteredPurchases.map((p) => {
      const supplier = resolveSupplierForPurchase(p);
      const location = locations?.find((l) => l.id === p.locationId);
      const due = Math.max(0, p.totalAmount - p.paidAmount);
      let paymentMethodStr = 'N/A';
      if (p.paymentEntries && p.paymentEntries.length > 0) {
        const methods = p.paymentEntries.map(pt => pt.method);
        paymentMethodStr = [...new Set(methods)].map((m: string) => m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')).join(', ');
      }
      return {
        ...p,
        date: formatDate(p.date, settings.dateFormat || 'DD-MM-YYYY', settings.timeZone),
        supplierName: p.supplierName || supplier?.name || (p.items?.[0] as any)?.supplierName || 'Walk-In Supplier',
        receivingBranch: location?.name || 'Main Location',
        dueAmount: due,
        paymentMethodStr,
      };
    });
  }, [filteredPurchases, suppliers, locations, settings]);

  // Reset pagination on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  const totalPages = Math.ceil(filteredPurchases.length / pageSize);

  const paginatedPurchases = useMemo(() => {
    if (!isLight) return filteredPurchases;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPurchases.slice(startIndex, startIndex + pageSize);
  }, [filteredPurchases, isLight, currentPage, pageSize]);

  const totalPurchasesAmount = purchaseList.reduce((sum, p) => sum + p.totalAmount, 0);
  const pendingPurchasesCount = purchaseList.filter((p) => p.status !== 'received').length;

  if (showImportPage) {
    return <ImportPurchasesPage onBack={() => setShowImportPage(false)} />;
  }

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto min-w-0 w-full max-w-full overflow-x-hidden pb-28">
      {/* Header & KPI */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border shadow-sm w-full min-w-0 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="min-w-0 w-full sm:w-auto">
          <h1 className={`text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Truck className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="truncate">Purchases & Inward Orders</span>
          </h1>
          <p className={`text-xs mt-0.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Manage vendor purchase orders, receive shipments, and update warehouse stock balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            id="purchases-import-btn"
            onClick={() => {
              if (onOpenImportPurchases) {
                onOpenImportPurchases();
              } else {
                setShowImportPage(true);
              }
            }}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
            title="Bulk Import Purchases from Excel or CSV"
          >
            <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Import Purchases</span>
          </button>

          <button
            id="purchases-add-order-btn"
            onClick={onOpenNewPurchase}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ New Purchase</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full min-w-0">
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm min-w-0 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="min-w-0">
            <div className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total Purchases Value</div>
            <div className="text-lg sm:text-xl font-extrabold font-mono mt-1 truncate">
              {formatCurrency(totalPurchasesAmount, settings)}
            </div>
          </div>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm min-w-0 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="min-w-0">
            <div className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Purchase Invoices</div>
            <div className="text-lg sm:text-xl font-extrabold font-mono mt-1 truncate">
              {purchaseList.length} Invoices
            </div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm min-w-0 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="min-w-0">
            <div className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pending Inward Receipts</div>
            <div className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono mt-1 truncate">
              {pendingPurchasesCount} Orders
            </div>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Column Visibility Section (Above Filters & Table) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm transition-colors duration-300 animate-in fade-in slide-in-from-top-2 duration-150">
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
                  {Object.values(visibleColumns).filter(Boolean).length} of {PURCHASE_COLUMN_DEFINITIONS.length} Visible
                </span>
                {isAuthorizedForColumns ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Admin & Store Manager Privileges</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Locked ({currentUser?.role || 'Staff'})</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Select which columns to display in the Purchases transaction table below.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
            {showColumnVisibility && (
              <div className="flex items-center flex-wrap gap-1.5 mr-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 hidden sm:inline">
                  Presets:
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  disabled={!isAuthorizedForColumns}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  All Visible
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
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('reset')}
                  disabled={!isAuthorizedForColumns}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-rose-950/50 text-rose-400 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                  title="Reset to default columns"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
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

            {/* Column Toggles Grid */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {PURCHASE_COLUMN_DEFINITIONS.map((col) => {
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
                          <Lock className="w-2.5 h-2.5" /> Fixed
                        </span>
                      ) : (
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isVisible
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}>
                          {isVisible ? 'Shown' : 'Hidden'}
                        </span>
                      )}
                    </div>
                    <div className="w-full">
                      <div className={`text-xs font-bold ${isVisible ? 'text-white' : 'text-slate-400'}`}>
                        {col.label}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
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

      {/* Unified Attached Container for Filters & Purchases Table (Zero Gap) */}
      <div className="shadow-sm">
        {/* Filter Bar (Attached to Table Top) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-t-2xl border border-b-0 border-slate-800 transition-colors w-full min-w-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PO number or supplier name..."
              className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
            {/* Mobile View Toggle */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 md:hidden">
              <button
                type="button"
                onClick={() => setMobileViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                  mobileViewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                  mobileViewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            {isLight && (
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            )}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors"
            >
              <option value="all">All Order Status</option>
              <option value="received">Received / Stocked</option>
              <option value="pending">Pending Inward</option>
              <option value="ordered">Ordered</option>
            </select>

            <div className="pl-2 border-l border-slate-800 ml-1 flex items-center gap-2">
              <ExportButtons
                headers={[
                  'Invoice No',
                  'Date',
                  'Supplier Name',
                  'Receiving Location',
                  'Total Amount',
                  'Paid Amount',
                  'Due Amount',
                  'Order Status',
                  'Payment Status',
                ]}
                keys={[
                  'invoiceNo',
                  'date',
                  'supplierName',
                  'receivingBranch',
                  'totalAmount',
                  'paidAmount',
                  'dueAmount',
                  'status',
                  'paymentStatus',
                ]}
                data={purchasesExportData}
                filename="purchases_list"
                title="Purchases List"
                isLight={isLight}
              />

              <button
                type="button"
                id="purchases-toolbar-import-btn"
                onClick={() => {
                  if (onOpenImportPurchases) {
                    onOpenImportPurchases();
                  } else {
                    setShowImportPage(true);
                  }
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                title="Bulk Import Purchases from File"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Import</span>
              </button>
            </div>
          </div>
        </div>

        {/* Purchases Table & Mobile Touch Cards */}
        <div className="bg-slate-900 rounded-b-2xl border border-slate-800 overflow-hidden shadow-sm transition-colors duration-300 w-full min-w-0">
          {/* Mobile Touch Cards View */}
          {mobileViewMode === 'cards' && (
            <div className="md:hidden p-3.5 space-y-3">
              {paginatedPurchases.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No purchase orders found matching filter criteria.
                </div>
              ) : (
                paginatedPurchases.map((po, idx) => {
                  const supplier = resolveSupplierForPurchase(po);
                  const displaySupplierName = po.supplierName || supplier?.name || 'Walk-In Supplier';
                  const location = locations.find((l) => l.id === po.locationId);
                  const paymentStatus = po.paymentStatus || 'paid';
                  const due = Math.max(0, po.totalAmount - (po.paidAmount || 0));

                  return (
                    <div
                      key={po.id}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm space-y-3 transition active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">{po.invoiceNo}</span>
                          {po.lotNumber && (
                            <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                              {po.lotNumber}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            po.status === 'received'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {po.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1 border-t border-b border-slate-800/80 py-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Supplier:</span>
                          <span className="font-semibold text-white">{displaySupplierName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Location:</span>
                          <span className="text-slate-300">{location?.name || 'Main Location'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Date:</span>
                          <span className="font-mono text-slate-300">{formatDate(po.date, settings.dateFormat || 'DD-MM-YYYY', settings.timeZone)}</span>
                        </div>
                        <div className="flex justify-between pt-1 font-bold">
                          <span className="text-slate-400">Grand Total:</span>
                          <span className="font-mono text-emerald-400 text-sm">{formatCurrency(po.totalAmount, settings)}</span>
                        </div>
                        {due > 0 && (
                          <div className="flex justify-between text-xs text-rose-400">
                            <span>Balance Due:</span>
                            <span className="font-mono font-bold">{formatCurrency(due, settings)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => setSelectedPaymentPurchase(po)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition border ${
                            paymentStatus === 'paid'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : paymentStatus === 'partial'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                              : 'bg-rose-950/80 text-rose-300 border-rose-800'
                          }`}
                        >
                          {paymentStatus}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openViewPurchasePage(po)}
                            className="p-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs hover:text-white"
                            title="View PO Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => openEditPurchasePage(po)}
                              className="p-1.5 bg-slate-800 text-amber-400 rounded-lg text-xs"
                              title="Edit PO"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {po.status !== 'received' && (
                            <button
                              onClick={() => receivePurchaseOrder(po.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md shadow-emerald-950"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Receive</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Desktop Table & Mobile Scrollable Table */}
          <div className={`${mobileViewMode === 'cards' ? 'hidden md:block' : 'block'} overflow-x-auto w-full min-w-0 scrollbar-thin`}>
            <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                {visibleColumns.invoiceNo && <th className="py-3 px-3">PO Invoice No.</th>}
                {visibleColumns.date && <th className="py-3 px-3">Date</th>}
                {visibleColumns.supplierName && <th className="py-3 px-3">Supplier Name</th>}
                {visibleColumns.receivingBranch && <th className="py-3 px-3">Receiving Branch</th>}
                {visibleColumns.globalLotNumber && <th className="py-3 px-3">Global Lot Number</th>}
                {visibleColumns.itemsOrdered && <th className="py-3 px-3">Items Ordered</th>}
                {visibleColumns.grandTotal && <th className="py-3 px-3 text-right">Grand Total</th>}
                {visibleColumns.paymentDue && <th className="py-3 px-3 text-right">Payment Due</th>}
                {visibleColumns.orderStatus && <th className="py-3 px-3 text-center">Order Status</th>}
                {visibleColumns.paymentStatus && <th className="py-3 px-3 text-center">Payment Status</th>}
                {visibleColumns.addedBy && <th className="py-3 px-3">Added By</th>}
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
                paginatedPurchases.map((po) => {
                const supplier = resolveSupplierForPurchase(po);
                const displaySupplierName = po.supplierName || supplier?.name || (po.items?.[0] as any)?.supplierName || 'Walk-In Supplier';
                const location = locations.find((l) => l.id === po.locationId);
                const paymentStatus = po.paymentStatus || 'paid';
                const due = Math.max(0, po.totalAmount - (po.paidAmount || 0));
                const addedByUser = users?.find((u) => u.id === (po as any).createdById || u.id === (po as any).userId || u.name === po.cashierName);
                const addedByName = addedByUser?.name || po.cashierName || currentUser?.name || 'Admin';

                return (
                  <tr key={po.id} className="hover:bg-slate-850 transition-colors border-b border-slate-800">
                    {visibleColumns.invoiceNo && <td className="py-3 px-3 font-mono font-bold text-white">{po.invoiceNo}</td>}
                    {visibleColumns.date && <td className="py-3 px-3 text-slate-300 font-medium">{formatDate(po.date, settings.dateFormat || 'DD-MM-YYYY', settings.timeZone)}</td>}
                    {visibleColumns.supplierName && (
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 group">
                          <div>
                            <div className="font-semibold text-slate-200">
                              {displaySupplierName}
                            </div>
                            {supplier?.businessName && supplier.businessName !== displaySupplierName && (
                              <div className="text-[10px] text-slate-400">
                                ({supplier.businessName})
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSupplierPo(po);
                              setSelectedNewSupplierId(po.supplierId || supplier?.id || (suppliers[0]?.id ?? ''));
                              setItemSupplierAssignments({});
                            }}
                            className="opacity-40 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition cursor-pointer"
                            title="Rectify / Change Supplier for this purchase order"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                    {visibleColumns.receivingBranch && <td className="py-3 px-3 text-slate-300">{location?.name}</td>}
                    {visibleColumns.globalLotNumber && (
                      <td className="py-3 px-3 font-mono text-slate-300 font-medium">
                        {po.lotNumber ? (
                          <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded text-[11px] font-bold">
                            {po.lotNumber}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.itemsOrdered && (
                      <td className="py-3 px-3 text-slate-300">
                        {po.items.map((i: any, idx: number) => (
                          <div key={idx} className="text-slate-400 flex items-center flex-wrap gap-1">
                            <span>{i.productName} ({i.quantity} pcs @ {formatCurrency(i.unitPrice, settings)})</span>
                            {Boolean(i.returnedQuantity && i.returnedQuantity > 0) && (
                              <span className="text-[10px] text-rose-400 font-semibold bg-rose-950/60 border border-rose-900/60 px-1.5 py-0.2 rounded">
                                ({i.returnedQuantity} returned)
                              </span>
                            )}
                          </div>
                        ))}
                      </td>
                    )}
                    {visibleColumns.grandTotal && (
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-white text-sm">
                        {formatCurrency(po.totalAmount, settings)}
                      </td>
                    )}
                    {visibleColumns.paymentDue && (
                      <td className={`py-3 px-3 text-right font-mono font-bold text-xs ${due > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {formatCurrency(due, settings)}
                      </td>
                    )}
                    {visibleColumns.orderStatus && (
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            po.status === 'received'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.paymentStatus && (
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedPaymentPurchase(po)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition hover:opacity-80 cursor-pointer border ${
                            paymentStatus === 'paid'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : paymentStatus === 'partial'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                          title="Click to view payments"
                        >
                          {paymentStatus}
                        </button>
                      </td>
                    )}
                    {visibleColumns.addedBy && (
                      <td className="py-3 px-3 text-slate-300 font-medium whitespace-nowrap">
                        {addedByName}
                      </td>
                    )}
                    {visibleColumns.action && (
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDetailsPurchase(po)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors shadow-sm cursor-pointer"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditPurchasePage(po)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-colors shadow-sm"
                              title="Edit Order"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTargetPo(po)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg transition-colors shadow-sm cursor-pointer"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {po.status !== 'received' && (
                          <button
                            onClick={() => receivePurchaseOrder(po.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md shadow-emerald-950"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Receive</span>
                          </button>
                        )}
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
      {isLight && totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border border-slate-800 rounded-2xl shadow-sm mt-4">
          <div className="text-xs text-slate-400 font-medium">
            Showing <span className="font-bold text-white">{Math.min((currentPage - 1) * pageSize + 1, filteredPurchases.length)}</span> to <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredPurchases.length)}</span> of <span className="font-bold text-white">{filteredPurchases.length}</span> entries
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

      {/* View Purchase Payments Modal */}
      <ViewPurchasePaymentsModal
        isOpen={!!selectedPaymentPurchase}
        purchase={selectedPaymentPurchase}
        onClose={() => setSelectedPaymentPurchase(null)}
        onOpenReceipt={openViewPurchasePage}
      />

      {/* View Purchase Details Modal */}
      <ViewPurchaseDetailsModal
        isOpen={!!selectedDetailsPurchase}
        purchase={selectedDetailsPurchase}
        onClose={() => setSelectedDetailsPurchase(null)}
        onOpenReceipt={openViewPurchasePage}
      />

      {/* Rectify Supplier Modal */}
      {editingSupplierPo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Rectify Supplier Assignment</h3>
                  <p className="text-xs text-slate-400">PO Invoice: <span className="font-mono text-indigo-300 font-semibold">{editingSupplierPo.invoiceNo}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSupplierPo(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Assign Entire Purchase Order to Supplier:
                </label>
                <select
                  value={selectedNewSupplierId}
                  onChange={(e) => setSelectedNewSupplierId(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 text-xs font-medium cursor-pointer"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.businessName && s.businessName !== s.name ? `(${s.businessName})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Choose the correct vendor (e.g. Sri Vijaya Lakshmi Traders, EcoRoast Distributors, Apex Global Supplies).
                </p>
              </div>

              {/* Multi-item Split Option if multiple items exist */}
              {editingSupplierPo.items && editingSupplierPo.items.length > 1 && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      Line Items in this Order ({editingSupplierPo.items.length}):
                    </span>
                    <span className="text-[11px] text-indigo-400 font-medium">
                      Multi-Item Purchase
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {editingSupplierPo.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate text-xs">{item.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.quantity} units @ {formatCurrency(item.unitPrice, settings)}
                          </div>
                        </div>

                        <select
                          value={itemSupplierAssignments[idx] || selectedNewSupplierId}
                          onChange={(e) => setItemSupplierAssignments((prev) => ({ ...prev, [idx]: e.target.value }))}
                          className="bg-slate-950 text-slate-200 text-[11px] px-2 py-1 rounded-lg border border-slate-700 shrink-0 max-w-[170px]"
                        >
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const splits = editingSupplierPo.items.map((item: any, idx: number) => {
                        const targetId = itemSupplierAssignments[idx] || selectedNewSupplierId;
                        const targetSupp = suppliers.find((s) => s.id === targetId);
                        return {
                          itemIndex: idx,
                          supplierId: targetId,
                          supplierName: targetSupp?.name || '',
                        };
                      });
                      splitPurchaseItems(editingSupplierPo.id, splits);
                      setEditingSupplierPo(null);
                    }}
                    className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    Split into Separate POs per Assigned Supplier
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSupplierPo(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetSupp = suppliers.find((s) => s.id === selectedNewSupplierId);
                  updatePurchaseSupplier(editingSupplierPo.id, selectedNewSupplierId, targetSupp?.name);
                  setEditingSupplierPo(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
              >
                Save Supplier Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uniform Delete Confirmation & Quantity Validation Modal */}
      {deleteTargetPo && (() => {
        const deletePoSupplier = resolveSupplierForPurchase(deleteTargetPo);
        const deletePoSupplierName = deleteTargetPo.supplierName || deletePoSupplier?.name || (deleteTargetPo.items?.[0] as any)?.supplierName || 'Walk-In Supplier';
        const netQuantity = (deleteTargetPo.items || []).reduce(
          (sum: number, it: any) => sum + Math.max(0, (Number(it.quantity) || 0) - (Number(it.returnedQuantity) || 0)),
          0
        );
        const hasQuantity = netQuantity > 0;

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              {hasQuantity ? (
                // BLOCKED: Purchase Quantity > 0
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3 text-amber-400">
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Purchase Deletion Blocked</h3>
                        <p className="text-xs text-amber-400/90 font-medium">Purchase quantity is not equal to zero</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetPo(null)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs text-slate-300">
                    <p>
                      Cannot delete Purchase Order <span className="font-mono font-bold text-white">{deleteTargetPo.invoiceNo}</span> from <span className="font-semibold text-indigo-300">{deletePoSupplierName}</span> because its purchase quantity is <span className="font-bold text-amber-400 font-mono text-sm">{netQuantity} units</span>.
                    </p>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Item Quantities in this Purchase:</div>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {deleteTargetPo.items.map((item: any, idx: number) => {
                          const itemNet = Math.max(0, (Number(item.quantity) || 0) - (Number(item.returnedQuantity) || 0));
                          return (
                            <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-900 last:border-0 text-[11px]">
                              <span className="text-slate-300 truncate max-w-[200px]">{item.productName}</span>
                              <span className="font-mono text-slate-400">
                                {item.quantity} ordered {item.returnedQuantity ? `(${item.returnedQuantity} ret)` : ''} &bull; <strong className={itemNet > 0 ? "text-amber-400" : "text-emerald-400"}>{itemNet} active</strong>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-[11px] text-amber-300 leading-relaxed">
                      <strong>Policy:</strong> Until and unless the purchase quantity equals 0, purchase records cannot be deleted to prevent inventory discrepancy. Please process a <strong>Purchase Return</strong> or reduce item quantities to 0 before deleting.
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDeleteTargetPo(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
                    >
                      Close
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          const poToEdit = deleteTargetPo;
                          setDeleteTargetPo(null);
                          openEditPurchasePage(poToEdit);
                        }}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Quantities</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                // ALLOWED: Purchase Quantity === 0
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3 text-rose-400">
                      <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Delete Purchase Order</h3>
                        <p className="text-xs text-slate-400 font-mono">{deleteTargetPo.invoiceNo}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetPo(null)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs text-slate-300">
                    <p>
                      Are you sure you want to permanently delete purchase order <span className="font-mono font-bold text-white">{deleteTargetPo.invoiceNo}</span> from <span className="font-semibold text-indigo-300">{deletePoSupplierName}</span>?
                    </p>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Purchase Date:</span>
                        <span className="text-slate-200">{formatDate(deleteTargetPo.date, settings.dateFormat || 'DD-MM-YYYY', settings.timeZone)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Active Quantity:</span>
                        <span className="text-emerald-400 font-bold font-mono">0 units (Cleared)</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Total Amount:</span>
                        <span className="text-slate-200 font-mono font-bold">{formatCurrency(deleteTargetPo.totalAmount, settings)}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      This action will permanently remove this purchase record and associated ledger entries.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDeleteTargetPo(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deletePurchase(deleteTargetPo.id);
                        setDeleteTargetPo(null);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
