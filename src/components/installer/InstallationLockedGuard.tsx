import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, RefreshCw, AlertTriangle, Database, CheckCircle2, Lock, ArrowLeft } from 'lucide-react';
import { RoyalLogo } from '../common/RoyalLogo';
import { resetServerInstallation } from '../../services/systemService';

interface InstallationLockedGuardProps {
  onGoToDashboard: () => void;
  onUnlockSuccess: () => void;
}

export const InstallationLockedGuard: React.FC<InstallationLockedGuardProps> = ({
  onGoToDashboard,
  onUnlockSuccess,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    setResetError(null);
    try {
      await resetServerInstallation();
      // Brief pause to allow server file deletion to settle
      setTimeout(() => {
        setIsResetting(false);
        onUnlockSuccess();
      }, 600);
    } catch (err: any) {
      setIsResetting(false);
      setResetError(err?.message || 'Failed to unlock system. Please check server permissions.');
    }
  };

  const domain = typeof window !== 'undefined' ? window.location.hostname : 'farm.butabomma.in';

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-indigo-600 selection:text-white">
      {/* Background radial gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        {/* Header / Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <RoyalLogo className="h-12 w-auto" />

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Installation Active & Locked</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            System Already Installed
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
            This POS & ERP terminal is active on <span className="text-indigo-400 font-mono font-medium">{domain}</span>. The installer is locked to safeguard your live database.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Database Engine
            </span>
            <span className="font-semibold text-slate-200">MySQL / MariaDB Active</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Protection Lock
            </span>
            <span className="font-mono text-emerald-400 font-medium">api/system_status.json</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              Multi-Terminal Sync
            </span>
            <span className="text-indigo-300 font-medium">Live Background Polling</span>
          </div>
        </div>

        {resetError && (
          <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{resetError}</span>
          </div>
        )}

        {!showConfirmReset ? (
          <div className="space-y-3 pt-2">
            {/* Primary Action: Go to Dashboard */}
            <button
              type="button"
              onClick={onGoToDashboard}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/25 transition cursor-pointer"
            >
              <span>Go to Login / POS Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary Action: Unlock & Re-run */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition underline underline-offset-4 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Made a mistake or need to reinstall from scratch?</span>
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation Box for Emergency Reset */
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-200">
                  Unlock & Re-Run Installation Wizard?
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  This will remove the server lock file (<code className="text-amber-300 font-mono">system_status.json</code>) and database configuration (<code className="text-amber-300 font-mono">db_config.json</code>). You can then re-enter database credentials, store info, and admin setup from Step 1.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Unlocking...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Yes, Unlock & Reinstall</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 max-w-lg w-full text-center py-4 text-slate-600 text-xs">
        Powered by Royal POS & ERP &bull; Hostinger Central MySQL Architecture
      </div>
    </div>
  );
};
