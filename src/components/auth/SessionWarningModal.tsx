import React from 'react';
import { useErp } from '../../context/ErpContext';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';

export const SessionWarningModal: React.FC = () => {
  const { showSessionWarning, remainingSessionSeconds, extendSession, logout, settings } = useErp();

  if (!showSessionWarning) return null;

  const isLight = settings?.themeMode === 'light';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className={`max-w-md w-full rounded-3xl p-6 shadow-2xl border relative overflow-hidden transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        {/* Glow accent */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Inactivity Security Alert
              </span>
            </div>
            <h3 className="text-lg font-black mt-1.5">Session Expiring Soon</h3>
            <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              You have been inactive for a while. For security reasons, your active session will expire automatically.
            </p>
          </div>
        </div>

        {/* Countdown Box */}
        <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold">Auto Logout In:</span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 tracking-wider">
            {remainingSessionSeconds < 10 ? `0${remainingSessionSeconds}` : remainingSessionSeconds}s
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={logout}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out Now</span>
          </button>

          <button
            type="button"
            onClick={extendSession}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Stay Logged In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
