import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { Transaction } from '../../types/erp';
import { Truck, Plus, Search, CheckCircle2, DollarSign, Clock, FileText, Eye, Package, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ViewPurchaseReturnDetailsModal } from './ViewPurchaseReturnDetailsModal';

interface PurchaseReturnsViewProps {
  onOpenNewPurchase: () => void;
}

export const PurchaseReturnsView: React.FC<PurchaseReturnsViewProps> = ({ onOpenNewPurchase }) => {
  const { 
    transactions, 
    suppliers, 
    locations, 
    settings, 
    receivePurchaseOrder,
    openEditPurchasePage,
    openViewPurchasePage,
    deletePurchase,
    currentUser
  } = useErp();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supreme_admin';
  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDetailsPurchase, setSelectedDetailsPurchase] = useState<Transaction | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const purchaseList = useMemo(() => {
    return transactions.filter((t) => t.type === 'purchase_return');
  }, [transactions]);

  const filteredPurchases = useMemo(() => {
    return purchaseList.filter((p) => {
      const supplier = suppliers.find((s) => s.id === p.supplierId);
      const matchSearch =
        p.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (supplier?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [purchaseList, suppliers, searchQuery, statusFilter]);

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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & KPI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-rose-400" />
            <span>Purchase Returns (Debit Notes)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage goods returned to vendors, track debit notes and refunds.
          </p>
        </div>

        <button
          id="purchases-add-return-btn"
          onClick={onOpenNewPurchase}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Return</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Total Returns Value</div>
            <div className="text-xl font-extrabold text-white font-mono mt-1">
              {formatCurrency(totalPurchasesAmount, settings)}
            </div>
          </div>
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Return Invoices</div>
            <div className="text-xl font-extrabold text-white font-mono mt-1">
              {purchaseList.length} Returns
            </div>
          </div>
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Pending Returns</div>
            <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">
              {pendingPurchasesCount} Orders
            </div>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Unified Attached Container for Filters & Purchase Return Table (Zero Gap) */}
      <div className="shadow-sm">
        {/* Filter Bar (Attached to Table Top) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-t-2xl border border-b-0 border-slate-800 transition-colors">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PO number or supplier name..."
              className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
            >
              <option value="all">All Order Status</option>
              <option value="received">Received / Stocked</option>
              <option value="pending">Pending Inward</option>
              <option value="ordered">Ordered</option>
            </select>
          </div>
        </div>

        {/* Purchases Table (Attached Directly with Zero Gap) */}
        <div className="bg-slate-900 rounded-b-2xl border border-slate-800 overflow-hidden shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3 px-3">PO Invoice No.</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Supplier Name</th>
                <th className="py-3 px-3">Receiving Branch</th>
                <th className="py-3 px-3">Items Ordered</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {paginatedPurchases.map((po) => {
                const supplier = suppliers.find((s) => s.id === po.supplierId);
                const location = locations.find((l) => l.id === po.locationId);

                return (
                  <tr key={po.id} className="hover:bg-slate-850 transition">
                    <td className="py-3 px-3 font-mono font-bold text-white">{po.invoiceNo}</td>
                    <td className="py-3 px-3 text-slate-400">{po.date}</td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {supplier?.name} <span className="text-[10px] text-slate-400">({supplier?.businessName})</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{location?.name}</td>
                    <td className="py-3 px-3 text-slate-300">
                      {po.items.map((i, idx) => (
                        <div key={idx} className="text-slate-400">
                          {i.productName} ({i.quantity} pcs @ {formatCurrency(i.unitPrice, settings)})
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-white text-sm">
                      {formatCurrency(po.totalAmount, settings)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          po.status === 'received'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDetailsPurchase(po)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg transition shadow-sm cursor-pointer"
                          title="View Return Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditPurchasePage(po)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition shadow-sm"
                              title="Edit Order"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this purchase order? Inventory stocks will be reversed if already received.')) {
                                  deletePurchase(po.id);
                                }
                              }}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg transition shadow-sm"
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

      {/* View Purchase Return Details Modal */}
      <ViewPurchaseReturnDetailsModal
        isOpen={!!selectedDetailsPurchase}
        purchase={selectedDetailsPurchase}
        onClose={() => setSelectedDetailsPurchase(null)}
        onOpenReceipt={openViewPurchasePage}
      />
    </div>
  );
};
