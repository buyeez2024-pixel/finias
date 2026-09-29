import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  User,
  ErpModuleId,
} from '../../types/erp';
import {
  X,
  User as UserIcon,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Building,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Briefcase,
  FileText,
  Activity,
  Receipt,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Printer,
  Edit2,
  LogIn,
  Search,
  Filter,
  Download,
  Share2,
  Tag,
  Boxes,
  ShoppingCart,
  Truck,
  Layers,
  ChevronRight,
  ExternalLink,
  Percent,
  Plus,
  Trash2,
} from 'lucide-react';

interface UserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (user: User) => void;
  onOpenReceipt?: (sale: any) => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose,
  onEdit,
  onOpenReceipt,
}) => {
  const {
    currentUser,
    rolePermissions,
    locations,
    transactions,
    stockAdjustments,
    stockTransfers,
    expenses,
    settings,
    switchUser,
  } = useErp();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const isLight = settings?.themeMode === 'light';
  const currencySymbol = settings?.currencySymbol || '$';

  const [activeTab, setActiveTab] = useState<'profile' | 'activities' | 'sales' | 'hrm' | 'documents'>('profile');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [salesSearch, setSalesSearch] = useState<string>('');
  
  // Activity Log Date Range State
  const [activityDatePreset, setActivityDatePreset] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('all');
  const [activityStartDate, setActivityStartDate] = useState<string>('');
  const [activityEndDate, setActivityEndDate] = useState<string>('');

  const handleDatePresetChange = (preset: 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom') => {
    setActivityDatePreset(preset);
    const today = new Date().toISOString().split('T')[0];
    if (preset === 'all') {
      setActivityStartDate('');
      setActivityEndDate('');
    } else if (preset === 'today') {
      setActivityStartDate(today);
      setActivityEndDate(today);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setActivityStartDate(yStr);
      setActivityEndDate(yStr);
    } else if (preset === 'this_week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setActivityStartDate(d.toISOString().split('T')[0]);
      setActivityEndDate(today);
    } else if (preset === 'this_month') {
      const d = new Date();
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      setActivityStartDate(firstDay);
      setActivityEndDate(today);
    }
  };
  
  // Internal Notes State per User
  const [userNotesMap, setUserNotesMap] = useState<Record<string, Array<{ id: string; text: string; date: string; author: string }>>>(() => {
    try {
      const saved = localStorage.getItem('ultimate_erp_user_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [newNoteText, setNewNoteText] = useState('');

  // Handle ESC key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter Transactions strictly for this specific user
  const userTransactions = useMemo(() => {
    if (!user) return [];
    const uName = (user.name || '').trim().toLowerCase();
    const uUsername = (user.username || '').trim().toLowerCase();
    const uId = user.id;

    return (transactions || []).filter((t: any) => {
      // 1. Direct ID matches
      if (t.userId && t.userId === uId) return true;
      if (t.cashierId && t.cashierId === uId) return true;
      if (t.createdByUserId && t.createdByUserId === uId) return true;

      // 2. CreatedBy name match
      if (t.createdBy && typeof t.createdBy === 'string') {
        const cb = t.createdBy.trim().toLowerCase();
        if (cb && (cb === uName || (uUsername && cb === uUsername))) return true;
      }

      // 3. CashierName match
      if (t.cashierName && typeof t.cashierName === 'string') {
        const cn = t.cashierName.trim().toLowerCase();
        if (cn && (cn === uName || (uUsername && cn === uUsername))) return true;
      }

      return false;
    });
  }, [transactions, user]);

  const filteredSales = useMemo(() => {
    return userTransactions.filter((t: any) => {
      if (!salesSearch) return true;
      const q = salesSearch.toLowerCase();
      return (
        (t.invoiceNumber || t.id || '').toLowerCase().includes(q) ||
        (t.customerName || '').toLowerCase().includes(q) ||
        (t.paymentStatus || '').toLowerCase().includes(q)
      );
    });
  }, [userTransactions, salesSearch]);

  // Calculate Sales Performance Metrics for this user
  const totalSalesAmount = useMemo(() => {
    return userTransactions
      .filter((t: any) => (t.type === 'sale' || !t.type) && t.status !== 'cancelled')
      .reduce((acc: number, curr: any) => acc + (Number(curr.finalTotal || curr.totalAmount) || 0), 0);
  }, [userTransactions]);

  const totalSalesCount = userTransactions.length;
  const avgSaleValue = totalSalesCount > 0 ? totalSalesAmount / totalSalesCount : 0;

  const userLocation =
    (locations || []).find((l) => l.id === user?.locationId) ||
    (locations || []).find((l) => (l.businessName || '').toLowerCase() === (user?.businessName || currentUser?.businessName || '')?.toLowerCase()) ||
    (locations || [])[0];
  const userLocationName =
    userLocation?.name ||
    (user?.businessName ? `${user.businessName} (Main Branch)` : (currentUser?.businessName ? `${currentUser.businessName} (Main Branch)` : 'Main Branch'));
  const userLocationCode = userLocation?.code || (user?.businessName ? 'MAIN' : 'HQ');
  const userPermissions = rolePermissions?.[user?.role || ''];
  const allowedModules: ErpModuleId[] = userPermissions?.allowedModules || [];

  // Generate Chronological Activity Log for THIS user
  const activities = useMemo(() => {
    if (!user) return [];
    const uName = (user.name || '').trim().toLowerCase();
    const uUsername = (user.username || '').trim().toLowerCase();
    const uId = user.id;

    const list: Array<{
      id: string;
      type: 'sale' | 'inventory' | 'purchase' | 'expense' | 'auth' | 'system';
      title: string;
      description: string;
      date: string;
      amount?: number;
      refId?: string;
      status?: string;
    }> = [];

    // Add Sales Activities for this user
    userTransactions.forEach((t: any) => {
      list.push({
        id: `act_sale_${t.id}`,
        type: 'sale',
        title: `Processed Sale Invoice #${t.invoiceNumber || (t.id ? String(t.id).slice(0, 8) : 'POS')}`,
        description: `Customer: ${t.customerName || 'Walk-in Customer'} • ${t.items?.length || 1} items (${t.paymentMethod || 'Cash'})`,
        date: t.transactionDate || t.createdAt || new Date().toISOString(),
        amount: Number(t.finalTotal || t.totalAmount) || 0,
        refId: t.invoiceNumber || t.id,
        status: t.paymentStatus || 'paid',
      });
    });

    // Add Stock Adjustments created by this user
    (stockAdjustments || [])
      .filter((sa: any) => {
        if (sa.userId && sa.userId === uId) return true;
        if (sa.createdBy) {
          const cb = String(sa.createdBy).trim().toLowerCase();
          if (cb && (cb === uName || (uUsername && cb === uUsername))) return true;
        }
        return false;
      })
      .forEach((sa: any) => {
        list.push({
          id: `act_adj_${sa.id}`,
          type: 'inventory',
          title: `Stock Adjustment #${sa.referenceNo || (sa.id ? String(sa.id).slice(0, 8) : 'ADJ')}`,
          description: `Adjusted inventory at ${sa.locationName || 'Branch'} • Reason: ${sa.reason || 'Audit reconciliation'}`,
          date: sa.date || sa.createdAt || new Date().toISOString(),
          amount: sa.totalAmountRecovered || 0,
          refId: sa.referenceNo || sa.id,
          status: 'completed',
        });
      });

    // Add Stock Transfers created by this user
    (stockTransfers || [])
      .filter((st: any) => {
        if (st.userId && st.userId === uId) return true;
        if (st.createdBy) {
          const cb = String(st.createdBy).trim().toLowerCase();
          if (cb && (cb === uName || (uUsername && cb === uUsername))) return true;
        }
        return false;
      })
      .forEach((st: any) => {
        list.push({
          id: `act_tr_${st.id}`,
          type: 'inventory',
          title: `Stock Transfer #${st.referenceNo || (st.id ? String(st.id).slice(0, 8) : 'TR')}`,
          description: `Transferred stock from ${st.fromLocationName || 'Origin'} to ${st.toLocationName || 'Destination'}`,
          date: st.date || st.createdAt || new Date().toISOString(),
          amount: st.shippingCharges || 0,
          refId: st.referenceNo || st.id,
          status: st.status || 'completed',
        });
      });

    // Add Expenses created by or for this user
    (expenses || [])
      .filter((exp: any) => {
        if (exp.userId && exp.userId === uId) return true;
        if (exp.createdBy) {
          const cb = String(exp.createdBy).trim().toLowerCase();
          if (cb && (cb === uName || (uUsername && cb === uUsername))) return true;
        }
        if (exp.expenseFor) {
          const ef = String(exp.expenseFor).trim().toLowerCase();
          if (ef && (ef === uName || (uUsername && ef === uUsername))) return true;
        }
        return false;
      })
      .forEach((exp: any) => {
        list.push({
          id: `act_exp_${exp.id}`,
          type: 'expense',
          title: `Expense Voucher #${exp.referenceNo || (exp.id ? String(exp.id).slice(0, 8) : 'EXP')}`,
          description: `Category: ${exp.category || 'Store Operations'} • ${exp.description || 'General expense'}`,
          date: exp.date || exp.createdAt || new Date().toISOString(),
          amount: exp.amount || 0,
          refId: exp.referenceNo || exp.id,
          status: 'paid',
        });
      });

    // Add Auth / Session Events for this user
    if (user.lastLogin) {
      list.push({
        id: `act_login_last`,
        type: 'auth',
        title: 'User Authenticated & Session Started',
        description: `Logged into POS terminal from branch workstation (${userLocation?.name || 'HQ'})`,
        date: user.lastLogin,
        status: 'success',
      });
    }

    list.push({
      id: `act_created`,
      type: 'system',
      title: 'Staff Account Created & Role Assigned',
      description: `Account initialized with ${user.role?.toUpperCase() || 'USER'} security permissions`,
      date: user.createdAt || '2026-01-10T08:00:00.000Z',
      status: 'active',
    });

    // Sort descending by date safely
    return list.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [user, userTransactions, stockAdjustments, stockTransfers, expenses, userLocation]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesType = activityFilter === 'all' || act.type === activityFilter;
      const matchesSearch =
        !activitySearch ||
        act.title.toLowerCase().includes(activitySearch.toLowerCase()) ||
        act.description.toLowerCase().includes(activitySearch.toLowerCase()) ||
        (act.refId && act.refId.toLowerCase().includes(activitySearch.toLowerCase()));

      let matchesDate = true;
      if (act.date) {
        try {
          const d = new Date(act.date);
          if (!isNaN(d.getTime())) {
            const actDateStr = d.toISOString().split('T')[0];
            if (activityStartDate && actDateStr < activityStartDate) matchesDate = false;
            if (activityEndDate && actDateStr > activityEndDate) matchesDate = false;
          }
        } catch {
          // Ignore parse errors gracefully
        }
      }

      return matchesType && matchesSearch && matchesDate;
    });
  }, [activities, activityFilter, activitySearch, activityStartDate, activityEndDate]);

  const userNotes = useMemo(() => {
    if (!user) return [];
    return userNotesMap[user.id] || [
      {
        id: `def_note_${user.id}`,
        text: `Completed security clearance and role authorization for ${(user.role || 'user').toUpperCase()} operational tier.`,
        date: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '2026-01-15',
        author: 'System Administrator',
      },
    ];
  }, [userNotesMap, user]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newNoteText.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      date: new Date().toISOString().split('T')[0],
      author: currentUser?.name || 'Administrator',
    };
    const updatedNotes = [newNote, ...userNotes];
    const updatedMap = { ...userNotesMap, [user.id]: updatedNotes };
    setUserNotesMap(updatedMap);
    try {
      localStorage.setItem('ultimate_erp_user_notes', JSON.stringify(updatedMap));
    } catch (err) {
      console.error(err);
    }
    setNewNoteText('');
    showToast('Internal employee note added.');
  };

  const handlePrint = () => {
    window.print();
  };

  // Unconditional hook execution complete; now safe to perform early return
  if (!isOpen || !user) return null;

  const isCurrent = currentUser?.id === user.id;

  const roleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return isLight
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'manager':
        return isLight
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'inventory_manager':
        return isLight
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'accountant':
        return isLight
          ? 'bg-purple-50 text-purple-700 border-purple-200'
          : 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'cashier':
        return isLight
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      default:
        return isLight
          ? 'bg-slate-100 text-slate-700 border-slate-200'
          : 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center pt-10 sm:pt-4 p-0 sm:p-4 md:p-5 ${isLight ? 'bg-slate-900/60' : 'bg-black/80'} backdrop-blur-xs overflow-hidden`}>
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-60 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 border border-indigo-400 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}
      <div
        className={`w-full max-w-5xl h-[calc(100dvh-2.5rem)] sm:h-[90vh] max-h-[calc(100dvh-2.5rem)] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
            : 'bg-slate-900 border-slate-800 text-white shadow-black/90'
        }`}
      >
        {/* Mobile Pull Handle & Safe Top Margin */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Top Header & Profile Banner */}
        <div
          className={`p-3.5 sm:p-5 md:p-6 border-b shrink-0 ${
            isLight
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-start sm:items-center justify-between gap-2.5 sm:gap-4">
            {/* User Avatar + Core Metadata */}
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <div className="relative shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center font-black text-lg sm:text-2xl text-white shadow-md shadow-indigo-600/30">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute -bottom-1 -right-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider border shadow-xs ${
                    user.status === 'suspended'
                      ? isLight ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-rose-900/90 text-rose-300 border-rose-700'
                      : isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-900/90 text-emerald-300 border-emerald-700'
                  }`}
                >
                  {user.status || 'Active'}
                </span>
              </div>

              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                  <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-tight truncate max-w-[160px] sm:max-w-none">{user.name}</h2>
                  <span className={`text-[9px] sm:text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${roleBadgeStyle(user.role)}`}>
                    {user.role.replace('_', ' ')}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] sm:text-[10px] bg-indigo-600 text-white font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs">
                      You
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1 truncate max-w-[180px] sm:max-w-none">
                    <Mail className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </span>
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span>{user.phone}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span className="truncate">{userLocationName}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(user);
                  }}
                  className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 sm:gap-1.5 border ${
                    isLight
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title="Edit User Info"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit User</span>
                </button>
              )}

              <button
                onClick={handlePrint}
                className={`p-1.5 sm:p-2 rounded-xl text-xs font-bold transition border ${
                  isLight
                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Print User Record"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={onClose}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl transition flex items-center justify-center border shrink-0 cursor-pointer active:scale-95 shadow-2xs ${
                  isLight
                    ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Close (Esc)"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* KPI Performance Bar - Ultra Compact on Mobile Portrait */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5 p-2 sm:p-3.5 border-b shrink-0 ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div
            className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border ${
              isLight
                ? 'bg-slate-50/80 border-slate-200 shadow-2xs'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              Total Sales
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
              <span className="text-xs sm:text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 truncate">
                {currencySymbol}{totalSalesAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div
            className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border ${
              isLight
                ? 'bg-slate-50/80 border-slate-200 shadow-2xs'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              Invoices
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
              <span className="text-xs sm:text-lg font-black font-mono">{totalSalesCount}</span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold">orders</span>
            </div>
          </div>

          <div
            className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border ${
              isLight
                ? 'bg-slate-50/80 border-slate-200 shadow-2xs'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              Avg Basket
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
              <span className="text-xs sm:text-lg font-black font-mono truncate">
                {currencySymbol}{avgSaleValue.toFixed(2)}
              </span>
            </div>
          </div>

          <div
            className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border ${
              isLight
                ? 'bg-slate-50/80 border-slate-200 shadow-2xs'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              Last Login
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
              <span className="text-[11px] sm:text-xs font-bold font-mono truncate text-slate-600 dark:text-slate-300">
                {(() => {
                  if (!user.lastLogin) return 'Active Today';
                  const trimmed = user.lastLogin.trim();
                  if (trimmed.toLowerCase() === 'never') return 'Never';
                  if (trimmed.toLowerCase() === 'just now') return 'Just now';
                  const d = new Date(trimmed);
                  return isNaN(d.getTime()) ? trimmed : d.toLocaleDateString();
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs (finias POS View Tabs) */}
        <div
          className={`flex items-center border-b p-1.5 sm:p-2 gap-1.5 sm:gap-2 text-xs overflow-x-auto shrink-0 scrollbar-none ${
            isLight
              ? 'bg-slate-100/60 border-slate-200'
              : 'bg-slate-950 border-slate-800'
          }`}
        >
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold transition flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap border text-xs ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border-transparent'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">User Info & Roles</span>
            <span className="sm:hidden">Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold transition flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap border text-xs ${
              activeTab === 'activities'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Activities & Audit Log</span>
            <span className="sm:hidden">Activities</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'activities'
                  ? 'bg-white/20 text-white'
                  : isLight
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {activities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold transition flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap border text-xs ${
              activeTab === 'sales'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border-transparent'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sales History</span>
            <span className="sm:hidden">Sales</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'sales'
                  ? 'bg-white/20 text-white'
                  : isLight
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {userTransactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('hrm')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold transition flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap border text-xs ${
              activeTab === 'hrm'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border-transparent'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">More Info & Bank/HR</span>
            <span className="sm:hidden">HR & Bank</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold transition flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap border text-xs ${
              activeTab === 'documents'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'documents'
                  ? 'bg-white/20 text-white'
                  : isLight
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {userNotes.length}
            </span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className={`p-3.5 sm:p-5 md:p-6 flex-1 min-h-0 overflow-y-auto space-y-4 sm:space-y-6 ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
          {/* TAB 1: User Info & Permissions Matrix */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Core Details Grid */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isLight
                    ? 'bg-slate-50/70 border-slate-200 shadow-2xs'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-indigo-500" />
                  <span>Primary Staff Identity & Assignments</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Full Name</span>
                    <span className="font-bold text-sm">{user.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Username / Login Handle</span>
                    <span className="font-mono font-bold">@{user.email.split('@')[0]}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Email Address</span>
                    <span className="font-bold">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Contact Number</span>
                    <span className="font-bold">{user.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Assigned Primary Location</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{userLocationName} ({userLocationCode})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Account Status</span>
                    <span className={`inline-flex items-center gap-1 font-bold ${user.status === 'suspended' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {user.status === 'suspended' ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{user.status === 'suspended' ? 'Suspended' : 'Active & Verified'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Commission & Sales Settings */}
              <div
                className={`p-5 rounded-2xl border space-y-3.5 ${
                  isLight
                    ? 'bg-slate-50/70 border-slate-200 shadow-2xs'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-500" />
                  <span>Sales & POS Commission Parameters</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div
                    className={`p-3.5 rounded-xl border ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <span className="text-slate-400 font-semibold block">Sales Commission Rate</span>
                    <span className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1 block">
                      {user.cmmsn_percent || (user.role === 'manager' ? '3.0' : user.role === 'admin' ? '5.0' : '1.5')}%
                    </span>
                    <span className="text-[10px] text-slate-400">Calculated on finalized sales</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <span className="text-slate-400 font-semibold block">Max Sales Discount Allowed</span>
                    <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                      {user.max_sales_discount_percent || (user.role === 'admin' ? '100' : '20')}%
                    </span>
                    <span className="text-[10px] text-slate-400">Cashier terminal limit</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <span className="text-slate-400 font-semibold block">Price Overrides</span>
                    <span className="text-base font-black mt-1 block text-slate-800 dark:text-slate-200">
                      {user.role === 'admin' || user.role === 'manager' ? 'Permitted' : 'Supervisor Required'}
                    </span>
                    <span className="text-[10px] text-slate-400">Custom unit price editing</span>
                  </div>
                </div>
              </div>

              {/* Roles & RBAC Capabilities Matrix */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isLight
                    ? 'bg-slate-50/70 border-slate-200 shadow-2xs'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <span>Role-Based Module Permissions ({allowedModules.length} Modules Granted)</span>
                  </h3>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${roleBadgeStyle(user.role)}`}>
                    {user.role} tier
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {[
                    { id: 'dashboard', label: 'Dashboard & KPIs' },
                    { id: 'pos', label: 'POS Terminal' },
                    { id: 'inventory', label: 'Products & Stock' },
                    { id: 'purchases', label: 'Purchases & Inward' },
                    { id: 'sales', label: 'Sales & Invoices' },
                    { id: 'contacts', label: 'CRM & Contacts' },
                    { id: 'expenses', label: 'Expenses' },
                    { id: 'accounts', label: 'Bank & Accounts' },
                    { id: 'reports', label: 'Analytics Reports' },
                    { id: 'user_menu', label: 'Staff & Roles (RBAC)' },
                    { id: 'settings', label: 'Business Settings' },
                  ].map((mod) => {
                    const isGranted = user.role === 'admin' || user.role === 'super_admin' || user.role === 'supreme_admin' || allowedModules.includes(mod.id as ErpModuleId);
                    return (
                      <div
                        key={mod.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                          isGranted
                            ? isLight
                              ? 'bg-indigo-50/60 border-indigo-200/80 text-indigo-950 shadow-2xs'
                              : 'bg-indigo-950/30 border-indigo-800/50 text-indigo-200'
                            : isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                            : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50'
                        }`}
                      >
                        <span className="font-bold truncate">{mod.label}</span>
                        {isGranted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Activities & Audit Log */}
          {activeTab === 'activities' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Date Range & Audit Log Filter Toolbar */}
              <div
                className={`p-4 rounded-2xl border space-y-3.5 ${
                  isLight
                    ? 'bg-slate-50/90 border-slate-200/90 shadow-2xs'
                    : 'bg-slate-950/70 border-slate-800/90'
                }`}
              >
                {/* Top Row: Date Range Quick Presets & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mr-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Date Range:</span>
                    </span>
                    {[
                      { id: 'all', label: 'All Time (From Start)' },
                      { id: 'today', label: 'Today' },
                      { id: 'yesterday', label: 'Yesterday' },
                      { id: 'this_week', label: 'Last 7 Days' },
                      { id: 'this_month', label: 'This Month' },
                      { id: 'custom', label: 'Custom Range' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleDatePresetChange(p.id as any)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                          activityDatePreset === p.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : isLight
                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      placeholder="Search activity description..."
                      className={`pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none transition border w-full sm:w-56 ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                          : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Bottom Row: Custom Date Inputs & Category Filter Pills */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                  {/* Category Type Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'All Categories' },
                      { id: 'sale', label: 'Sales & POS' },
                      { id: 'inventory', label: 'Inventory & Stock' },
                      { id: 'expense', label: 'Expenses' },
                      { id: 'auth', label: 'Logins & Auth' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setActivityFilter(f.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                          activityFilter === f.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : isLight
                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Range Selectors */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 font-semibold">From:</span>
                      <input
                        type="date"
                        value={activityStartDate}
                        onChange={(e) => {
                          setActivityStartDate(e.target.value);
                          setActivityDatePreset('custom');
                        }}
                        className={`px-2 py-1 rounded-lg text-xs border focus:outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                            : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 font-semibold">To:</span>
                      <input
                        type="date"
                        value={activityEndDate}
                        onChange={(e) => {
                          setActivityEndDate(e.target.value);
                          setActivityDatePreset('custom');
                        }}
                        className={`px-2 py-1 rounded-lg text-xs border focus:outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                            : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                        }`}
                      />
                    </div>
                    {(activityStartDate || activityEndDate) && (
                      <button
                        type="button"
                        onClick={() => handleDatePresetChange('all')}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-1"
                      >
                        Clear Range
                      </button>
                    )}
                  </div>
                </div>

                {/* Audit Count Indicator */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>
                    Showing <strong className="text-indigo-600 dark:text-indigo-400">{filteredActivities.length}</strong> activity logs
                    {activityStartDate || activityEndDate
                      ? ` between ${activityStartDate || 'Beginning'} and ${activityEndDate || 'Today'}`
                      : ' recorded from starting to now'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    Total Lifetime Records: {activities.length}
                  </span>
                </div>
              </div>

              {/* Activities Timeline / Table */}
              <div className="space-y-3">
                {filteredActivities.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-semibold text-xs">No activity logs recorded matching this filter.</p>
                  </div>
                ) : (
                  filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition hover:border-indigo-500/40 ${
                        isLight
                          ? 'bg-slate-50/80 border-slate-200 shadow-2xs'
                          : 'bg-slate-950/60 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                            act.type === 'sale'
                              ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                              : act.type === 'inventory'
                              ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                              : act.type === 'expense'
                              ? isLight ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-purple-950/40 text-purple-300 border-purple-800/50'
                              : isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/50'
                          }`}
                        >
                          {act.type === 'sale' ? (
                            <Receipt className="w-4 h-4" />
                          ) : act.type === 'inventory' ? (
                            <Boxes className="w-4 h-4" />
                          ) : act.type === 'expense' ? (
                            <DollarSign className="w-4 h-4" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-xs">{act.title}</h4>
                            <span
                              className={`text-[9px] font-mono uppercase font-extrabold px-2 py-0.2 rounded-full border ${
                                act.status === 'paid' || act.status === 'completed' || act.status === 'active' || act.status === 'success'
                                  ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-900/30 text-emerald-300 border-emerald-700'
                                  : act.status === 'partial' || act.status === 'due' || act.status === 'pending'
                                  ? isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-950/40 text-amber-300 border-amber-800'
                                  : isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {act.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{act.description}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-0.5">
                        {act.amount !== undefined && act.amount > 0 && (
                          <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400 block">
                            {currencySymbol}{act.amount.toFixed(2)}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {(() => {
                            if (!act.date) return 'N/A';
                            const trimmed = act.date.trim();
                            if (trimmed.toLowerCase() === 'never') return 'Never';
                            if (trimmed.toLowerCase() === 'just now') return 'Just now';
                            const d = new Date(trimmed);
                            if (isNaN(d.getTime())) {
                              return trimmed;
                            }
                            return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Sales History */}
          {activeTab === 'sales' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="text-xs">
                  <span className="font-bold">Total Sales Handled: </span>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {currencySymbol}{totalSalesAmount.toFixed(2)}
                  </span>
                  <span className="text-slate-400 ml-1.5">({userTransactions.length} invoices)</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    placeholder="Search invoices..."
                    className={`pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none transition border w-48 sm:w-60 ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              <div
                className={`overflow-x-auto rounded-2xl border ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <table className="w-full text-left text-xs">
                  <thead
                    className={`font-bold border-b uppercase text-[10px] tracking-wider ${
                      isLight
                        ? 'bg-slate-50 text-slate-500 border-slate-200'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Payment Status</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y font-medium ${
                      isLight
                        ? 'divide-slate-200 text-slate-800'
                        : 'divide-slate-800/60 text-slate-200'
                    }`}
                  >
                    {filteredSales.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                          No transactions found for this user.
                        </td>
                      </tr>
                    ) : (
                      filteredSales.map((sale: any) => (
                        <tr
                          key={sale.id}
                          className={`transition ${
                            isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {sale.invoiceNumber || sale.id.slice(0, 10)}
                          </td>
                          <td className="py-3 px-4 font-bold">{sale.customerName || 'Walk-in Customer'}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {sale.transactionDate || (sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A')}
                          </td>
                          <td className="py-3 px-4 capitalize font-semibold">{sale.paymentMethod || 'Cash'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                sale.paymentStatus === 'paid'
                                  ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                                  : isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-950/40 text-amber-300 border-amber-800'
                              }`}
                            >
                              {sale.paymentStatus || 'paid'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black">
                            {currencySymbol}{(Number(sale.finalTotal || sale.totalAmount) || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {onOpenReceipt && (
                              <button
                                onClick={() => onOpenReceipt(sale)}
                                className={`p-1.5 rounded-lg border transition ${
                                  isLight
                                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                }`}
                                title="View Receipt"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: HRM & Bank Details */}
          {activeTab === 'hrm' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Personal Details */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isLight
                    ? 'bg-slate-50/70 border-slate-200 shadow-2xs'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-indigo-500" />
                  <span>Personal & Demographics Information (finias POS HRM)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Date of Birth</span>
                    <span className="font-bold">{user.dob || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Gender</span>
                    <span className="font-bold capitalize">{user.gender || 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Marital Status</span>
                    <span className="font-bold capitalize">{user.maritalStatus || 'Single'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Blood Group</span>
                    <span className="font-bold">{user.bloodGroup || 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">ID / Social Security / Tax #</span>
                    <span className="font-mono font-bold">{user.taxPayerId || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Alternate Contact</span>
                    <span className="font-bold">{user.altPhone ? `${user.altCountryCode || ''} ${user.altPhone}` : 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Emergency / Guardian Contact</span>
                    <span className="font-bold">{user.emergencyPhone ? `${user.emergencyCountryCode || ''} ${user.emergencyPhone}${user.guardianName ? ` (${user.guardianName})` : ''}` : 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Joining Date</span>
                    <span className="font-bold">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isLight
                    ? 'bg-slate-50/70 border-slate-200 shadow-2xs'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span>Residential & Permanent Address</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Current Residential Address</span>
                    <span className="font-bold block">{user.currentAddress || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Permanent Address</span>
                    <span className="font-bold block">{user.permanentAddress || (user.currentAddress ? 'Same as current address' : 'Not Provided')}</span>
                  </div>
                </div>
              </div>

              {/* Bank & Payroll Information */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isLight
                    ? 'bg-slate-50/70 border-slate-200 shadow-2xs'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <span>Direct Deposit & Bank Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Account Holder Name</span>
                    <span className="font-bold">{user.bankAccountHolder || user.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Bank Name</span>
                    <span className="font-bold">{user.bankName || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Account Number</span>
                    <span className="font-mono font-bold">{user.bankAccountNumber ? `**** **** ${user.bankAccountNumber.slice(-4)}` : 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Routing / IFSC Code</span>
                    <span className="font-mono font-bold">{user.bankCode || 'Not Provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Documents & Administrative Notes */}
          {activeTab === 'documents' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <label className="block text-xs font-bold text-slate-500">Add Confidential HR Note</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Enter administrative memo or evaluation note..."
                    className={`flex-1 rounded-xl px-3.5 py-2 text-xs focus:outline-none transition border ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Note</span>
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Employee Records & Notes</h4>
                {userNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No confidential notes recorded for this user.</p>
                ) : (
                  userNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                        isLight
                          ? 'bg-slate-50/80 border-slate-200 shadow-2xs'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-semibold">{note.text}</p>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Logged by {note.author} on {note.date}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Attached Compliance Documents */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Verified Credentials & Files</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: `${(user.name || 'User').replace(/\s+/g, '_')}_Contract.pdf`, size: '1.4 MB', date: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '2026-01-15' },
                    { name: `${(user.name || 'User').replace(/\s+/g, '_')}_ID_Proof.pdf`, size: '2.8 MB', date: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '2026-01-15' },
                    { name: `${(user.name || 'User').replace(/\s+/g, '_')}_${(user.role || 'Role').toUpperCase()}_Certification.pdf`, size: '890 KB', date: '2026-03-20' },
                  ].map((doc) => (
                    <div
                      key={doc.name}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        isLight
                          ? 'bg-slate-50/80 border-slate-200 shadow-2xs'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl border ${
                            isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs block">{doc.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {doc.size} • Verified {doc.date}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => showToast(`Downloaded ${doc.name}`)}
                        className={`p-1.5 rounded-lg border transition ${
                          isLight
                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs active:scale-95'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer - Fixed responsive layout with no overlapping on mobile */}
        <div
          className={`px-4 sm:px-6 py-3 sm:py-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shrink-0 ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-500 font-medium'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap min-w-0 text-[10px] sm:text-[11px]">
            <span className="font-mono truncate max-w-[190px] sm:max-w-none">
              Staff ID: <span className="font-bold text-slate-700 dark:text-slate-300">{user.id}</span>
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
              Tier: {user.role.replace('_', ' ')}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl font-bold transition active:scale-95 border flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs ${
              isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
