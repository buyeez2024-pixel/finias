import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Settings,
  ChevronUp,
  CheckCircle2,
  Clock,
  Info,
  ExternalLink,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardFooterBarProps {
  onOpenSettings?: () => void;
}

export const DashboardFooterBar: React.FC<DashboardFooterBarProps> = () => {
  const { settings, updateSettings, navigateToSettings, showFlashNotification } = useErp();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  // Fallbacks
  const copyrightText =
    settings.copyrightText || '© 2026 finias POS & Enterprise Systems. All Rights Reserved.';
  const appVersion = settings.appVersion || 'v2.5.0';
  const buildNumber = settings.buildNumber || '2026.08.30-STABLE';
  const lastUpdated = settings.lastUpdatedDate || new Date().toISOString().replace('T', ' ').slice(0, 16);
  const releaseNotes = settings.appReleaseNotes || [];

  // Helper to trigger automated software patch update
  const handleSimulateAutoUpdate = (updateType: 'patch' | 'minor' | 'major') => {
    setIsUpdating(true);
    setUpdateProgress(15);

    const timer1 = setTimeout(() => setUpdateProgress(45), 400);
    const timer2 = setTimeout(() => setUpdateProgress(80), 800);
    const timer3 = setTimeout(() => {
      setUpdateProgress(100);

      // Parse current version vX.Y.Z
      const cleanVer = appVersion.replace(/^v/, '');
      const parts = cleanVer.split('.').map((p) => parseInt(p, 10) || 0);
      let [major, minor, patch] = parts.length === 3 ? parts : [2, 5, 0];

      if (updateType === 'major') {
        major += 1;
        minor = 0;
        patch = 0;
      } else if (updateType === 'minor') {
        minor += 1;
        patch = 0;
      } else {
        patch += 1;
      }

      const newVersion = `v${major}.${minor}.${patch}`;
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const newBuild = `${nowStr.slice(0, 10)}-UPDATE`;

      const typeLabel = updateType === 'major' ? 'Major System Upgrade' : updateType === 'minor' ? 'Feature Enhancement' : 'Security Patch & Performance Fixes';

      const newLog = {
        version: newVersion,
        releaseDate: nowStr,
        updatedBy: 'Admin (System Auto-Update)',
        type: updateType,
        description: `Automated ${typeLabel} applied successfully. All database schemas, offline sync engines, and cache systems synchronized.`,
      };

      const updatedNotes = [newLog, ...releaseNotes];

      updateSettings({
        appVersion: newVersion,
        buildNumber: newBuild,
        lastUpdatedDate: nowStr,
        appReleaseNotes: updatedNotes,
      });

      setIsUpdating(false);
      setUpdateProgress(0);
      setShowUpdateModal(false);

      if (showFlashNotification) {
        showFlashNotification(`System successfully updated to ${newVersion}!`, 'success');
      }
    }, 1300);
  };

  const isDark = settings.themeMode === 'dark';

  return (
    <>
      {/* Right-Hand Side Dashboard Footer Bar */}
      <footer className={`mt-8 pt-4 pb-2 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs transition-colors ${
        isDark ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        {/* Left Side: System Health Status */}
        <div className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>System Engine Online</span>
          <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>•</span>
          <span className={`hidden md:inline ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
            Last Updated: <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>{lastUpdated}</span>
          </span>
        </div>

        {/* Right-Hand Side Footer Group */}
        <div className="flex flex-wrap items-center justify-end gap-3 text-right">
          {/* Copyright Statement */}
          <div className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>{copyrightText}</span>
          </div>

          <span className={`hidden sm:inline ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>|</span>

          {/* Version Badge & Update Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpdateModal(true)}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer border ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 hover:text-slate-900'
              }`}
              title="Click to check system updates & release notes"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 group-hover:rotate-12 transition-transform" />
              <span className={`font-mono font-bold text-[11px] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{appVersion}</span>
              <span className={`text-[9px] font-mono hidden lg:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ({buildNumber})
              </span>
              <span className={`ml-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                UPDATES
              </span>
            </button>
          </div>
        </div>
      </footer>

      {/* App System Updates & Version Control Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 text-indigo-400">
                  <Sparkles className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">System Version & App Updates</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      LIVE ENGINE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage software build releases, copyright configuration, and automatic patch updates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 hover:bg-slate-800 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Current System Status Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    Current Version
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5 flex items-center gap-2">
                    <span>{appVersion}</span>
                    <span className="text-xs font-sans font-medium text-slate-400 px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800">
                      {buildNumber}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-semibold">Status</div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Up to Date</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-900 flex justify-between">
                <span>Last System Update: <strong className="text-slate-200">{lastUpdated}</strong></span>
                <span>Auto-Increment: <strong className="text-indigo-400">{settings.autoIncrementVersionOnUpdate !== false ? 'ENABLED' : 'DISABLED'}</strong></span>
              </div>
            </div>

            {/* Update Actions */}
            {isUpdating ? (
              <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/30 space-y-3 text-center">
                <div className="flex items-center justify-center gap-2 text-indigo-300 font-bold text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Applying System Update & Synchronizing Schema...</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${updateProgress}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{updateProgress}% Completed</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Trigger Automated App Update:</span>
                  <span className="text-[10px] text-slate-500 font-normal">Auto-bumps version & logs history</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => handleSimulateAutoUpdate('patch')}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left space-y-1 transition group"
                  >
                    <div className="font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center justify-between">
                      <span>Patch Update</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                    <div className="text-[10px] text-slate-400">Bugfixes & Security (v+.+.1)</div>
                  </button>

                  <button
                    onClick={() => handleSimulateAutoUpdate('minor')}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left space-y-1 transition group"
                  >
                    <div className="font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center justify-between">
                      <span>Minor Update</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                    <div className="text-[10px] text-slate-400">New Features (v+.1.0)</div>
                  </button>

                  <button
                    onClick={() => handleSimulateAutoUpdate('major')}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left space-y-1 transition group"
                  >
                    <div className="font-bold text-purple-400 group-hover:text-purple-300 flex items-center justify-between">
                      <span>Major Release</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                    <div className="text-[10px] text-slate-400">System Upgrade (v+1.0.0)</div>
                  </button>
                </div>
              </div>
            )}

            {/* Copyright Preview */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Active Copyright Notice:</span>
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    navigateToSettings('business_settings', 'app_updates');
                  }}
                  className="text-indigo-400 hover:underline text-[10px]"
                >
                  Edit Notice
                </button>
              </div>
              <p className="font-mono text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                {copyrightText}
              </p>
            </div>

            {/* Update History */}
            {releaseNotes.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Recent Version Release History</span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {releaseNotes.slice(0, 5).map((log: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-[11px]">
                      <div className="flex items-center justify-between font-mono font-bold text-slate-200">
                        <span className="text-emerald-400">{log.version}</span>
                        <span className="text-[10px] text-slate-500 font-sans">{log.releaseDate}</span>
                      </div>
                      <p className="text-slate-400 mt-1 text-[11px]">{log.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  navigateToSettings('business_settings', 'app_updates');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Open Copyright & Version Settings</span>
              </button>

              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
