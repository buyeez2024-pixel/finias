import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { BusinessSettings } from '../../types/erp';
import {
  Sparkles,
  Building2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

export const SystemUpdatesPage: React.FC = () => {
  const { settings, updateSettings } = useErp();
  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...settings }));
  }, [settings]);

  const handleFieldChange = <K extends keyof BusinessSettings>(field: K, value: BusinessSettings[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      updateSettings({ [field]: value });
      return next;
    });
  };

  const handleTriggerVersionUpdate = (type: 'patch' | 'minor' | 'major') => {
    const currentVer = formData.appVersion || 'v2.5.0';
    const cleanVer = currentVer.replace(/^v/, '');
    const parts = cleanVer.split('.').map((p) => parseInt(p, 10) || 0);
    let [major, minor, patch] = parts.length === 3 ? parts : [2, 5, 0];

    if (type === 'major') {
      major += 1;
      minor = 0;
      patch = 0;
    } else if (type === 'minor') {
      minor += 1;
      patch = 0;
    } else {
      patch += 1;
    }

    const nextVer = `v${major}.${minor}.${patch}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const nextBuild = `${nowStr.slice(0, 10)}-BUILD`;

    const typeDesc =
      type === 'major'
        ? 'Major Architectural System Upgrade'
        : type === 'minor'
        ? 'Feature Pack Release & Subsystem Update'
        : 'System Configuration & Security Patch';

    const newLog = {
      version: nextVer,
      releaseDate: nowStr,
      updatedBy: 'Admin (System Updates HQ)',
      type,
      description: `Applied ${typeDesc}. System parameters, modules, and footer settings synchronized.`,
    };

    const existingNotes = formData.appReleaseNotes || [];
    const updatedNotes = [newLog, ...existingNotes];

    const updatedForm = {
      ...formData,
      appVersion: nextVer,
      buildNumber: nextBuild,
      lastUpdatedDate: nowStr,
      appReleaseNotes: updatedNotes,
    };

    setFormData(updatedForm);
    updateSettings(updatedForm);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-16 animate-fadeIn max-w-7xl mx-auto">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-xs font-bold">System Release & Changelog Updated Successfully!</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Software Releases & Changelog</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5 pt-1">
            <span>System Updates & Version Control</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Manage application versioning, automated patch increments, copyright statements, and view complete historical software release changelogs.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800 shrink-0">
          <span className="text-xs text-slate-400 font-medium">Active Release:</span>
          <span className="font-mono font-black text-emerald-400 text-base">
            {formData.appVersion || 'v2.5.0'}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section Header Banner */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/20 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">App Version & Copyright HQ Engine</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AUTO-SYNC ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure copyright statement, brand attribution, app versioning, and trigger software releases.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Current Version:</span>
            <span className="font-mono font-black text-emerald-400 text-base bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
              {formData.appVersion || 'v2.5.0'}
            </span>
          </div>
        </div>

        {/* 1. COPYRIGHT STATEMENT & FOOTER DISPLAY */}
        <div className="bg-slate-950 border border-slate-850 p-5 sm:p-6 rounded-3xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            <span>Copyright Notice & Right-Hand Side Footer Configuration</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Copyright Statement Text <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.copyrightText || ''}
                onChange={(e) => handleFieldChange('copyrightText', e.target.value)}
                placeholder="© 2026 finias POS & Enterprise Systems. All Rights Reserved."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Displays in the Right-Hand Side Footer Bar on the Dashboard.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Brand / Company Owner Name
              </label>
              <input
                type="text"
                value={formData.copyrightCompany || ''}
                onChange={(e) => handleFieldChange('copyrightCompany', e.target.value)}
                placeholder="Royal Business Software HQ"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Attributed legal copyright holder name.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Show Right-Hand Dashboard Footer Bar</div>
              <div className="text-[11px] text-slate-400">
                Render the live copyright notice and version pill on the right side of the Dashboard.
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showFooter !== false}
                onChange={(e) => handleFieldChange('showFooter', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* 2. APP VERSION NUMBERING & AUTOMATIC UPDATE ENGINE */}
        <div className="bg-slate-950 border border-slate-850 p-5 sm:p-6 rounded-3xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>App Version Control & System Release Parameters</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Current App Version String
              </label>
              <input
                type="text"
                value={formData.appVersion || 'v2.5.0'}
                onChange={(e) => handleFieldChange('appVersion', e.target.value)}
                placeholder="e.g. v2.5.0"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-bold text-emerald-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Semantic version format (e.g. v2.5.0).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                System Build Identifier
              </label>
              <input
                type="text"
                value={formData.buildNumber || '2026.08.30-STABLE'}
                onChange={(e) => handleFieldChange('buildNumber', e.target.value)}
                placeholder="e.g. 2026.08.30-STABLE"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Build tag or commit timestamp.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Automatic Version Incrementation</div>
              <div className="text-[11px] text-slate-400">
                Automatically bump the patch version (e.g. v2.5.0 &rarr; v2.5.1) whenever system settings are updated or saved by Admin.
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoIncrementVersionOnUpdate !== false}
                onChange={(e) => handleFieldChange('autoIncrementVersionOnUpdate', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* 3. TRIGGER AUTOMATED SYSTEM RELEASE UPDATES */}
        <div className="bg-slate-950 border border-slate-850 p-5 sm:p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" />
                <span>Instant System Release Trigger</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Trigger a software update release. Automatically increments version string, updates system build date, and logs history.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleTriggerVersionUpdate('patch')}
              className="p-4 bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 rounded-2xl text-left space-y-1.5 transition group cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-400 group-hover:text-emerald-300">
                  Install Patch Update
                </span>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Increments patch number (e.g. v2.5.0 &rarr; v2.5.1). Applies minor bugfixes and security patches.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerVersionUpdate('minor')}
              className="p-4 bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 rounded-2xl text-left space-y-1.5 transition group cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-indigo-400 group-hover:text-indigo-300">
                  Install Minor Update
                </span>
                <ArrowUpRight className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Increments minor version (e.g. v2.5.0 &rarr; v2.6.0). Releases new feature modules and UI enhancements.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerVersionUpdate('major')}
              className="p-4 bg-slate-900 hover:bg-slate-800 border border-purple-500/30 rounded-2xl text-left space-y-1.5 transition group cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-purple-400 group-hover:text-purple-300">
                  Install Major Upgrade
                </span>
                <ArrowUpRight className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Increments major version (e.g. v2.5.0 &rarr; v3.0.0). Architectural system upgrade release.
              </p>
            </button>
          </div>
        </div>

        {/* 4. RELEASE HISTORY LOG TABLE */}
        <div className="bg-slate-950 border border-slate-850 p-5 sm:p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Software Release History & Changelog Log</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {formData.appReleaseNotes?.length || 0} Total Releases
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {(formData.appReleaseNotes || []).length === 0 ? (
              <div className="text-xs text-slate-500 italic text-center py-6 bg-slate-900 rounded-2xl">
                No previous release logs recorded yet.
              </div>
            ) : (
              (formData.appReleaseNotes || []).map((log: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        {log.version}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          log.type === 'major'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : log.type === 'minor'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {log.type || 'update'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {log.releaseDate}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{log.description}</p>
                  </div>

                  <span className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0 font-medium">
                    By {log.updatedBy || 'System'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
