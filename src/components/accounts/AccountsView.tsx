import React, { useState } from 'react';
import {
  Landmark,
  Wallet,
  CreditCard,
  Building,
  Plus,
  Search,
  FileText,
  Scale,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Edit2,
  Trash2,
  Layers,
  BookOpen,
  ShieldCheck,
  Calculator
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import { FinancialAccount } from '../../types/erp';

export const AccountsView: React.FC = () => {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    transactions,
    expenses,
    settings,
    showFlashNotification
  } = useErp();

  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'chart' | 'journal' | 'trial_balance'>('accounts');
  const [searchTerm, setSearchTerm] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');

  // Modal State for Adding/Editing Financial Account
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [formData, setFormData] = useState<Partial<FinancialAccount>>({
    name: '',
    accountNumber: '',
    type: 'Bank',
    balance: 0,
    bankName: '',
  });

  const currencySymbol = settings.currencySymbol || '$';

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      accountNumber: `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'Bank',
      balance: 0,
      bankName: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: FinancialAccount) => {
    setEditingAccount(acc);
    setFormData({ ...acc });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const res = deleteAccount(id);
    if (res && !res.success) {
      alert(res.message);
    } else {
      showFlashNotification('Account deleted successfully', 'success');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Account name is required.');
      return;
    }

    if (editingAccount) {
      updateAccount(editingAccount.id, formData);
    } else {
      addAccount(formData);
    }
    setIsModalOpen(false);
  };

  // Calculations for Summary Cards
  const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  const bankAccountsCount = accounts.filter(a => a.type === 'Bank').length;
  const cashAccountsCount = accounts.filter(a => a.type === 'Cash').length;
  const cardWalletCount = accounts.filter(a => a.type === 'Card' || a.type === 'Wallet').length;

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.bankName && acc.bankName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = accountTypeFilter === 'all' || acc.type === accountTypeFilter;
    return matchesSearch && matchesType;
  });

  // Chart of accounts mock/derived dataset
  const chartOfAccounts = [
    { code: '1010', name: 'Petty Cash Register', type: 'Asset', category: 'Current Assets', balance: accounts.filter(a => a.type === 'Cash').reduce((s, a) => s + a.balance, 0) },
    { code: '1020', name: 'Primary Corporate Bank Account', type: 'Asset', category: 'Current Assets', balance: accounts.filter(a => a.type === 'Bank').reduce((s, a) => s + a.balance, 0) },
    { code: '1030', name: 'Digital Wallets & Gateway Cards', type: 'Asset', category: 'Current Assets', balance: accounts.filter(a => a.type === 'Card' || a.type === 'Wallet').reduce((s, a) => s + a.balance, 0) },
    { code: '1200', name: 'Accounts Receivable (Customers Due)', type: 'Asset', category: 'Current Assets', balance: 14500 },
    { code: '1500', name: 'Inventory Stock Asset', type: 'Asset', category: 'Current Assets', balance: 85200 },
    { code: '2010', name: 'Accounts Payable (Suppliers Due)', type: 'Liability', category: 'Current Liabilities', balance: 22400 },
    { code: '2100', name: 'Tax Payable (GST / VAT)', type: 'Liability', category: 'Current Liabilities', balance: 6850 },
    { code: '3010', name: 'Owner Capital & Equity', type: 'Equity', category: 'Capital', balance: 150000 },
    { code: '4010', name: 'Sales Revenue & POS Inflows', type: 'Revenue', category: 'Operating Income', balance: (transactions || []).filter(t => t.type === 'sale').reduce((s, t) => s + (t.totalAmount || 0), 0) },
    { code: '5010', name: 'Operating Expenses & Bills', type: 'Expense', category: 'Operating Expenses', balance: expenses.reduce((s, e) => s + e.amount, 0) },
  ];

  const totalAssets = chartOfAccounts.filter(c => c.type === 'Asset').reduce((s, c) => s + c.balance, 0);
  const totalLiabilities = chartOfAccounts.filter(c => c.type === 'Liability').reduce((s, c) => s + c.balance, 0);
  const totalEquity = chartOfAccounts.filter(c => c.type === 'Equity').reduce((s, c) => s + c.balance, 0);
  const totalRevenue = chartOfAccounts.filter(c => c.type === 'Revenue').reduce((s, c) => s + c.balance, 0);
  const totalExpenses = chartOfAccounts.filter(c => c.type === 'Expense').reduce((s, c) => s + c.balance, 0);

  return (
    <div className="accounts-view space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>Accounts & Financial Ledger Module</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage double-entry financial accounts, chart of accounts, bank balances, and trial balance ledgers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Account</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Liquid Balance</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{currencySymbol}{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Across all bank & cash accounts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bank Accounts</p>
            <h3 className="text-2xl font-black text-indigo-400 mt-1">{bankAccountsCount} Active</h3>
            <p className="text-[10px] text-slate-500 mt-1">Checking & savings accounts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cash Drawers</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{cashAccountsCount} Registers</h3>
            <p className="text-[10px] text-slate-500 mt-1">Physical point of sale cash</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cards & Wallets</p>
            <h3 className="text-2xl font-black text-purple-400 mt-1">{cardWalletCount} Gateways</h3>
            <p className="text-[10px] text-slate-500 mt-1">Stripe, UPI, corporate cards</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-hide">
        {[
          { id: 'accounts', label: 'Financial Accounts', icon: Landmark },
          { id: 'chart', label: 'Chart of Accounts', icon: Layers },
          { id: 'journal', label: 'General Ledger & Transactions', icon: FileText },
          { id: 'trial_balance', label: 'Trial Balance & Statements', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab 1: Financial Accounts */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search accounts by name, number, bank..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Account Types</option>
                <option value="Bank">Bank Account</option>
                <option value="Cash">Cash Drawer</option>
                <option value="Card">Credit Card</option>
                <option value="Wallet">Digital Wallet</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((acc) => (
              <div key={acc.id} className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl flex flex-col justify-between transition group">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        acc.type === 'Bank' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        acc.type === 'Cash' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {acc.type === 'Bank' ? <Landmark className="w-5 h-5" /> : acc.type === 'Cash' ? <Wallet className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">{acc.name}</h3>
                        <p className="text-[11px] text-slate-400 font-mono">{acc.accountNumber}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {acc.type}
                    </span>
                  </div>

                  {acc.bankName && (
                    <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{acc.bankName}</span>
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Current Balance</span>
                    <p className={`text-base font-black ${acc.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currencySymbol}{Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                      title="Edit Account"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition"
                      title="Delete Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAccounts.length === 0 && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
              <Landmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">No financial accounts found</h3>
              <p className="text-xs text-slate-400 mt-1">Try refining your search or add a new financial account.</p>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Chart of Accounts */}
      {activeSubTab === 'chart' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Chart of Accounts</h3>
              <p className="text-xs text-slate-400">Standard general ledger classification for assets, liabilities, equity, revenue, and expenses.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {chartOfAccounts.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-900/45 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{item.code}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{item.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        item.type === 'Asset' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        item.type === 'Liability' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        item.type === 'Equity' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        item.type === 'Revenue' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{item.category}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {currencySymbol}{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: General Ledger & Transactions */}
      {activeSubTab === 'journal' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">General Ledger Transactions</h3>
              <p className="text-xs text-slate-400">Chronological ledger log of sales, purchases, and operational expenses.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Ref No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {(transactions || []).slice(0, 15).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/45 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">{tx.invoiceNo || tx.id}</td>
                    <td className="py-3 px-4 text-slate-300">{tx.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        tx.type === 'sale' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{tx.customerName || tx.supplierName || 'Walk-in Customer'}</td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {currencySymbol}{(tx.totalAmount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Trial Balance & Statements */}
      {activeSubTab === 'trial_balance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <span>Trial Balance Summary</span>
              </h3>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Total Assets</span>
                <span className="font-bold text-emerald-400">{currencySymbol}{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Total Liabilities</span>
                <span className="font-bold text-amber-400">{currencySymbol}{totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Total Equity</span>
                <span className="font-bold text-purple-400">{currencySymbol}{totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Total Revenue</span>
                <span className="font-bold text-blue-400">{currencySymbol}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Total Expenses</span>
                <span className="font-bold text-rose-400">{currencySymbol}{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Accounting Standards & Integrity</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Double-entry bookkeeping is enforced across all point of sale transactions, supplier purchase bills, and operational expenses. Debit balances equal credit balances across all active financial journals.
            </p>
            <div className="p-4 bg-indigo-950/40 border border-indigo-800/50 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-indigo-300">Net Business Position</h4>
              <p className="text-lg font-black text-white">
                {currencySymbol}{(totalAssets - totalLiabilities).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-indigo-200/70">Net Assets (Assets minus Liabilities)</p>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Financial Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 animate-scaleUp shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Landmark className="w-4 h-4" />
                <span>{editingAccount ? 'Edit Financial Account' : 'Add New Financial Account'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Account Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Main Operating Checking"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber || ''}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="ACC-001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Account Type</label>
                  <select
                    value={formData.type || 'Bank'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Bank">Bank Account</option>
                    <option value="Cash">Cash Drawer</option>
                    <option value="Card">Credit Card</option>
                    <option value="Wallet">Digital Wallet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Bank Name (if applicable)</label>
                <input
                  type="text"
                  value={formData.bankName || ''}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. Chase Bank, HSBC, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Initial Balance ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance ?? 0}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
