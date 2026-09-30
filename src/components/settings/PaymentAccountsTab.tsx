import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Landmark, ShieldCheck, Tag, Info, AlertTriangle, CreditCard, Building, Check, X } from 'lucide-react';
import { useErp } from '../../context/ErpContext';

interface PaymentAccount {
  id: string;
  name: string;
  accountNumber: string;
  accountType: 'Bank Account' | 'Cash' | 'Credit Card' | 'E-Wallet';
  balance: number;
  note: string;
  isDefault: boolean;
}

export const PaymentAccountsTab: React.FC = () => {
  const { settings, showFlashNotification } = useErp();
  const isLight = settings?.themeMode === 'light';
  
  // Initial demo data
  const [accounts, setAccounts] = useState<PaymentAccount[]>([
    {
      id: 'acc_1',
      name: 'Main Company Cash',
      accountNumber: 'CASH-01',
      accountType: 'Cash',
      balance: 15000,
      note: 'Main physical cash register balance',
      isDefault: true,
    },
    {
      id: 'acc_2',
      name: 'HSBC Corporate',
      accountNumber: '998-123456-001',
      accountType: 'Bank Account',
      balance: 245000,
      note: 'Primary corporate checking',
      isDefault: false,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);

  const [formData, setFormData] = useState<Partial<PaymentAccount>>({
    name: '',
    accountNumber: '',
    accountType: 'Bank Account',
    balance: 0,
    note: '',
    isDefault: false,
  });

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      accountNumber: '',
      accountType: 'Bank Account',
      balance: 0,
      note: '',
      isDefault: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (account: PaymentAccount) => {
    setEditingAccount(account);
    setFormData({ ...account });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment account?')) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      showFlashNotification('Payment account deleted successfully');
    }
  };

  const handleSave = () => {
    if (!formData.name) {
      alert('Account name is required.');
      return;
    }

    if (editingAccount) {
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === editingAccount.id) {
            return { ...a, ...formData } as PaymentAccount;
          }
          // If this one is set as default, unset others
          if (formData.isDefault && a.id !== editingAccount.id) {
            return { ...a, isDefault: false };
          }
          return a;
        })
      );
      showFlashNotification('Payment account updated successfully');
    } else {
      const newAccount: PaymentAccount = {
        ...(formData as PaymentAccount),
        id: `acc_${Date.now()}`,
      };
      setAccounts((prev) => {
        if (newAccount.isDefault) {
          return [...prev.map(a => ({ ...a, isDefault: false })), newAccount];
        }
        return [...prev, newAccount];
      });
      showFlashNotification('Payment account added successfully');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn w-full max-w-full min-w-0 flex-shrink-0 mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0">
          <h2 className="text-sm font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <Landmark className="w-5 h-5 shrink-0" />
            <span>Financial Payment Accounts</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 break-words">
            Manage your business bank accounts, cash registers, and credit lines for incoming and outgoing payments.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center w-full min-w-0 ${isLight ? 'border-slate-300 bg-slate-50' : 'border-slate-800 bg-slate-900/50'}`}>
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
            <Landmark className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>No Payment Accounts</h3>
          <p className={`text-sm mb-6 max-w-md ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Add financial accounts to track deposits, withdrawals, and current balances across your business operations.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Account</span>
          </button>
        </div>
      ) : (
        <div className={`rounded-2xl sm:rounded-3xl border overflow-hidden w-full max-w-full min-w-0 shadow-sm dark:shadow-xl ${isLight ? 'bg-slate-900 border-slate-800 shadow-xl' : 'border-slate-800 bg-slate-900/50'}`}>
          {/* Mobile Swipe Hint */}
          <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 sm:hidden">
            <span>⇄ Swipe table horizontally to view all account details & actions</span>
          </div>

          <div
            className="overflow-x-auto scrollbar-thin w-full max-w-full min-w-0"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
              overscrollBehaviorX: 'contain',
            }}
          >
            <table className="w-full text-left text-xs min-w-[620px] sm:min-w-[680px] border-collapse">
              <thead className={`text-xs uppercase font-bold border-b border-slate-800 ${isLight ? 'bg-slate-950 text-slate-400' : 'bg-slate-800/80 text-slate-400'}`}>
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap">Account Name</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Type</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Account Number</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Current Balance</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Default</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {accounts.map((account) => (
                  <tr key={account.id} className={`transition-colors ${isLight ? 'hover:bg-slate-800/30' : 'hover:bg-slate-800/30'}`}>
                    <td className={`px-4 py-3.5 font-bold whitespace-nowrap ${isLight ? 'text-white' : 'text-white'}`}>
                      <div>{account.name}</div>
                      {account.note && (
                        <p className="text-[10px] font-normal text-slate-400 mt-0.5 max-w-[200px] truncate">{account.note}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${
                        account.accountType === 'Bank Account' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        account.accountType === 'Credit Card' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        account.accountType === 'E-Wallet' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {account.accountType === 'Bank Account' && <Building className="w-3 h-3" />}
                        {account.accountType === 'Credit Card' && <CreditCard className="w-3 h-3" />}
                        {account.accountType === 'Cash' && <Landmark className="w-3 h-3" />}
                        {account.accountType === 'E-Wallet' && <Tag className="w-3 h-3" />}
                        {account.accountType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400 whitespace-nowrap">{account.accountNumber || '--'}</td>
                    <td className={`px-4 py-3.5 text-right font-mono font-black whitespace-nowrap ${account.balance < 0 ? 'text-rose-500' : (isLight ? 'text-emerald-400' : 'text-emerald-400')}`}>
                      {settings.currencySymbol || '$'}{account.balance.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {account.isDefault ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(account)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isLight ? 'text-indigo-400 hover:bg-indigo-500/20' : 'text-indigo-400 hover:bg-indigo-500/20'}`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isLight ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-400 hover:bg-rose-500/20'}`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE/EDIT ACCOUNT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${isLight ? 'bg-white' : 'bg-slate-900 border border-slate-700'}`}>
            <div className={`flex items-center justify-between p-4 sm:p-5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h2 className={`text-base sm:text-lg font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Landmark className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>{editingAccount ? 'Edit Payment Account' : 'Add Payment Account'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-2 rounded-xl transition ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Account Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'}`}
                    placeholder="e.g. Main Cash Register, Standard Bank Checking"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Account Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'}`}
                  >
                    <option value="Bank Account">Bank Account</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Account / Till Number
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber || ''}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'}`}
                    placeholder="Optional..."
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Initial Balance
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-bold">{settings.currencySymbol || '$'}</span>
                    </div>
                    <input
                      type="number"
                      value={formData.balance || 0}
                      onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                      disabled={!!editingAccount}
                      className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? 'bg-white border border-slate-300 text-slate-900 disabled:bg-slate-100 disabled:text-slate-500' : 'bg-slate-950 border border-slate-800 text-white disabled:bg-slate-900 disabled:text-slate-600'}`}
                    />
                  </div>
                  {editingAccount && (
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" /> Current balance can only be updated via transactions.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDefault || false}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                    <div>
                      <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        Set as Default Payment Account
                      </span>
                      <p className="text-[11px] text-slate-500">
                        This account will be pre-selected for sales and purchase payments.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Account Note / Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.note || ''}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'}`}
                    placeholder="Brief description about this account's purpose..."
                  />
                </div>
              </div>
            </div>

            <div className={`p-4 sm:p-5 border-t flex items-center justify-end gap-3 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/80'}`}>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 sm:px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
              <button
                onClick={handleSave}
                className="px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
