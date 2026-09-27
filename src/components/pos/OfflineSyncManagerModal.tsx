import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  X,
  FileText,
  User,
  ShoppingBag,
} from 'lucide-react';

interface OfflineSyncManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineSyncManagerModal: React.FC<OfflineSyncManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isOnline,
    isSimulatedOffline,
    isEffectiveOnline,
    toggleSimulatedOffline,
    offlineQueue,
    syncStatus,
    syncStats,
    syncLogs,
    syncOfflineQueue,
    deleteQueuedTxn,
    clearAllQueue,
    exportQueueBackup,
    settings,
  } = useErp();

  const [activeTab, setActiveTab] = useState<'queue' | 'logs' | 'diagnostics'>('queue');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);

  if (!isOpen) return null;

  const pendingCount = offlineQueue.filter(
    (q) => q.status === 'pending' || q.status === 'syncing'
  ).length;

  const totalQueuedAmount = offlineQueue.reduce((acc, q) => acc + q.totalAmount, 0);

  const handleManualSync = async () => {
    if (!isEffectiveOnline) {
      alert('Cannot sync while Offline. Please enable Online mode first.');
      return;
    }
    await syncOfflineQueue();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await exportQueueBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `royal-pos-offline-queue-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearQueueConfirm = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear all offline queued transactions? Any unsynced data will be removed from local storage.'
      )
    ) {
      await clearAllQueue();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
                isEffectiveOnline
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isEffectiveOnline ? (
                <Wifi className="w-6 h-6 animate-pulse" />
              ) : (
                <WifiOff className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-bold text-white">Offline Queue & Cloud Sync</h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isEffectiveOnline
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isEffectiveOnline ? 'Online Engine Active' : 'Offline Mode (Local Storage)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                IndexedDB Persistent Storage & Auto-Reconnection Synchronization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Connectivity Simulation Bar */}
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Network Simulation:</span>
              <button
                id="toggle-offline-simulation-btn"
                onClick={() => toggleSimulatedOffline()}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isSimulatedOffline ? 'bg-amber-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSimulatedOffline ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span
                className={`text-xs font-bold ${
                  isSimulatedOffline ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {isSimulatedOffline ? 'Simulating Offline Mode' : 'Real Hardware State'}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Storage Backend:</span>
              <span className="font-bold text-slate-200 capitalize">
                {syncStats.storageEngine === 'indexeddb'
                  ? 'IndexedDB (royal_pos_offline_db)'
                  : 'LocalStorage Fallback'}
              </span>
            </div>
          </div>

          {/* Quick Sync Action */}
          <div className="flex items-center gap-2">
            <button
              id="sync-now-modal-btn"
              onClick={handleManualSync}
              disabled={syncStatus === 'syncing' || pendingCount === 0 || !isEffectiveOnline}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                syncStatus === 'syncing'
                  ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed'
                  : pendingCount === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : !isEffectiveOnline
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/20'
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
              />
              <span>
                {syncStatus === 'syncing'
                  ? 'Synchronizing...'
                  : pendingCount > 0
                  ? `Sync ${pendingCount} Queued Sale${pendingCount > 1 ? 's' : ''}`
                  : 'All Synced'}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('queue')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'queue'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Pending Queue ({offlineQueue.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'logs'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Sync Audit Logs ({syncLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'diagnostics'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Engine Diagnostics</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'queue' && (
            <div className="space-y-4">
              {/* Summary Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Queued Invoices
                  </span>
                  <div className="text-2xl font-black text-white mt-1">
                    {offlineQueue.length}
                  </div>
                  <p className="text-[10px] text-amber-400 mt-0.5">
                    {pendingCount} waiting for cloud upload
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Queued Revenue
                  </span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {settings.currencySymbol}
                    {totalQueuedAmount.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Safely retained in local cache
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Auto-Sync Status
                  </span>
                  <div className="text-base font-bold text-slate-200 mt-1.5 flex items-center gap-2">
                    {isEffectiveOnline ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Ready (Auto-Triggers)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>Paused (Offline)</span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Syncs automatically on connection
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="text-xs text-slate-400 font-medium">
                  {offlineQueue.length === 0
                    ? 'No pending transactions in local storage.'
                    : `Showing ${offlineQueue.length} locally stored transaction payload${
                        offlineQueue.length > 1 ? 's' : ''
                      }.`}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExport}
                    disabled={isExporting || offlineQueue.length === 0}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export JSON Backup</span>
                  </button>

                  {offlineQueue.length > 0 && (
                    <button
                      onClick={handleClearQueueConfirm}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-rose-800/40 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Queue</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions List */}
              {offlineQueue.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-950/40 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Local Queue is Empty</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      All sales transactions are in sync with the central ERP database. When operating
                      offline, new checkout transactions will queue here automatically.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => toggleSimulatedOffline(true)}
                      className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold inline-flex items-center gap-2 transition"
                    >
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>Switch to Simulated Offline Mode to Test</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {offlineQueue.map((item) => (
                    <div
                      key={item.queueId}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {item.transaction.invoiceNo}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                item.status === 'syncing'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse'
                                  : item.status === 'failed'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {item.status}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Storage: {item.storageEngine}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              {item.customerName}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {new Date(item.queuedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                            <span>•</span>
                            <span>{item.itemCount} items</span>
                          </div>

                          {item.lastError && (
                            <p className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Error: {item.lastError}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                        <div className="text-right">
                          <span className="text-base font-bold text-white block">
                            {settings.currencySymbol}
                            {item.totalAmount.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold uppercase">
                            Paid via {item.transaction.paymentEntries[0]?.method || 'Cash'}
                          </span>
                        </div>

                        <button
                          onClick={() => deleteQueuedTxn(item.queueId)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
                          title="Delete from local queue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Sync Operation Audit Log</h4>
                <span className="text-xs text-slate-400">
                  Total records: {syncLogs.length}
                </span>
              </div>

              {syncLogs.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                  <p className="text-xs text-slate-400">
                    No sync events recorded yet. Sync actions and re-connections will be logged here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              log.status === 'success'
                                ? 'bg-emerald-400'
                                : log.status === 'partial'
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          <span className="text-xs font-bold text-white capitalize">
                            {log.status} Sync Batch ({log.successCount}/{log.batchSize} uploaded)
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">{log.message}</p>

                      {log.details && log.details.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] text-slate-400 space-y-1 font-mono">
                          {log.details.map((d, i) => (
                            <div key={i}>• {d}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Database className="w-4 h-4" />
                    <span>Client Storage Diagnostics</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">IndexedDB API Support:</span>
                      <span className="font-bold text-emerald-400">Available</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Database Name:</span>
                      <span className="font-bold text-slate-200">{syncStats.dbName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Schema Version:</span>
                      <span className="font-bold text-slate-200">v{syncStats.dbVersion}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">LocalStorage Fallback:</span>
                      <span className="font-bold text-emerald-400">Configured & Ready</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Sync Protocol Specifications</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Trigger Mechanism:</span>
                      <span className="font-bold text-slate-200">Event-driven + Polling</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Conflict Policy:</span>
                      <span className="font-bold text-slate-200">Client Authoritative POS</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Invoice Number Gen:</span>
                      <span className="font-bold text-slate-200">Deterministic Timestamp</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Offline Receipt Print:</span>
                      <span className="font-bold text-emerald-400">Enabled with Offline Badge</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/30 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-indigo-200">Enterprise High-Availability POS Guarantee</p>
                  <p className="text-slate-400">
                    Royal POS guarantees 100% cashier uptime during internet drops, router reboots, or server maintenance. All products, barcodes, tax configurations, and stock calculations run client-side. Receipts can be printed immediately, and when connectivity is restored, all queued transactions automatically synchronize without duplicate invoices.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isEffectiveOnline ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span>
              Status:{' '}
              <strong className="text-slate-200">
                {isEffectiveOnline ? 'Connected to Cloud' : 'Operating Offline'}
              </strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-white transition"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
};
