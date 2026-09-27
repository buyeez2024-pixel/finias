import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { CustomerGroup } from '../../types/erp';
import { CustomerGroupFormModal } from './CustomerGroupsModal';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Percent,
  Calculator,
  Info,
  Tag,
  ArrowRight,
  Sparkles,
  BookOpen
} from 'lucide-react';

export const CustomerGroupsView: React.FC = () => {
  const {
    customerGroups,
    deleteCustomerGroup,
    customers,
    navigateToContacts,
    showFlashNotification,
  } = useErp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);

  const handleOpenAdd = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: CustomerGroup) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleDelete = (group: CustomerGroup) => {
    if (window.confirm(`Are you sure you want to delete Customer Group "${group.name}"?`)) {
      deleteCustomerGroup(group.id);
      showFlashNotification(`Customer group "${group.name}" deleted.`, 'info');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Pricing Strategy
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Customer Groups</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Set custom percentage adjustments (e.g., -20% for Friends, -15% Wholesale). Selling prices update automatically at POS/Checkout without extra invoice discount line items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            id="btn-add-customer-group"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer Group</span>
          </button>
        </div>
      </div>

      {/* Logic Demonstration Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0 mt-0.5">
            <Calculator className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>How Customer Group Price Calculation Works</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              When a customer assigned to a group is selected in the <strong className="text-white">POS Terminal</strong> or <strong className="text-white">Add Sale Screen</strong>, product prices automatically adjust according to the group&apos;s calculation percentage.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono shrink-0 space-y-1">
          <div className="text-slate-400">Product Price = <span className="text-white font-bold">$200.00</span></div>
          <div className="text-emerald-400">Friend Group (-20%) = <span className="text-emerald-300 font-bold">$160.00</span></div>
          <div className="text-[10px] text-slate-500 italic">* Internal calculation on selling price</div>
        </div>
      </div>

      {/* Customer Groups List Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-400" />
            <span>Active Customer Groups ({customerGroups.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3.5 px-4">Group Name</th>
                <th className="py-3.5 px-4">Calculation Percentage</th>
                <th className="py-3.5 px-4">Price Impact Example ($200 Base)</th>
                <th className="py-3.5 px-4">Description / Notes</th>
                <th className="py-3.5 px-4 text-center">Assigned Customers</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {customerGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No customer groups found. Click &quot;Add Customer Group&quot; to define your first group.
                  </td>
                </tr>
              ) : (
                customerGroups.map((group) => {
                  const pct = group.calculationPercentage || 0;
                  const samplePrice = 200;
                  const adjustedPrice = Math.round(samplePrice * (1 + pct / 100) * 100) / 100;
                  const assignedCount = customers.filter(
                    (c) =>
                      c.customerGroupId === group.id ||
                      (c.customerGroup || '').toLowerCase() === group.name.toLowerCase()
                  ).length;

                  return (
                    <tr key={group.id} className="hover:bg-slate-850/60 transition group">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs">
                            {group.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{group.name}</div>
                            {group.createdDate && (
                              <div className="text-[10px] text-slate-500">Created {group.createdDate}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            pct < 0
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : pct > 0
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          <Percent className="w-3 h-3" />
                          <span>{pct > 0 ? `+${pct}%` : `${pct}%`}</span>
                          <span className="text-[10px] opacity-80">
                            ({pct < 0 ? 'Discount' : pct > 0 ? 'Mark-up' : 'Standard'})
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-300 flex items-center gap-1.5">
                          <span className="text-slate-500 line-through">$200.00</span>
                          <ArrowRight className="w-3 h-3 text-slate-600" />
                          <span className="font-bold text-white text-xs">${adjustedPrice.toFixed(2)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                        {group.description || <span className="text-slate-600 italic">No notes</span>}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                          {assignedCount} {assignedCount === 1 ? 'Customer' : 'Customers'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(group)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700"
                            title="Edit Group"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(group)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-lg transition border border-slate-700 hover:border-rose-800"
                            title="Delete Group"
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
      </div>

      {/* Popup Form Modal */}
      <CustomerGroupFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingGroup={editingGroup}
      />
    </div>
  );
};
