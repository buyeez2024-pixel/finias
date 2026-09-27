import React, { useState } from 'react';
import { useErp, isUserAdmin } from '../../context/ErpContext';
import { UserSession } from '../../types/erp';
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  ShieldCheck,
  ShieldAlert,
  Clock,
  XCircle,
  RefreshCw,
  LogOut,
  Sliders,
  Search,
  CheckCircle2,
  Globe,
  MapPin,
  UserCheck,
  UserX,
  Lock,
  Sparkles,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';

interface UserSessionsManagerProps {
  filterUserId?: string;
  showSettings?: boolean;
}

export const UserSessionsManager: React.FC<UserSessionsManagerProps> = ({
  filterUserId,
  showSettings = true,
}) => {
  const {
    currentUser,
    activeSessions,
    currentSession,
    terminateSession,
    terminateAllOtherSessions,
    touchSession,
    settings,
    updateSettings,
    showFlashNotification,
  } = useErp();

  const isLight = settings?.themeMode === 'light';
  const isAdmin = isUserAdmin(currentUser);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDevice, setFilterDevice] = useState<string>('all');

  // Configurable session settings
  const [sessionTimeout, setSessionTimeout] = useState<number>(settings.sessionTimeoutMinutes || 30);
  const [enforceSingleSession, setEnforceSingleSession] = useState<boolean>(
    settings.enforceSingleSessionPerUser ?? false
  );

  const handleSaveSessionSettings = () => {
    updateSettings({
      sessionTimeoutMinutes: sessionTimeout,
      enforceSingleSessionPerUser: enforceSingleSession,
    });
    showFlashNotification('Session security parameters updated successfully!', 'success');
  };

  // Filter sessions
  const visibleSessions = activeSessions.filter((sess) => {
    if (sess.status === 'revoked') return false;
    if (filterUserId && sess.userId !== filterUserId) return false;
    if (!isAdmin && sess.userId !== currentUser?.id) return false;

    if (filterDevice !== 'all' && sess.deviceType !== filterDevice) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = sess.userName?.toLowerCase().includes(q);
      const matchEmail = sess.userEmail?.toLowerCase().includes(q);
      const matchIp = sess.ipAddress?.toLowerCase().includes(q);
      const matchBrowser = sess.browser?.toLowerCase().includes(q);
      const matchOs = sess.os?.toLowerCase().includes(q);
      return matchName || matchEmail || matchIp || matchBrowser || matchOs;
    }

    return true;
  });

  const otherSessionsCount = visibleSessions.filter((s) => !s.isCurrentSession && s.userId === currentUser?.id).length;

  const renderDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-emerald-400" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-indigo-400" />;
      case 'pos_terminal':
        return <Monitor className="w-5 h-5 text-amber-400" />;
      case 'desktop':
      default:
        return <Laptop className="w-5 h-5 text-blue-400" />;
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const ms = Date.now() - new Date(isoString).getTime();
    if (ms < 60000) return 'Just now';
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Actions */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden shadow-xl ${
        isLight
          ? 'bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border-indigo-100'
          : 'bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Active User Sessions & Connected Devices
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {visibleSessions.length} Active
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Monitor active device tokens, browser sessions, IP addresses, and revoke suspicious or stale logins in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={touchSession}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ping Heartbeat</span>
            </button>

            {otherSessionsCount > 0 && (
              <button
                type="button"
                onClick={terminateAllOtherSessions}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition flex items-center gap-1.5 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Revoke All Other Sessions ({otherSessionsCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global Session Security Configuration (Admins Only) */}
      {showSettings && isAdmin && (
        <div className={`p-5 rounded-2xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Session Security Policy & Inactivity Controls
              </h4>
            </div>
            <button
              type="button"
              onClick={handleSaveSessionSettings}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Policy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Session Timeout */}
            <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Inactivity Session Timeout</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </label>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value={15}>15 Minutes (Strict Security)</option>
                <option value={30}>30 Minutes (Recommended)</option>
                <option value={60}>1 Hour (Standard Shift)</option>
                <option value={240}>4 Hours (Extended Operational)</option>
                <option value={480}>8 Hours (Full Working Day)</option>
                <option value={1440}>24 Hours (POS Terminal Persistent)</option>
                <option value={0}>Never Expire (Continuous Operations)</option>
              </select>
              <p className="text-[10px] text-slate-500 leading-tight">
                Automatically triggers a 60-second warning modal before locking or terminating idle sessions.
              </p>
            </div>

            {/* Concurrent Session Control */}
            <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Enforce Single Active Session Per User</span>
                </label>
                <button
                  type="button"
                  onClick={() => setEnforceSingleSession(!enforceSingleSession)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    enforceSingleSession ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                When enabled, logging in from a new device automatically revokes all previous active sessions for that user.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, IP, browser..."
            className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                : 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'desktop', 'mobile', 'tablet', 'pos_terminal'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setFilterDevice(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap border ${
                filterDevice === d
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d === 'all' ? 'All Devices' : d.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Grid / List */}
      {visibleSessions.length === 0 ? (
        <div className={`p-10 text-center rounded-3xl border ${
          isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}>
          <ShieldAlert className="w-10 h-10 mx-auto text-slate-500 mb-2 opacity-50" />
          <p className="text-sm font-bold">No active sessions match your search criteria.</p>
          <p className="text-xs text-slate-500 mt-1">All active user logins and device tokens are secured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleSessions.map((sess) => {
            const isMe = sess.isCurrentSession || sess.id === currentSession?.id;

            return (
              <div
                key={sess.id}
                className={`p-4 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                  isMe
                    ? isLight
                      ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-md'
                      : 'bg-slate-900 border-indigo-500/50 ring-2 ring-indigo-500/20 shadow-xl'
                    : isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Accent Status Line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isMe ? 'bg-indigo-500' : 'bg-slate-700'
                  }`}
                />

                <div className="space-y-3">
                  {/* Card Header: User & Badges */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isMe
                          ? 'bg-indigo-500/10 border-indigo-500/30'
                          : isLight
                          ? 'bg-slate-100 border-slate-200'
                          : 'bg-slate-800 border-slate-700'
                      }`}>
                        {renderDeviceIcon(sess.deviceType)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-extrabold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {sess.userName}
                          </span>
                          {isMe && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                              This Device
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {sess.userEmail} • <span className="capitalize">{sess.userRole.replace('_', ' ')}</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                      {sess.ipAddress}
                    </span>
                  </div>

                  {/* Environment & Location Meta */}
                  <div className={`p-3 rounded-xl border text-xs grid grid-cols-2 gap-2 ${
                    isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Browser & OS</span>
                      <p className={`font-semibold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {sess.browser} on {sess.os}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Terminal Location</span>
                      <p className={`font-semibold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {sess.locationName || 'Main HQ'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Login Time</span>
                      <p className={`font-mono text-[11px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {new Date(sess.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Last Activity</span>
                      <p className="font-semibold text-emerald-400">
                        {formatRelativeTime(sess.lastActiveTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono truncate">
                    <span>Token:</span>
                    <span className="truncate max-w-[120px]">{sess.token}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => terminateSession(sess.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                      isMe
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isLight
                        ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200'
                        : 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{isMe ? 'Logout This Device' : 'Revoke Session'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
