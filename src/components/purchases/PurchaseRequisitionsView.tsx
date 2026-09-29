import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { PurchaseRequisition, PurchaseRequisitionItem } from '../../types/erp';
import { formatCurrency } from '../../utils/formatters';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  FileText,
  Eye,
  User,
  Building,
  Calendar,
  AlertCircle,
  ArrowRight,
  X,
  Package
} from 'lucide-react';

export const PurchaseRequisitionsView: React.FC = () => {
  const {
    purchaseRequisitions,
    products,
    locations,
    selectedLocationId,
    settings,
    currentUser,
    createPurchaseRequisition,
    deletePurchaseRequisition,
    approvePurchaseRequisition,
    rejectPurchaseRequisition,
    convertRequisitionToPurchase,
    showFlashNotification
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReqDetails, setSelectedReqDetails] = useState<PurchaseRequisition | null>(null);

  // New Requisition Form State
  const [reqLocationId, setReqLocationId] = useState(selectedLocationId);
  const [requestedBy, setRequestedBy] = useState(currentUser?.name || 'Store Staff');
  const [department, setDepartment] = useState('Procurement');
  const [requiredDate, setRequiredDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [reqNotes, setReqNotes] = useState('');
  const [reqItems, setReqItems] = useState<Omit<PurchaseRequisitionItem, 'id'>[]>([]);

  // Item addition state
  const [selectedProdId, setSelectedProdId] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemCost, setItemCost] = useState('0');
  const [itemNote, setItemNote] = useState('');

  const filteredRequisitions = useMemo(() => {
    return purchaseRequisitions.filter((r) => {
      const matchSearch =
        r.requisitionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requestedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.department || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [purchaseRequisitions, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = purchaseRequisitions.length;
    const pending = purchaseRequisitions.filter((r) => r.status === 'pending').length;
    const approved = purchaseRequisitions.filter((r) => r.status === 'approved').length;
    const converted = purchaseRequisitions.filter((r) => r.status === 'converted').length;
    return { total, pending, approved, converted };
  }, [purchaseRequisitions]);

  const handleAddItem = () => {
    if (!selectedProdId) {
      showFlashNotification('Please select a product', 'error');
      return;
    }
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;

    const qty = Math.max(1, parseFloat(itemQty) || 1);
    const cost = parseFloat(itemCost) || prod.costPrice;

    setReqItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: qty,
        estimatedUnitCost: cost,
        note: itemNote.trim(),
      },
    ]);

    setSelectedProdId('');
    setItemQty('1');
    setItemCost('0');
    setItemNote('');
  };

  const handleRemoveItem = (idx: number) => {
    setReqItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reqItems.length === 0) {
      showFlashNotification('Please add at least one item to requisition', 'error');
      return;
    }

    createPurchaseRequisition({
      locationId: reqLocationId,
      requestedBy,
      department,
      requiredDate,
      priority,
      notes: reqNotes,
      items: reqItems.map((item, index) => ({
        ...item,
        id: `prqi_${Date.now()}_${index}`,
      })),
    });

    setShowCreateModal(false);
    setReqItems([]);
    setReqNotes('');
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto text-slate-100 min-w-0 w-full max-w-full overflow-x-hidden pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-sm w-full min-w-0">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>Purchase Requisitions (Staff Order Requests)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Request inventory restock approvals before generating official purchase orders.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Requisition</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Total Requisitions</div>
            <div className="text-xl font-extrabold text-white font-mono mt-1">{stats.total}</div>
          </div>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Pending Approval</div>
            <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">{stats.pending}</div>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Approved Requisitions</div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">{stats.approved}</div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Converted to PO</div>
            <div className="text-xl font-extrabold text-cyan-400 font-mono mt-1">{stats.converted}</div>
          </div>
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Requisition No, Requester..."
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
          >
            <option value="all">All Requisition Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="converted">Converted to PO</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm w-full min-w-0">
        <div className="overflow-x-auto w-full min-w-0 scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3 px-3">Req No.</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Requested By</th>
                <th className="py-3 px-3">Branch Location</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Items Requested</th>
                <th className="py-3 px-3 text-right">Est. Cost</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredRequisitions.map((req) => {
                const location = locations.find((l) => l.id === req.locationId);
                const estTotal = req.items.reduce((sum, i) => sum + i.quantity * i.estimatedUnitCost, 0);

                return (
                  <tr key={req.id} className="hover:bg-slate-850 transition">
                    <td className="py-3 px-3 font-mono font-bold text-white">{req.requisitionNo}</td>
                    <td className="py-3 px-3 text-slate-400">{req.date.slice(0, 10)}</td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {req.requestedBy} <span className="text-[10px] text-slate-400">({req.department})</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{location?.name || 'Main Location'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.priority === 'urgent'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : req.priority === 'high'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {req.items.map((i, idx) => (
                        <div key={idx} className="text-slate-400">
                          {i.productName} ({i.quantity} Pcs)
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {formatCurrency(estTotal, settings)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : req.status === 'converted'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : req.status === 'rejected'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReqDetails(req)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approvePurchaseRequisition(req.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => rejectPurchaseRequisition(req.id)}
                              className="px-2 py-1 bg-rose-600/80 hover:bg-rose-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </>
                        )}

                        {req.status === 'approved' && (
                          <button
                            onClick={() => convertRequisitionToPurchase(req.id)}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition shadow-md shadow-indigo-900/40"
                          >
                            <ArrowRight className="w-3 h-3" />
                            Convert to PO
                          </button>
                        )}

                        <button
                          onClick={() => deletePurchaseRequisition(req.id)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition"
                          title="Delete Requisition"
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

      {/* New Requisition Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Create Purchase Requisition</h2>
                  <p className="text-xs text-slate-400">Submit an internal inventory request for manager authorization</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Requester Name</label>
                  <input
                    type="text"
                    required
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Branch Location</label>
                  <select
                    value={reqLocationId}
                    onChange={(e) => setReqLocationId(e.target.value)}
                    className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 outline-none focus:border-indigo-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Required Date</label>
                  <input
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Add Items Box */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-slate-200">Requested Items</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={selectedProdId}
                    onChange={(e) => {
                      setSelectedProdId(e.target.value);
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod) setItemCost(prod.costPrice.toString());
                    }}
                    className="sm:col-span-2 bg-slate-900 text-white p-2 rounded-xl border border-slate-700"
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    className="bg-slate-900 text-white p-2 rounded-xl border border-slate-700"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Est Unit Cost"
                    value={itemCost}
                    onChange={(e) => setItemCost(e.target.value)}
                    className="bg-slate-900 text-white p-2 rounded-xl border border-slate-700"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Optional item note / reason..."
                    value={itemNote}
                    onChange={(e) => setItemNote(e.target.value)}
                    className="flex-1 bg-slate-900 text-white p-2 rounded-xl border border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                  >
                    Add Item
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-1.5 pt-2">
                  {reqItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800"
                    >
                      <div>
                        <div className="font-bold text-white">{item.productName}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.quantity} Pcs @ {formatCurrency(item.estimatedUnitCost, settings)}{' '}
                          {item.note && `(${item.note})`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-emerald-400">
                          {formatCurrency(item.quantity * item.estimatedUnitCost, settings)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Requisition Purpose / Notes</label>
                <textarea
                  rows={2}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="Explain why these items are required..."
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedReqDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Requisition #{selectedReqDetails.requisitionNo}
                </h2>
                <p className="text-xs text-slate-400">Requested by {selectedReqDetails.requestedBy}</p>
              </div>
              <button
                onClick={() => setSelectedReqDetails(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-500">Department:</span> <strong className="text-white">{selectedReqDetails.department}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Required Date:</span> <strong className="text-white">{selectedReqDetails.requiredDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Priority:</span> <strong className="text-amber-400 uppercase">{selectedReqDetails.priority}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span> <strong className="text-emerald-400 uppercase">{selectedReqDetails.status}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-300">Requested Line Items:</h3>
                <div className="space-y-2">
                  {selectedReqDetails.items.map((i, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{i.productName}</div>
                        <div className="text-[10px] text-slate-400">{i.quantity} Pcs @ {formatCurrency(i.estimatedUnitCost, settings)}</div>
                      </div>
                      <div className="font-mono font-bold text-indigo-300">
                        {formatCurrency(i.quantity * i.estimatedUnitCost, settings)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedReqDetails.notes && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block font-bold mb-1">Notes:</span>
                  <p className="text-slate-300">{selectedReqDetails.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              {selectedReqDetails.status === 'approved' && (
                <button
                  onClick={() => {
                    convertRequisitionToPurchase(selectedReqDetails.id);
                    setSelectedReqDetails(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Convert to PO Now
                </button>
              )}
              <button
                onClick={() => setSelectedReqDetails(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
