import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  Lock,
  Unlock,
  AlertTriangle,
  Banknote,
  Clock,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  X,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface PosRegisterLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExitSuccess: () => void;
}

export const PosRegisterLockModal: React.FC<PosRegisterLockModalProps> = ({
  isOpen,
  onClose,
  onExitSuccess,
}) => {
  const {
    cashRegister,
    closeRegister,
    verifyAdminOverride,
    settings,
    currentLocation,
    currentUser,
    users,
    pendingPosExitTarget,
    setPendingPosExitTarget,
    hasModuleAccess,
  } = useErp();

  const [activeTabMode, setActiveTabMode] = useState<'close_shift' | 'admin_override'>('close_shift');
  const [actualCashCount, setActualCashCount] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [adminPin, setAdminPin] = useState<string>('');
  const [overrideError, setOverrideError] = useState<string>('');
  const [isOverrideSuccess, setIsOverrideSuccess] = useState<boolean>(false);

  const expectedCashInDrawer = useMemo(() => {
    if (!cashRegister) return 0;
    return Math.max(0, cashRegister.openingCash + (cashRegister.cashSales || 0) - (cashRegister.totalExpenses || 0));
  }, [cashRegister]);

  // Set default counted cash once opened
  React.useEffect(() => {
    if (isOpen) {
      setActualCashCount(expectedCashInDrawer.toFixed(2));
      setOverrideError('');
      setIsOverrideSuccess(false);
      setAdminPin('');
    }
  }, [isOpen, expectedCashInDrawer]);

  if (!isOpen) return null;

  const countedNum = parseFloat(actualCashCount) || 0;
  const cashDiscrepancy = countedNum - expectedCashInDrawer;

  const fallbackTarget = hasModuleAccess('dashboard') ? 'dashboard' : (hasModuleAccess('sales') ? 'sales' : 'dashboard');
  const resolvedTarget = pendingPosExitTarget && hasModuleAccess(pendingPosExitTarget) ? pendingPosExitTarget : fallbackTarget;
  const targetTabLabel = resolvedTarget
    .replace('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Handle drawer close & exit
  const handleReconcileAndClose = (e: React.FormEvent) => {
    e.preventDefault();
    closeRegister(countedNum, closingNotes || 'Shift closed prior to exiting POS');
    setPendingPosExitTarget(null);
    onClose();
    onExitSuccess();
  };

  // Handle Admin Manager Override
  const handleAdminOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin.trim()) {
      setOverrideError('Please enter an Admin PIN or Supervisor password.');
      return;
    }

    const isValid = verifyAdminOverride(adminPin);
    if (isValid) {
      setOverrideError('');
      setIsOverrideSuccess(true);
      setTimeout(() => {
        setPendingPosExitTarget(null);
        onClose();
        onExitSuccess();
      }, 700);
    } else {
      setOverrideError('Invalid Admin credentials. Try: "admin123", "9999", or "admin"');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header with Security Badge */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30 text-amber-400 shrink-0">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-md">
                  Security Restriction
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentLocation?.name}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                Close Cash Register To Exit POS
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Policy Description Banner */}
        <div className="p-3.5 bg-amber-950/40 rounded-2xl border border-amber-800/50 text-xs text-amber-200/90 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>POS Register Shift is currently OPEN</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-200/80">
            Except for <strong>Admin</strong> users, staff cannot exit the POS screen without opening and closing the Cash Register. Reconcile drawer cash to close shift or request an Admin override.
          </p>
        </div>

        {/* Shift Summary Metrics */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Shift Active Cashier:</span>
            </span>
            <span className="font-bold text-white">
              {cashRegister.cashierName || currentUser?.name} ({currentUser?.role?.replace('_', ' ')})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-900">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400">Opening Float</div>
              <div className="text-xs font-bold text-slate-200 mt-0.5">
                {settings.currencySymbol}{cashRegister.openingCash.toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-emerald-400">Cash Sales</div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">
                +{settings.currencySymbol}{cashRegister.cashSales.toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-rose-400">Paid Out</div>
              <div className="text-xs font-bold text-rose-400 mt-0.5">
                -{settings.currencySymbol}{cashRegister.totalExpenses.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-semibold">Expected Cash in Drawer:</span>
            <span className="text-lg font-extrabold text-emerald-400 font-mono">
              {settings.currencySymbol}{expectedCashInDrawer.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tab Switcher: Close Shift vs Admin Override */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
          <button
            type="button"
            onClick={() => setActiveTabMode('close_shift')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTabMode === 'close_shift'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>1. Reconcile & Close Shift</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabMode('admin_override')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTabMode === 'admin_override'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>2. Admin Override</span>
          </button>
        </div>

        {/* TAB 1: CLOSE SHIFT FORM */}
        {activeTabMode === 'close_shift' && (
          <form onSubmit={handleReconcileAndClose} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                <label htmlFor="pos-actual-counted-cash">Counted Cash in Drawer ({settings.currencySymbol})</label>
                {Math.abs(cashDiscrepancy) < 0.01 ? (
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Exact Balance
                  </span>
                ) : cashDiscrepancy > 0 ? (
                  <span className="text-[11px] text-amber-400 font-bold">
                    +{settings.currencySymbol}{cashDiscrepancy.toFixed(2)} Overage
                  </span>
                ) : (
                  <span className="text-[11px] text-rose-400 font-bold">
                    -{settings.currencySymbol}{Math.abs(cashDiscrepancy).toFixed(2)} Shortage
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="pos-actual-counted-cash"
                  type="number"
                  step="0.01"
                  required
                  value={actualCashCount}
                  onChange={(e) => setActualCashCount(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono font-bold text-base px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                  placeholder={expectedCashInDrawer.toFixed(2)}
                />
                <button
                  type="button"
                  onClick={() => setActualCashCount(expectedCashInDrawer.toFixed(2))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold border border-slate-700 transition"
                >
                  Auto-Match
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="pos-closing-shift-notes" className="text-xs text-slate-400 font-semibold block mb-1">
                Closing Shift Remarks (Optional)
              </label>
              <input
                id="pos-closing-shift-notes"
                type="text"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="e.g. End of shift, drawer reconciled with zero discrepancy"
                className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Stay in POS
              </button>
              <button
                type="submit"
                id="pos-submit-close-and-exit-btn"
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 transition"
              >
                <Lock className="w-4 h-4" />
                <span>Close Register & Exit to {targetTabLabel}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ADMIN MANAGER OVERRIDE */}
        {activeTabMode === 'admin_override' && (
          <form onSubmit={handleAdminOverrideSubmit} className="space-y-3.5">
            <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/40 text-xs text-purple-200/90 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-purple-300">Manager Authorization</span>
                <p className="text-[11px] text-purple-200/70 mt-0.5">
                  An Admin/Manager can authenticate to authorize immediate exit while keeping the register open.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="pos-admin-override-pin" className="text-xs text-slate-300 font-semibold block mb-1">
                Admin Supervisor PIN / Password
              </label>
              <input
                id="pos-admin-override-pin"
                type="password"
                autoFocus
                value={adminPin}
                onChange={(e) => {
                  setAdminPin(e.target.value);
                  setOverrideError('');
                }}
                placeholder="Enter admin PIN (e.g. admin123 or 9999)..."
                className="w-full bg-slate-950 text-white font-mono font-bold text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
              />
              {overrideError && (
                <p className="text-xs text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{overrideError}</span>
                </p>
              )}
              {isOverrideSuccess && (
                <p className="text-xs text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Override Approved! Exiting POS...</span>
                </p>
              )}
            </div>

            {/* Quick Demo Admin Picker */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                Quick Demo Manager PINs
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['admin123', '9999', 'admin'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setAdminPin(code)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-purple-900/40 text-slate-300 hover:text-purple-300 border border-slate-700 rounded-lg text-[11px] font-mono transition"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="pos-submit-admin-override-btn"
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950 flex items-center justify-center gap-2 transition"
              >
                <UserCheck className="w-4 h-4" />
                <span>Authorize & Exit to {targetTabLabel}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
