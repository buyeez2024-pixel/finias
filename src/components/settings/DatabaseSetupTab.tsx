import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Lock,
  Layers,
  KeyRound,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  HardDrive,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  RotateCcw,
} from 'lucide-react';

export const DatabaseSetupTab: React.FC = () => {
  const { showFlashNotification } = useErp();
  
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbPrefix, setDbPrefix] = useState('pos_');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [dbStatus, setDbStatus] = useState<{
    tested: boolean;
    isConnected: boolean;
    message: string;
    serverInfo?: string;
    tableCounts?: {
      customers: number;
      products: number;
      suppliers: number;
      transactions: number;
      users: number;
      salesAgents: number;
      units: number;
      customerGroups: number;
      warranties: number;
      racks: number;
      taxRates: number;
      currencies: number;
      accounts: number;
      paymentMethods: number;
    };
  }>({
    tested: false,
    isConnected: false,
    message: 'Checking MySQL server connection...',
  });

  // Check live DB health on mount
  const checkLiveDbHealth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sync.php?action=pull&t=' + Date.now(), {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isConfigured && data.success) {
          const d = data.data || {};
          setDbStatus({
            tested: true,
            isConnected: true,
            message: 'Connected to live MySQL server! All tables active in phpMyAdmin.',
            tableCounts: {
              customers: Array.isArray(d.customers) ? d.customers.length : 0,
              products: Array.isArray(d.products) ? d.products.length : 0,
              suppliers: Array.isArray(d.suppliers) ? d.suppliers.length : 0,
              transactions: Array.isArray(d.transactions) ? d.transactions.length : 0,
              users: Array.isArray(d.users) ? d.users.length : 0,
              salesAgents: Array.isArray(d.sales_commission_agents) ? d.sales_commission_agents.length : 0,
              units: Array.isArray(d.units) ? d.units.length : 0,
              customerGroups: Array.isArray(d.customer_groups) ? d.customer_groups.length : 0,
              warranties: Array.isArray(d.warranties) ? d.warranties.length : 0,
              racks: Array.isArray(d.racks) ? d.racks.length : 0,
              taxRates: Array.isArray(d.tax_rates) ? d.tax_rates.length : 0,
              currencies: Array.isArray(d.currencies) ? d.currencies.length : 0,
              accounts: Array.isArray(d.accounts) ? d.accounts.length : 0,
              paymentMethods: Array.isArray(d.payment_methods) ? d.payment_methods.length : 0,
            },
          });
        } else {
          setDbStatus({
            tested: true,
            isConnected: false,
            message: data.message || 'Database configuration file missing or incomplete.',
          });
        }
      } else {
        setDbStatus({
          tested: true,
          isConnected: false,
          message: 'Unable to reach /api/sync.php backend script.',
        });
      }
    } catch (err: any) {
      setDbStatus({
        tested: true,
        isConnected: false,
        message: 'Network error or PHP offline. Exception: ' + (err?.message || 'Failed to fetch'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkLiveDbHealth();
  }, []);

  const handleTestAndSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbHost || !dbName || !dbUser) {
      showFlashNotification('Please enter Database Host, Name, and Username.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Test & save database config + auto-generate MySQL tables
      const res = await fetch('/api/sync.php?action=save_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbHost,
          dbPort,
          dbName,
          dbUser,
          dbPassword,
          dbPrefix,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showFlashNotification('MySQL Database connected & all tables generated in phpMyAdmin!', 'success');
        await checkLiveDbHealth();
      } else {
        showFlashNotification('Database error: ' + (data.message || 'Connection failed'), 'error');
      }
    } catch (err: any) {
      showFlashNotification('Failed to connect to MySQL server: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetForFreshInstall = async () => {
    setIsResetting(true);
    try {
      // Call system reset API
      const res = await fetch('/api/system.php?action=reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (res.ok) {
        // Clear all local storage locks
        if (typeof window !== 'undefined') {
          localStorage.clear();
          showFlashNotification('System reset successfully! Redirecting to 1-Click Installation Wizard...', 'success');
          setTimeout(() => {
            window.location.href = '/install';
          }, 1200);
        }
      } else {
        showFlashNotification('Reset failed. Please check file permissions on server.', 'error');
      }
    } catch (err: any) {
      showFlashNotification('Reset error: ' + err.message, 'error');
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className={`p-6 rounded-3xl border shadow-xl ${
        dbStatus.isConnected
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
          : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl ${
              dbStatus.isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  MySQL Database Health & Sync Status
                </h2>
                <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border ${
                  dbStatus.isConnected
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}>
                  {dbStatus.isConnected ? '🟢 Live Connected' : '🟡 Needs Configuration'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {dbStatus.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={checkLiveDbHealth}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {/* Live Table Counts in phpMyAdmin */}
        {dbStatus.isConnected && dbStatus.tableCounts && (
          <div className="mt-5 pt-4 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
              <Users className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Customers</p>
                <p className="text-sm font-black text-white">{dbStatus.tableCounts.customers} Records</p>
              </div>
            </div>
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
              <Package className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Products</p>
                <p className="text-sm font-black text-white">{dbStatus.tableCounts.products} Items</p>
              </div>
            </div>
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
              <ShoppingCart className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Transactions</p>
                <p className="text-sm font-black text-white">{dbStatus.tableCounts.transactions} Invoices</p>
              </div>
            </div>
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
              <HardDrive className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Suppliers</p>
                <p className="text-sm font-black text-white">{dbStatus.tableCounts.suppliers} Vendors</p>
              </div>
            </div>
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
              <Users className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Users</p>
                <p className="text-sm font-black text-white">{dbStatus.tableCounts.users} Accounts</p>
              </div>
            </div>
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Sales Reps</p>
                <p className="text-sm font-black text-white">{dbStatus.tableCounts.salesAgents} Agents</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Database Setup Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              Hostinger / cPanel MySQL Credentials
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your MySQL database details below to connect and automatically generate tables in phpMyAdmin.
            </p>
          </div>
        </div>

        <form onSubmit={handleTestAndSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Database Host <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={dbHost}
                onChange={(e) => setDbHost(e.target.value)}
                placeholder="localhost or 127.0.0.1"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Port
              </label>
              <input
                type="text"
                value={dbPort}
                onChange={(e) => setDbPort(e.target.value)}
                placeholder="3306"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Database Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                placeholder="e.g. u523883393_finiaspos"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                MySQL Username <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={dbUser}
                onChange={(e) => setDbUser(e.target.value)}
                placeholder="e.g. u523883393_finiasuser"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                MySQL Password
              </label>
              <input
                type="password"
                value={dbPassword}
                onChange={(e) => setDbPassword(e.target.value)}
                placeholder="Enter MySQL user password"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Table Prefix
              </label>
              <input
                type="text"
                value={dbPrefix}
                onChange={(e) => setDbPrefix(e.target.value)}
                placeholder="pos_"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>{isSaving ? 'Connecting & Generating Tables...' : 'Save & Initialize MySQL Tables Now'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Fresh Installation & System Reset Tool */}
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              Fresh Installation & System Reset Tool
            </h3>
            <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
              Want to perform a 100% clean, fresh setup from scratch? Clicking this button removes the server lock file (`system_status.json` and `db_config.json`) and launches the step-by-step 1-Click Installation Wizard.
            </p>
          </div>
        </div>

        {!showResetConfirm ? (
          <div className="pt-2 flex justify-start">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-rose-600/30"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start Fresh Installation Wizard</span>
            </button>
          </div>
        ) : (
          <div className="p-4 bg-slate-950 border border-rose-800 rounded-2xl space-y-3 animate-fadeIn">
            <p className="text-xs font-bold text-rose-300">
              ⚠️ Are you sure you want to reset the installation lock and re-run the Installation Wizard?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetForFreshInstall}
                disabled={isResetting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                {isResetting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Yes, Reset & Open Installation Wizard</span>
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
