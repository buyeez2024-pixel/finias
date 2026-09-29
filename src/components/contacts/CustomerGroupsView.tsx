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
  BookOpen,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  UserCheck,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Truck,
  BookMarked
} from 'lucide-react';

export const CustomerGroupsView: React.FC = () => {
  const {
    customerGroups,
    deleteCustomerGroup,
    customers,
    navigateToContacts,
    showFlashNotification,
    settings,
    contactsSubTab,
    setContactsSubTab,
  } = useErp();

  const isLight = settings?.themeMode === 'light';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');
  const [activeSwipeIndex, setActiveSwipeIndex] = useState(0);

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

  const samplePrice = 200;

  return (
    <div className="w-full max-w-full min-w-0 p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-fadeIn overflow-x-hidden pb-28">
      {/* Contact Modules Sub-Navigation Bar */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 overflow-x-auto custom-scrollbar touch-pan-x w-full ${
        isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <button
          onClick={() => navigateToContacts('customers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            contactsSubTab === 'customers'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Customers</span>
        </button>

        <button
          onClick={() => navigateToContacts('suppliers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            contactsSubTab === 'suppliers'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Suppliers</span>
        </button>

        <button
          onClick={() => navigateToContacts('customer_groups')}
          className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Customer Groups</span>
        </button>

        <button
          onClick={() => navigateToContacts('import_contacts')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            contactsSubTab === 'import_contacts'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Import Contacts</span>
        </button>

        <button
          onClick={() => navigateToContacts('customer_ledger')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            contactsSubTab === 'customer_ledger'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          <span>Ledgers</span>
        </button>
      </div>

      {/* Top Banner */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border shadow-md w-full min-w-0 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="min-w-0 w-full sm:w-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              Pricing Strategy & Tiers
            </span>
          </div>
          <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            <Users className="w-5 h-5 text-indigo-500 shrink-0" />
            <span className="truncate">Customer Groups</span>
          </h1>
          <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Set percentage adjustments (e.g., -20% Wholesale, -10% VIP). Selling prices automatically recalculate at POS & Sales checkout.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
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
      <div className={`p-4 rounded-2xl border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full min-w-0 ${
        isLight
          ? 'bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/50 border-indigo-200 text-slate-800'
          : 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/30 text-white'
      }`}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 sm:p-3 bg-indigo-500/20 text-indigo-500 rounded-xl border border-indigo-500/30 shrink-0 mt-0.5">
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span>Automated Group Price Calculation</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </h3>
            <p className={`text-[11px] sm:text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Assigned customers automatically receive their customized pricing in <strong className={isLight ? 'text-slate-900' : 'text-white'}>POS Terminal</strong> and <strong className={isLight ? 'text-slate-900' : 'text-white'}>Sales</strong> without manual line discounts.
            </p>
          </div>
        </div>

        <div className={`p-2.5 sm:p-3 rounded-xl border text-xs font-mono shrink-0 space-y-1 w-full md:w-auto ${
          isLight ? 'bg-white border-slate-200 text-slate-700 shadow-2xs' : 'bg-slate-950/80 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Product Base:</span>
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>${samplePrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400 font-bold">
            <span>Wholesale (-20%):</span>
            <span>${(samplePrice * 0.8).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Customer Groups Container */}
      <div className={`rounded-2xl border shadow-sm w-full min-w-0 overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        {/* Section Header with View Toggle for Mobile */}
        <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between gap-2 ${
          isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <h2 className={`text-xs sm:text-sm font-bold flex items-center gap-2 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Tag className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Active Customer Groups ({customerGroups.length})</span>
          </h2>

          {/* Mobile View Toggle */}
          <div className="flex sm:hidden items-center p-1 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <button
              type="button"
              onClick={() => setMobileViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mobileViewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Swipe Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[10px]">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mobileViewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="text-[10px]">Table</span>
            </button>
          </div>
        </div>

        {/* 1. MOBILE SWIPE CARDS VIEW (Active on phones when cards mode selected) */}
        <div className={`sm:hidden ${mobileViewMode === 'cards' ? 'block' : 'hidden'} p-3 space-y-3`}>
          {customerGroups.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No customer groups found. Tap &quot;Add Customer Group&quot; to create one.
            </div>
          ) : (
            <>
              {/* Swipe Instruction Banner */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-medium border ${
                isLight ? 'bg-indigo-50/70 text-indigo-800 border-indigo-100' : 'bg-indigo-950/30 text-indigo-300 border-indigo-900/40'
              }`}>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Swipe horizontally to browse groups</span>
                </span>
                <span className="text-[10px] font-bold opacity-75">{customerGroups.length} Groups</span>
              </div>

              {/* Horizontal Touch-Swipe Carousel */}
              <div 
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory py-1 pb-3 custom-scrollbar -webkit-overflow-scrolling-touch touch-pan-x w-full"
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const itemWidth = target.offsetWidth * 0.85;
                  const index = Math.round(target.scrollLeft / itemWidth);
                  setActiveSwipeIndex(Math.min(index, customerGroups.length - 1));
                }}
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {customerGroups.map((group, idx) => {
                  const pct = group.calculationPercentage || 0;
                  const adjustedPrice = Math.round(samplePrice * (1 + pct / 100) * 100) / 100;
                  const assignedCount = customers.filter(
                    (c) =>
                      c.customerGroupId === group.id ||
                      (c.customerGroup || '').toLowerCase() === group.name.toLowerCase()
                  ).length;

                  return (
                    <div
                      key={group.id}
                      className={`snap-center shrink-0 w-[86vw] max-w-[340px] p-4 rounded-2xl border shadow-md flex flex-col justify-between transition-all ${
                        isLight
                          ? 'bg-white border-slate-200 text-slate-900'
                          : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    >
                      {/* Card Header */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                              {group.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {group.name}
                              </h3>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <UserCheck className="w-3 h-3 text-indigo-400" />
                                <span>{assignedCount} {assignedCount === 1 ? 'Customer' : 'Customers'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Percentage Badge */}
                          <span
                            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              pct < 0
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                                : pct > 0
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <Percent className="w-3 h-3" />
                            <span>{pct > 0 ? `+${pct}%` : `${pct}%`}</span>
                          </span>
                        </div>

                        {/* Price Impact Calculator Box */}
                        <div className={`p-2.5 rounded-xl border text-xs mb-3 font-mono ${
                          isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900/90 border-slate-800 text-slate-300'
                        }`}>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-slate-500">Base Selling Price</span>
                            <span className="line-through text-slate-400">${samplePrice.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between font-bold text-xs">
                            <span className="flex items-center gap-1 text-indigo-400">
                              {pct < 0 ? <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingUp className="w-3.5 h-3.5 text-amber-400" />}
                              <span>Group Price:</span>
                            </span>
                            <span className={`text-sm ${isLight ? 'text-indigo-900 font-extrabold' : 'text-emerald-400'}`}>
                              ${adjustedPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Description / Notes */}
                        <p className={`text-xs line-clamp-2 min-h-[32px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {group.description || <span className="text-slate-500 italic">No notes added for this group.</span>}
                        </p>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500">
                          {group.createdDate ? `Created ${group.createdDate}` : 'Active Tier'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(group)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                            }`}
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(group)}
                            className={`p-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border cursor-pointer ${
                              isLight
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                                : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'
                            }`}
                            title="Delete Group"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Swipe Pagination Dots */}
              {customerGroups.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {customerGroups.map((_, dotIdx) => (
                    <div
                      key={dotIdx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeSwipeIndex === dotIdx
                          ? 'w-5 bg-indigo-500'
                          : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 2. FULL RESPONSIVE TABLE VIEW (Visible on tablet/desktop, and on mobile when Table mode selected) */}
        <div className={`${mobileViewMode === 'table' ? 'block' : 'hidden sm:block'} w-full overflow-x-auto custom-scrollbar touch-pan-x pb-2`}>
          <table className="w-full text-left text-xs min-w-[620px]">
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
