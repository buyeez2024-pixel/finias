import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { PaymentMethodItem } from '../../types/erp';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  Search,
  AlertCircle,
  X,
  Save,
  Wallet,
  Coins,
} from 'lucide-react';

export const PaymentMethodsTab: React.FC = () => {
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, currentUser } = useErp();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supreme_admin' || currentUser?.role === 'super_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);

  const handleOpenAddModal = () => {
    setEditingMethod(null);
    setName('');
    setCode('');
    setDescription('');
    setEnabled(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (method: PaymentMethodItem) => {
    setEditingMethod(method);
    setName(method.name);
    setCode(method.code);
    setDescription(method.description || '');
    setEnabled(method.enabled);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const formattedCode = code.toLowerCase().replace(/\s+/g, '_');

    if (editingMethod) {
      updatePaymentMethod(editingMethod.id, {
        name: name.trim(),
        code: formattedCode,
        description: description.trim(),
        enabled,
      });
    } else {
      addPaymentMethod({
        name: name.trim(),
        code: formattedCode,
        description: description.trim(),
        enabled,
        isDefault: false,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, isDefault?: boolean) => {
    if (isDefault) {
      alert('Default system payment methods cannot be deleted.');
      return;
    }
    if (confirm('Are you sure you want to delete this payment method?')) {
      const res = deletePaymentMethod(id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const filteredMethods = paymentMethods.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn w-full max-w-full min-w-0 flex-shrink-0 mx-auto">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg w-full min-w-0">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payment methods by name, code..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payment Method</span>
        </button>
      </div>

      {/* Payment Methods Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl w-full max-w-full min-w-0">
        {/* Mobile Swipe Hint */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 sm:hidden">
          <span>⇄ Swipe table horizontally to view all method details & actions</span>
        </div>

        <div
          className="overflow-x-auto scrollbar-thin w-full max-w-full min-w-0"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pan-y',
            overscrollBehaviorX: 'contain',
          }}
        >
          <table className="w-full text-left border-collapse min-w-[640px] sm:min-w-[700px]">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4 sm:px-6 whitespace-nowrap">Payment Method Name</th>
                <th className="py-4 px-4 whitespace-nowrap">Code / Key</th>
                <th className="py-4 px-4 whitespace-nowrap">Description</th>
                <th className="py-4 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-4 px-4 text-center whitespace-nowrap">Type</th>
                <th className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredMethods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CreditCard className="w-8 h-8 text-slate-600" />
                      <p>No payment methods found matching your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMethods.map((method) => (
                  <tr key={method.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {method.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-indigo-300 bg-slate-950/60 rounded-lg px-2 py-1 border border-slate-800/80 inline-block font-bold">
                        {method.code}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400 max-w-xs truncate whitespace-nowrap">
                      {method.description || '—'}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          method.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {method.enabled ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {method.isDefault ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <Shield className="w-3 h-3" /> System Default
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          Custom
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(method)}
                          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all shadow-sm cursor-pointer"
                          title="Edit Payment Method"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!method.isDefault ? (
                          <button
                            onClick={() => handleDelete(method.id, method.isDefault)}
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all shadow-sm cursor-pointer"
                            title="Delete Payment Method"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure payment gateway or cash drawer tender option for POS & Invoices.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payment Method Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingMethod) {
                      setCode(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                    }
                  }}
                  placeholder="e.g. Apple Pay, Zelle, Custom Net 30"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  System Code / Key *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. apple_pay, zelle"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-indigo-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Unique identifier code used in database transactions and API integrations.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details or settlement instructions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="methodEnabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="methodEnabled" className="text-xs font-semibold text-slate-300 select-none">
                  Enable in POS Terminal & Checkout Gateways
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingMethod ? 'Save Changes' : 'Create Method'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
