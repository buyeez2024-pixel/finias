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
    settings,
  } = useErp();

  const isLight = settings?.themeMode === 'light';
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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-fadeIn min-w-0 overflow-x-hidden pb-28">
      {/* Top Banner */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border shadow-md ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              Pricing Strategy
            </span>
          </div>
          <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 truncate ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            <Users className="w-5 h-5 text-indigo-500" />
            <span>Customer Groups</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Set custom percentage adjustments (e.g., -20% for Friends, -15% Wholesale). Selling prices update automatically at POS/Checkout without extra invoice discount line items.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleOpenAdd}
            id="btn-add-customer-group"
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add Customer Group</span>
          </button>
        </div>
      </div>

      {/* Logic Demonstration Card */}
      <div className={`p-4 rounded-2xl border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isLight
          ? 'bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 border-indigo-200 text-slate-800'
          : 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/30'
      }`}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-3 bg-indigo-500/20 text-indigo-500 rounded-xl border border-indigo-500/30 shrink-0 mt-0.5">
            <Calculator className="w-6 h-6" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span>How Customer Group Price Calculation Works</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h3>
            <p className={`text-xs leading-relaxed max-w-3xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              When a customer assigned to a group is selected in the <strong className={isLight ? 'text-slate-900' : 'text-white'}>POS Terminal</strong> or <strong className={isLight ? 'text-slate-900' : 'text-white'}>Add Sale Screen</strong>, product prices automatically adjust according to the group&apos;s calculation percentage.
            </p>
          </div>
        </div>

        <div className={`p-3 rounded-xl border text-xs font-mono shrink-0 space-y-1 w-full md:w-auto ${
          isLight ? 'bg-white border-slate-200 text-slate-700 shadow-2xs' : 'bg-slate-950/80 border-slate-800 text-slate-300'
        }`}>
          <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>Product Price = <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>$200.00</span></div>
          <div className="text-emerald-600 dark:text-emerald-400 font-bold">Friend Group (-20%) = <span>$160.00</span></div>
          <div className="text-[10px] text-slate-500 italic">* Internal calculation on selling price</div>
        </div>
      </div>

      {/* Customer Groups List Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm w-full min-w-0 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <h2 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Tag className="w-4 h-4 text-indigo-500" />
            <span>Active Customer Groups ({customerGroups.length})</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-medium sm:hidden">Swipe table &rarr;</span>
        </div>

        {/* Mobile Swipe Hint */}
        <div className={`sm:hidden flex items-center justify-between px-4 py-1.5 text-[10px] border-b ${
          isLight ? 'bg-indigo-50/50 text-indigo-700 border-indigo-100' : 'bg-indigo-950/20 text-indigo-300 border-slate-800'
        }`}>
          <span>Swipe horizontally for price impact & actions</span>
          <ArrowRight className="w-3 h-3 animate-pulse text-indigo-500" />
        </div>

        <div className="overflow-x-auto custom-scrollbar touch-pan-x w-full max-w-full pb-2">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className={`uppercase text-[10px] tracking-wider border-b font-bold ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}>
              <tr>
                <th className="py-3.5 px-4">Group Name</th>
                <th className="py-3.5 px-4">Calculation Percentage</th>
                <th className="py-3.5 px-4">Price Impact Example ($200 Base)</th>
                <th className="py-3.5 px-4">Description / Notes</th>
                <th className="py-3.5 px-4 text-center">Assigned Customers</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-100 text-slate-800' : 'divide-slate-800/80 text-slate-200'}`}>
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
                    <tr key={group.id} className={`transition group ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850/60'}`}>
                      <td className="py-3.5 px-4 font-bold">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                            {group.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{group.name}</div>
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
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                              : pct > 0
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 line-through">$200.00</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>${adjustedPrice.toFixed(2)}</span>
                        </div>
                      </td>

                      <td className={`py-3.5 px-4 max-w-xs truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {group.description || <span className="text-slate-400 italic">No notes</span>}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span className={`px-2.5 py-0.5 rounded-full border text-xs ${
                          isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {assignedCount} {assignedCount === 1 ? 'Customer' : 'Customers'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(group)}
                            className={`p-1.5 rounded-lg transition border cursor-pointer ${
                              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                            title="Edit Group"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(group)}
                            className={`p-1.5 rounded-lg transition border cursor-pointer ${
                              isLight ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200' : 'bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border-slate-700 hover:border-rose-800'
                            }`}
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
