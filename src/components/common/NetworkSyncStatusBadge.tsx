import React from 'react';
import { useErp } from '../../context/ErpContext';
import { Wifi, WifiOff, RefreshCw, AlertCircle, Database } from 'lucide-react';

interface NetworkSyncStatusBadgeProps {
  onClick?: () => void;
  className?: string;
  variant?: 'compact' | 'full';
}

export const NetworkSyncStatusBadge: React.FC<NetworkSyncStatusBadgeProps> = ({
  onClick,
  className = '',
  variant = 'full',
}) => {
  const {
    isEffectiveOnline,
    offlineQueue,
    syncStatus,
  } = useErp();

  const pendingCount = offlineQueue.filter(
    (q) => q.status === 'pending' || q.status === 'syncing'
  ).length;

  if (syncStatus === 'syncing') {
    return (
      <button
        id="network-sync-status-badge"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition cursor-pointer ${className}`}
        title="Synchronizing queued offline transactions with central database..."
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
        <span>Syncing{pendingCount > 0 ? ` (${pendingCount})` : '...'}</span>
      </button>
    );
  }

  if (!isEffectiveOnline) {
    return (
      <button
        id="network-sync-status-badge"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer group ${className}`}
        title="Offline Mode Active - POS transactions are safely queued in local storage"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <WifiOff className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
        <span>
          {variant === 'compact'
            ? `Offline${pendingCount > 0 ? ` (${pendingCount})` : ''}`
            : `Offline Mode${pendingCount > 0 ? ` • ${pendingCount} Queued` : ''}`}
        </span>
      </button>
    );
  }

  if (pendingCount > 0) {
    return (
      <button
        id="network-sync-status-badge"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer ${className}`}
        title="Online - Pending transactions awaiting sync"
      >
        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
        <span>
          {pendingCount} Queued {variant === 'full' ? '(Click to Sync)' : ''}
        </span>
      </button>
    );
  }

  return (
    <button
      id="network-sync-status-badge"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer group ${className}`}
      title="Online & Synchronized with Royal Cloud Database"
    >
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
      </span>
      <Wifi className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
      <span>{variant === 'compact' ? 'Online' : 'Cloud Synced'}</span>
    </button>
  );
};
