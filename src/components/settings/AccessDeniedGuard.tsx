import React from 'react';
import { useErp, isUserAdmin } from '../../context/ErpContext';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';

interface AccessDeniedGuardProps {
  moduleName: string;
  moduleId: string;
  onNavigateHome?: () => void;
}

export const AccessDeniedGuard: React.FC<AccessDeniedGuardProps> = ({
  moduleName,
  moduleId,
  onNavigateHome,
}) => {
  const { currentUser, rolePermissions, setActiveTab, switchUser, users } = useErp();

  const userRole = currentUser?.role || 'cashier';
  const rolePerms = rolePermissions[userRole];
  const allowedModules = rolePerms?.allowedModules || [];

  const handleReturnToSafe = () => {
    if (onNavigateHome) {
      onNavigateHome();
      return;
    }
    if (allowedModules.includes('dashboard')) {
      setActiveTab('dashboard');
    } else if (allowedModules.includes('pos')) {
      setActiveTab('pos');
    } else if (allowedModules.length > 0) {
      setActiveTab(allowedModules[0]);
    } else {
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 animate-fadeIn">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Status Header */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Access Restricted
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Module Security Policy
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1.5">
              Restricted: {moduleName}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Your logged-in role (<span className="text-indigo-400 font-bold capitalize">{userRole.replace('_', ' ')}</span>) does not have sufficient permission to access the <span className="text-white font-medium">{moduleName}</span> module.
            </p>
          </div>
        </div>

        {/* User Identity Snapshot */}
        <div className="mt-6 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-white">{currentUser?.name}</p>
              <p className="text-[11px] text-slate-400">{currentUser?.email}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Assigned Role</span>
            <span className="text-xs font-extrabold text-indigo-300 capitalize bg-indigo-950/70 border border-indigo-700/50 px-2.5 py-0.5 rounded-lg inline-block mt-0.5">
              {userRole.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Modules Allowed for This Role */}
        <div className="mt-5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Modules Authorized for Your Role:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allowedModules.map((mod) => (
              <button
                key={mod}
                onClick={() => setActiveTab(mod)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="capitalize">{mod.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleReturnToSafe}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Accessible View</span>
          </button>

          {/* Quick Admin Role Switcher if Admin exists */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {users.find((u) => isUserAdmin(u)) && (
              <button
                onClick={() => {
                  const adminUser = users.find((u) => isUserAdmin(u));
                  if (adminUser) switchUser(adminUser);
                }}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                title="Switch to Admin account to test full access"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Switch to Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
