import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  User,
  Search,
  Plus,
  X,
  ChevronDown,
  Check,
  Phone,
  Mail,
  Building,
  CreditCard,
  Receipt,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ShoppingBag,
  Hash,
  ArrowRight,
  FileText,
  Sparkles,
  MapPin,
  Clock,
  Info,
} from 'lucide-react';
import { Customer, Transaction } from '../../types/erp';
import { formatCurrency } from '../../utils/formatters';

interface SaleReturnCustomerDropdownProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  disabled?: boolean;
  finalSales: Transaction[];
  selectedSaleId?: string;
  onSelectSaleOrder?: (saleId: string) => void;
  onOpenAddCustomerModal?: (initialName?: string) => void;
  settings: any;
}

const AVATAR_COLORS = [
  'bg-indigo-600/30 text-indigo-300 border-indigo-500/40',
  'bg-emerald-600/30 text-emerald-300 border-emerald-500/40',
  'bg-amber-600/30 text-amber-300 border-amber-500/40',
  'bg-rose-600/30 text-rose-300 border-rose-500/40',
  'bg-sky-600/30 text-sky-300 border-sky-500/40',
  'bg-purple-600/30 text-purple-300 border-purple-500/40',
  'bg-teal-600/30 text-teal-300 border-teal-500/40',
  'bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-500/40',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name: string): string {
  if (!name) return 'CU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const SaleReturnCustomerDropdown: React.FC<SaleReturnCustomerDropdownProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  disabled = false,
  finalSales,
  selectedSaleId,
  onSelectSaleOrder,
  onOpenAddCustomerModal,
  settings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'with_orders' | 'with_due'>('all');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Find currently selected customer
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  // Map customer ID -> list of completed/final sales
  const salesByCustomer = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    finalSales.forEach((sale) => {
      if (!sale.customerId) return;
      const existing = map.get(sale.customerId) || [];
      existing.push(sale);
      map.set(sale.customerId, existing);
    });
    return map;
  }, [finalSales]);

  // Orders available for currently selected customer
  const customerOrders = useMemo(() => {
    if (!selectedCustomerId) return [];
    return salesByCustomer.get(selectedCustomerId) || [];
  }, [selectedCustomerId, salesByCustomer]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return customers.filter((cust) => {
      // Tab filter
      if (activeTab === 'with_orders') {
        const orderCount = salesByCustomer.get(cust.id)?.length || 0;
        if (orderCount === 0) return false;
      } else if (activeTab === 'with_due') {
        if (!cust.totalDue || cust.totalDue <= 0) return false;
      }

      // Search term filter
      if (!term) return true;

      const nameMatch = cust.name?.toLowerCase().includes(term);
      const businessMatch = cust.businessName?.toLowerCase().includes(term);
      const phoneMatch = cust.phone?.toLowerCase().includes(term);
      const emailMatch = cust.email?.toLowerCase().includes(term);
      const contactIdMatch = cust.contactId?.toLowerCase().includes(term);
      const taxMatch = cust.taxNumber?.toLowerCase().includes(term);

      return nameMatch || businessMatch || phoneMatch || emailMatch || contactIdMatch || taxMatch;
    });
  }, [customers, searchTerm, activeTab, salesByCustomer]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredCustomers.length - 1 ? prev + 1 : prev));
      scrollHighlightedIntoView(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      scrollHighlightedIntoView(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCustomers[highlightedIndex]) {
        handleSelectCustomer(filteredCustomers[highlightedIndex].id);
      }
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (!listContainerRef.current) return;
    const items = listContainerRef.current.querySelectorAll('[data-customer-item]');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  };

  const handleSelectCustomer = (id: string) => {
    onSelectCustomer(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Find walk-in customer
  const walkInCustomer = useMemo(() => {
    return customers.find(
      (c) =>
        c.name.toLowerCase().includes('walk-in') ||
        c.name.toLowerCase().includes('walkin') ||
        c.name.toLowerCase().includes('retail')
    );
  }, [customers]);

  const countWithOrders = useMemo(() => {
    return customers.filter((c) => (salesByCustomer.get(c.id)?.length || 0) > 0).length;
  }, [customers, salesByCustomer]);

  const countWithDue = useMemo(() => {
    return customers.filter((c) => c.totalDue && c.totalDue > 0).length;
  }, [customers]);

  return (
    <div className="space-y-3" ref={dropdownRef}>
      {/* Top Label & Quick Action Bar */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-indigo-400" />
          <span>Customer Account *</span>
          <span className="text-[10px] text-slate-500 font-normal lowercase tracking-normal">
            ({customers.length} on file)
          </span>
        </label>

        <div className="flex items-center gap-1.5">
          {/* Quick Walk-In Button */}
          {walkInCustomer && !disabled && (
            <button
              type="button"
              id="sale-return-walkin-quick-btn"
              onClick={() => handleSelectCustomer(walkInCustomer.id)}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition flex items-center gap-1 ${
                selectedCustomerId === walkInCustomer.id
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700/60'
              }`}
              title="Quick Select Walk-In Customer"
            >
              <ShoppingBag className="w-3 h-3 text-indigo-400" />
              <span>Walk-In</span>
            </button>
          )}

          {/* Quick Add Customer Button */}
          {onOpenAddCustomerModal && !disabled && (
            <button
              type="button"
              id="sale-return-add-customer-header-btn"
              onClick={() => onOpenAddCustomerModal()}
              className="text-[10px] font-bold px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg border border-indigo-500 shadow-sm flex items-center gap-1 transition active:scale-95"
              title="Add New Customer"
            >
              <Plus className="w-3 h-3" />
              <span>+ New Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dropdown Trigger */}
      <div className="relative">
        <div
          id="sale-return-customer-dropdown-trigger"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          onClick={() => {
            if (!disabled) setIsOpen(!isOpen);
          }}
          className={`w-full bg-slate-950 text-white min-h-[52px] px-4 py-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-900/50 border-slate-800' : ''
          } ${
            isOpen
              ? 'border-indigo-500 ring-2 ring-indigo-500/25 shadow-lg shadow-indigo-950/40'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          {selectedCustomer ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${getAvatarColor(
                  selectedCustomer.name
                )}`}
              >
                {getInitials(selectedCustomer.name)}
              </div>

              {/* Customer summary */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-white truncate">
                    {selectedCustomer.name}
                  </span>
                  {selectedCustomer.businessName && (
                    <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/60 truncate max-w-[160px]">
                      {selectedCustomer.businessName}
                    </span>
                  )}
                  {selectedCustomer.contactId && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                      {selectedCustomer.contactId}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                  {selectedCustomer.phone && selectedCustomer.phone !== 'N/A' && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {selectedCustomer.phone}
                    </span>
                  )}

                  {/* Orders pill */}
                  <span
                    className={`flex items-center gap-1 font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      customerOrders.length > 0
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Receipt className="w-2.5 h-2.5" />
                    {customerOrders.length > 0
                      ? `${customerOrders.length} Order${customerOrders.length > 1 ? 's' : ''} to Return`
                      : 'No Past Orders'}
                  </span>

                  {/* Due status */}
                  {selectedCustomer.totalDue && selectedCustomer.totalDue > 0 ? (
                    <span className="flex items-center gap-1 font-bold text-amber-400 text-[10px]">
                      <AlertCircle className="w-3 h-3" />
                      Due: {formatCurrency(selectedCustomer.totalDue, settings)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      No Due
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-slate-400 flex-1">
              <Search className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium">
                Search or select customer (by Name, Mobile, Business, ID)...
              </span>
            </div>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {selectedCustomerId && !disabled && (
              <button
                type="button"
                id="sale-return-clear-customer-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCustomer('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Deselect Customer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-indigo-400' : ''
              }`}
            />
          </div>
        </div>

        {/* Dropdown Popover */}
        {isOpen && (
          <div
            id="sale-return-customer-dropdown-menu"
            className="absolute z-50 left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
            style={{ maxHeight: '420px' }}
          >
            {/* Search Input Box */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  id="sale-return-customer-search-input"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type name, phone, business, email, contact ID..."
                  className="w-full bg-slate-900 text-white pl-9 pr-8 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-medium placeholder:text-slate-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Filter Tabs */}
              <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('all');
                    setHighlightedIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>All Customers</span>
                  <span className="text-[10px] opacity-75">({customers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('with_orders');
                    setHighlightedIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'with_orders'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Only show customers with completed orders that can be returned"
                >
                  <Receipt className="w-3 h-3" />
                  <span>With Orders</span>
                  <span className="text-[10px] opacity-75">({countWithOrders})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('with_due');
                    setHighlightedIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'with_due'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>With Due</span>
                  <span className="text-[10px] opacity-75">({countWithDue})</span>
                </button>
              </div>
            </div>

            {/* Results List */}
            <div
              ref={listContainerRef}
              className="overflow-y-auto divide-y divide-slate-800/60 flex-1 max-h-64 custom-scrollbar"
            >
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust, idx) => {
                  const isSelected = cust.id === selectedCustomerId;
                  const isHighlighted = idx === highlightedIndex;
                  const orders = salesByCustomer.get(cust.id) || [];

                  return (
                    <div
                      key={cust.id}
                      data-customer-item
                      onClick={() => handleSelectCustomer(cust.id)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`px-4 py-3 cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-600/20 border-l-4 border-indigo-500'
                          : isHighlighted
                          ? 'bg-slate-800/70'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Left: Avatar & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${getAvatarColor(
                            cust.name
                          )}`}
                        >
                          {getInitials(cust.name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-white truncate">
                              {cust.name}
                            </span>
                            {cust.businessName && (
                              <span className="text-[10px] font-medium text-indigo-300 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/50">
                                {cust.businessName}
                              </span>
                            )}
                            {cust.contactId && (
                              <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1 rounded border border-slate-800">
                                {cust.contactId}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                            {cust.phone && cust.phone !== 'N/A' && (
                              <span className="flex items-center gap-1 font-mono text-[10px]">
                                <Phone className="w-2.5 h-2.5 text-slate-500" />
                                {cust.phone}
                              </span>
                            )}
                            {cust.email && (
                              <span className="flex items-center gap-1 text-[10px] truncate max-w-[140px] text-slate-500">
                                <Mail className="w-2.5 h-2.5 text-slate-600" />
                                {cust.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Badges & Financials */}
                      <div className="flex items-center gap-2.5 shrink-0 text-right">
                        <div className="flex flex-col items-end gap-1">
                          {/* Orders Badge */}
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                              orders.length > 0
                                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                : 'bg-slate-800/50 text-slate-500'
                            }`}
                          >
                            <Receipt className="w-2.5 h-2.5" />
                            {orders.length > 0 ? `${orders.length} orders` : '0 orders'}
                          </span>

                          {/* Due / Balance */}
                          {cust.totalDue && cust.totalDue > 0 ? (
                            <span className="text-[10px] font-bold text-amber-400">
                              Due: {formatCurrency(cust.totalDue, settings)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400">No Due</span>
                          )}
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-300">No customers found</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {searchTerm
                        ? `No match for "${searchTerm}" in ${activeTab.replace('_', ' ')}`
                        : 'No customers available in this category'}
                    </div>
                  </div>

                  {onOpenAddCustomerModal && searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenAddCustomerModal(searchTerm);
                      }}
                      className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add "{searchTerm}" as New Customer</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dropdown Footer */}
            <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <span>
                  <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded">↑</kbd>
                  <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded ml-0.5">
                    ↓
                  </kbd>{' '}
                  Navigate
                </span>
                <span>•</span>
                <span>
                  <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded">
                    Enter
                  </kbd>{' '}
                  Select
                </span>
                <span>•</span>
                <span>
                  <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded">Esc</kbd>{' '}
                  Close
                </span>
              </div>

              {onOpenAddCustomerModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAddCustomerModal();
                  }}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 ml-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Customer</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Customer Intelligence & Returnable Invoices Card */}
      {selectedCustomer && (
        <div
          id="sale-return-customer-intelligence-card"
          className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 shadow-inner"
        >
          {/* Top Ledger Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/70 pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-black text-sm shadow-md ${getAvatarColor(
                  selectedCustomer.name
                )}`}
              >
                {getInitials(selectedCustomer.name)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-sm text-white">{selectedCustomer.name}</h4>
                  {selectedCustomer.businessName && (
                    <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-800/60">
                      {selectedCustomer.businessName}
                    </span>
                  )}
                  {selectedCustomer.customerGroup && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/50">
                      {selectedCustomer.customerGroup}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                  {selectedCustomer.phone && selectedCustomer.phone !== 'N/A' && (
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Phone className="w-3 h-3 text-indigo-400" />
                      {selectedCustomer.phone}
                    </span>
                  )}
                  {selectedCustomer.email && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Mail className="w-3 h-3 text-indigo-400" />
                      {selectedCustomer.email}
                    </span>
                  )}
                  {selectedCustomer.city && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {selectedCustomer.city}
                      {selectedCustomer.state ? `, ${selectedCustomer.state}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Status Badges */}
            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
              {/* Outstanding Due */}
              <div className="bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-right">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight block">
                  Current Due
                </span>
                <span
                  className={`text-xs font-mono font-black ${
                    selectedCustomer.totalDue && selectedCustomer.totalDue > 0
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(selectedCustomer.totalDue || 0, settings)}
                </span>
              </div>

              {/* Credit Limit */}
              <div className="bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-right">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight block">
                  Credit Limit
                </span>
                <span className="text-xs font-mono font-black text-slate-300">
                  {formatCurrency(selectedCustomer.creditLimit || 5000, settings)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick-Pick Eligible Sales Orders Carousel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                <span>Eligible Past Orders for Return</span>
                <span className="text-[10px] text-slate-500">({customerOrders.length} found)</span>
              </span>

              {customerOrders.length > 0 && (
                <span className="text-[10px] text-indigo-400 font-semibold">
                  Click an order to load its sold items
                </span>
              )}
            </div>

            {customerOrders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {customerOrders.map((sale) => {
                  const isOrderActive = sale.id === selectedSaleId;
                  const itemCount = sale.items?.reduce(
                    (acc: number, item: any) => acc + (item.quantity || 1),
                    0
                  ) || 0;
                  const dateStr = sale.transactionDate
                    ? new Date(sale.transactionDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent Sale';

                  return (
                    <button
                      key={sale.id}
                      type="button"
                      onClick={() => onSelectSaleOrder?.(sale.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 ${
                        isOrderActive
                          ? 'bg-indigo-600/20 border-indigo-500/80 ring-1 ring-indigo-500 shadow-md shadow-indigo-950/50'
                          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-xs truncate ${
                              isOrderActive ? 'text-indigo-300' : 'text-white'
                            }`}
                          >
                            {sale.invoiceNo}
                          </span>
                          {isOrderActive && (
                            <span className="text-[9px] font-bold bg-indigo-500 text-white px-1.5 py-0.2 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {dateStr}
                          </span>
                          <span>•</span>
                          <span>{itemCount} items</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs text-emerald-400 block">
                          {formatCurrency(sale.totalAmount, settings)}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-tighter block">
                          {sale.paymentMethod || 'Paid'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 flex items-center gap-3">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <p className="text-xs text-slate-400">
                  No completed sales orders found for this customer.{' '}
                  <span className="text-slate-300 font-semibold">
                    Direct Return (No Receipt)
                  </span>{' '}
                  mode is available below to manually specify items to return.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
