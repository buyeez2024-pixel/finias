import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { KeyRound, Lock, Check, Save } from 'lucide-react';

export const PosSecurityTab: React.FC = () => {
  const { settings, updateSettings } = useErp();
  const [pin, setPin] = useState(settings.adminOverridePin || 'admin123');
  const [shiftLock, setShiftLock] = useState(settings.enablePosShiftLock ?? false);
  const [branchRestriction, setBranchRestriction] = useState(settings.enableBranchRestriction ?? false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      adminOverridePin: pin.trim(),
      enablePosShiftLock: shiftLock,
      enableBranchRestriction: branchRestriction,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <span>POS Terminal & Shift Security Policies</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforce cash float reconciliation, configure manager supervisor override passwords, and drawer locking rules.
            </p>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Saved!' : 'Save Security Rules'}</span>
          </button>
        </div>

        <div className="space-y-5 text-xs">
          {/* Shift Lock Enforcement Toggle */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">POS Register Shift Lockout</span>
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
                  Anti-Theft Protocol
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When enabled, non-admin cashiers cannot leave the POS screen to access other dashboard modules unless they officially close their cash register drawer shift or have a supervisor enter an override code.
              </p>
            </div>
            <input
              type="checkbox"
              checked={shiftLock}
              onChange={(e) => setShiftLock(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Admin Override PIN */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <label className="block text-white font-bold text-xs">
              Supervisor / Manager Fast Override Code (PIN / Password)
            </label>
            <p className="text-[11px] text-slate-400">
              Used by managers and supervisors to unlock the register shift exit or approve restricted sales operations.
            </p>
            <div className="relative max-w-sm mt-2">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="e.g. admin123"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Default system override passwords: <code className="text-amber-300">admin123</code>, <code className="text-amber-300">1234</code>, or any admin user's credentials.
            </p>
          </div>

          {/* Branch restriction */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-white text-xs">Restrict Non-Admins to Assigned Branch Only</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Prevents cashiers and staff from switching location views to other warehouse branches without managerial approval.
              </p>
            </div>
            <input
              type="checkbox"
              checked={branchRestriction}
              onChange={(e) => setBranchRestriction(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
