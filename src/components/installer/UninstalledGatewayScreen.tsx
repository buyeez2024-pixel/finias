import React from 'react';
import {
  Wrench,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Database,
  UserCheck,
  Building2,
  CheckCircle2,
  Terminal,
  ExternalLink,
} from 'lucide-react';

interface UninstalledGatewayScreenProps {
  onStartInstallation: () => void;
}

export const UninstalledGatewayScreen: React.FC<UninstalledGatewayScreenProps> = ({
  onStartInstallation,
}) => {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-600 selection:text-white">
      {/* Dynamic Background Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      <div className="max-w-xl w-full space-y-6 relative z-10 animate-fadeIn">
        {/* Top Header Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-lg shadow-amber-500/10">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>Setup Action Required • System Uninitialized</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Installation & Setup Required
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Welcome to <strong className="text-indigo-400 font-bold">Finias POS Enterprise</strong>. This web application has been uploaded to your server, but it has not been initialized yet.
          </p>
        </div>

        {/* Notice Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-500" />

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <Wrench className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">
                Complete Setup Before Accessing Dashboard
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct access to point-of-sale registers or admin dashboards is restricted until the 1-Click Installation Wizard is completed.
              </p>
            </div>
          </div>

          {/* Setup Benefits List */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>What the Installation Wizard configures:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Business Name & Branding</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Currency & Tax Profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Supreme Admin Credentials</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Initial HQ Branch Location</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={onStartInstallation}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 group"
            >
              <Wrench className="w-4 h-4 text-amber-300 group-hover:rotate-45 transition-transform" />
              <span>Launch 1-Click Installation Wizard</span>
              <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
              <span>Setup URL: <code className="text-indigo-400 font-mono">/install</code> or <code className="text-indigo-400 font-mono">/setup</code></span>
              <span className="flex items-center gap-1 text-slate-400">
                <Terminal className="w-3 h-3 text-slate-500" />
                <span>v1.0 Enterprise Edition</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          Need help? Navigate directly to <a href="/setup" className="text-indigo-400 hover:underline font-mono">/setup</a> or <a href="/install" className="text-indigo-400 hover:underline font-mono">/install</a> in your browser.
        </p>
      </div>
    </div>
  );
};
