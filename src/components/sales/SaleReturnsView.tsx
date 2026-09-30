import { formatCurrency } from '../../utils/formatters';
import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { Transaction } from '../../types/erp';
import { ViewSaleReturnDetailsModal } from './ViewSaleReturnDetailsModal';
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
  CreditCard,
  Banknote,
  Landmark,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SaleReturnsViewProps {
  onOpenReceipt: (sale: Transaction) => void;
  onOpenNewSaleReturn?: () => void;
  isPosOnly?: boolean;
}

export const SaleReturnsView: React.FC<SaleReturnsViewProps> = ({ onOpenReceipt, onOpenNewSaleReturn, isPosOnly = false }) => {
  const {
    transactions,
    customers,
    settings,
    setActiveTab,
    locations,
    openAddSalePage,
    openEditSalePage,
    openViewSalePage,
    deleteSale,
    hasPermission
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedDetailsSale, setSelectedDetailsSale] = useState<Transaction | null>(null);

  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const salesList = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'sell_return') return false;
      const isPosTx = t.isPos === true || t.saleChannel === 'pos' || (t.invoiceNo && t.invoiceNo.toUpperCase().startsWith('POS'));
      return isPosOnly ? isPosTx : !isPosTx;
    });
  }, [transactions, isPosOnly]);

  const filteredSales = useMemo(() => {
    return salesList.filter((s) => {
      const customer = customers.find((c) => c.id === s.customerId);
      const matchSearch =
        s.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchPayment = paymentFilter === 'all' || s.paymentStatus === paymentFilter;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchPayment && matchStatus;
    });
  }, [salesList, customers, searchQuery, paymentFilter, statusFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, paymentFilter, statusFilter, pageSize]);

  const totalPages = Math.ceil(filteredSales.length / pageSize);

  const paginatedSales = useMemo(() => {
    if (!isLight) return filteredSales;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSales.slice(startIndex, startIndex + pageSize);
  }, [filteredSales, isLight, currentPage, pageSize]);

  const totalSalesRevenue = salesList.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalDueReceivables = salesList.reduce(
    (sum, s) => sum + Math.max(0, s.totalAmount - s.paidAmount),
    0
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Receipt className="text-indigo-400" />
              <span>Sale Returns</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse and manage all customer product returns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="sales-add-sale-return-btn"
            onClick={onOpenNewSaleReturn}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Sale Return</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Total Returns</div>
            <div className="text-xl font-extrabold text-white font-mono mt-1">
              {formatCurrency(totalSalesRevenue, settings)}
            </div>
          </div>
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
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

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
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

      {/* Unified Attached Container for Filters & Sale Return Table (Zero Gap) */}
      <div className="shadow-sm">
        {/* Filter Bar (Attached to Table Top) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-t-2xl border border-b-0 border-slate-800 flex-wrap">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number or customer name..."
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          {/* Page size filter (Light Mode Only) */}
          {isLight && (
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          )}

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Paid in Full</option>
            <option value="partial">Partial Payment</option>
            <option value="due">Credit / Due</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
          >
            <option value="all">All Document Types</option>
            <option value="final">Final Sale Invoices</option>
            <option value="draft">Quotations / Drafts</option>
          </select>
        </div>
      </div>

      {/* Sales Invoices Table (Attached Directly with Zero Gap) */}
      <div className="bg-slate-900 rounded-b-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin touch-pan-x">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Reference No</th>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 text-center">Payment Status</th>
                <th className="py-3 px-3 text-center">Payment Method</th>
                <th className="py-3 px-3 text-right">Return Amount</th>
                <th className="py-3 px-3 text-right">Total Paid</th>
                <th className="py-3 px-3 text-right">Sell Due</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {paginatedSales.map((sale) => {
                const customer = customers.find((c) => c.id === sale.customerId);
                const location = locations?.find((l) => l.id === sale.locationId);
                const due = Math.max(0, sale.totalAmount - sale.paidAmount);
                const isItemOffline = sale.isOffline || sale.syncStatus === 'pending';
                
                // Get primary payment method if available
                let paymentMethodStr = 'N/A';
                if (sale.paymentEntries && sale.paymentEntries.length > 0) {
                  const methods = sale.paymentEntries.map(p => p.method);
                  paymentMethodStr = [...new Set(methods)].map((m: string) => m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')).join(', ');
                }

                return (
                  <tr key={sale.id} className="hover:bg-slate-850 transition">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{sale.date}</td>
                    <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{sale.invoiceNo}</span>
                        {isItemOffline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Offline Queue" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {customer?.name || 'Walk-In Customer'}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {location?.name || 'Main Location'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          sale.paymentStatus === 'paid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : sale.paymentStatus === 'partial'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-300 text-xs">
                        {paymentMethodStr.toLowerCase().includes('cash') && <Banknote className="w-3.5 h-3.5 text-emerald-400" />}
                        {paymentMethodStr.toLowerCase().includes('card') && <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                        {paymentMethodStr.toLowerCase().includes('bank') && <Landmark className="w-3.5 h-3.5 text-indigo-400" />}
                        <span>{paymentMethodStr}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                      {formatCurrency(sale.totalAmount, settings)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(sale.paidAmount, settings)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                      {formatCurrency(due, settings)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDetailsSale(sale)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          title="View Return Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditSalePage(sale)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                          title="Edit Sale"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenReceipt(sale)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition"
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(sale.id)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-rose-400 rounded-lg transition"
                          title="Delete Sale"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Pagination Footer (Light Mode Only) */}
      {isLight && totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border border-slate-800 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-400 font-medium">
            Showing <span className="font-bold text-white">{Math.min((currentPage - 1) * pageSize + 1, filteredSales.length)}</span> to <span className="font-bold text-white">{Math.min(currentPage * pageSize, filteredSales.length)}</span> of <span className="font-bold text-white">{filteredSales.length}</span> entries
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

      {/* View Sale Return Details Modal */}
      <ViewSaleReturnDetailsModal
        isOpen={!!selectedDetailsSale}
        sale={selectedDetailsSale}
        onClose={() => setSelectedDetailsSale(null)}
        onOpenReceipt={onOpenReceipt}
      />
    </div>
  );
};
