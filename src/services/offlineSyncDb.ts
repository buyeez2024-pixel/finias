import { QueuedTransaction, SyncLogEntry, Transaction, OfflineSyncStats } from '../types/erp';

const DB_NAME = 'royal_pos_offline_db';
const DB_VERSION = 1;
const QUEUE_STORE = 'queued_transactions';
const LOGS_STORE = 'sync_logs';
const ARCHIVE_STORE = 'synced_archive';

const LS_QUEUE_KEY = 'royal_pos_offline_queue_ls';
const LS_LOGS_KEY = 'royal_pos_offline_logs_ls';

let dbInstance: IDBDatabase | null = null;
let activeEngine: 'indexeddb' | 'localstorage' = 'indexeddb';

/**
 * Checks if IndexedDB is available and functional in current environment
 */
const isIndexedDBAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
};

/**
 * Initialize IndexedDB or establish fallback to localStorage
 */
export const initOfflineDb = (): Promise<'indexeddb' | 'localstorage'> => {
  return new Promise((resolve) => {
    if (!isIndexedDBAvailable()) {
      activeEngine = 'localstorage';
      resolve('localstorage');
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for offline pending transactions
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'queueId' });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('queuedAt', 'queuedAt', { unique: false });
        }

        // Store for sync operation audit logs
        if (!db.objectStoreNames.contains(LOGS_STORE)) {
          const logsStore = db.createObjectStore(LOGS_STORE, { keyPath: 'id' });
          logsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for synced archive
        if (!db.objectStoreNames.contains(ARCHIVE_STORE)) {
          const archiveStore = db.createObjectStore(ARCHIVE_STORE, { keyPath: 'id' });
          archiveStore.createIndex('date', 'date', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        activeEngine = 'indexeddb';
        resolve('indexeddb');
      };

      request.onerror = () => {
        activeEngine = 'localstorage';
        resolve('localstorage');
      };

      request.onblocked = () => {
        activeEngine = 'localstorage';
        resolve('localstorage');
      };
    } catch {
      activeEngine = 'localstorage';
      resolve('localstorage');
    }
  });
};

export const getStorageEngine = (): 'indexeddb' | 'localstorage' => activeEngine;

// --- LocalStorage Fallback Helpers ---
const getLsQueue = (): QueuedTransaction[] => {
  try {
    const raw = localStorage.getItem(LS_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLsQueue = (queue: QueuedTransaction[]) => {
  try {
    localStorage.setItem(LS_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('LocalStorage queue set error:', err);
  }
};

const getLsLogs = (): SyncLogEntry[] => {
  try {
    const raw = localStorage.getItem(LS_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLsLogs = (logs: SyncLogEntry[]) => {
  try {
    localStorage.setItem(LS_LOGS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('LocalStorage logs set error:', err);
  }
};

/**
 * Queue a POS transaction for offline storage
 */
export const queueOfflineTransaction = async (
  transaction: Transaction,
  metadata?: { customerName?: string; locationName?: string }
): Promise<QueuedTransaction> => {
  await initOfflineDb();

  const queueId = `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const queuedItem: QueuedTransaction = {
    queueId,
    transaction: {
      ...transaction,
      syncStatus: 'pending',
      isOfflineCreated: true,
      offlineQueuedAt: now,
      offlineQueueId: queueId,
      storageBackend: activeEngine,
    },
    queuedAt: now,
    retryCount: 0,
    status: 'pending',
    customerName: metadata?.customerName || 'Walk-in Customer',
    locationName: metadata?.locationName || 'Main Store',
    totalAmount: transaction.totalAmount,
    itemCount: transaction.items.reduce((sum, item) => sum + item.quantity, 0),
    storageEngine: activeEngine,
  };

  if (activeEngine === 'indexeddb' && dbInstance) {
    return new Promise((resolve, reject) => {
      try {
        const tx = dbInstance!.transaction([QUEUE_STORE], 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const req = store.put(queuedItem);

        req.onsuccess = () => resolve(queuedItem);
        req.onerror = () => {
          // Fallback to LS if IndexedDB write fails
          const lsQ = getLsQueue();
          lsQ.unshift(queuedItem);
          setLsQueue(lsQ);
          resolve(queuedItem);
        };
      } catch (err) {
        const lsQ = getLsQueue();
        lsQ.unshift(queuedItem);
        setLsQueue(lsQ);
        resolve(queuedItem);
      }
    });
  } else {
    const queue = getLsQueue();
    queue.unshift(queuedItem);
    setLsQueue(queue);
    return queuedItem;
  }
};

/**
 * Get all queued transactions
 */
export const getAllQueuedTransactions = async (): Promise<QueuedTransaction[]> => {
  await initOfflineDb();

  if (activeEngine === 'indexeddb' && dbInstance) {
    return new Promise((resolve) => {
      try {
        const tx = dbInstance!.transaction([QUEUE_STORE], 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const req = store.getAll();

        req.onsuccess = () => {
          const items = (req.result as QueuedTransaction[]) || [];
          // Also check LS fallback items if any exist
          const lsItems = getLsQueue();
          const merged = [...items];
          for (const item of lsItems) {
            if (!merged.find((m) => m.queueId === item.queueId)) {
              merged.push(item);
            }
          }
          // Sort newest first
          merged.sort((a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime());
          resolve(merged);
        };

        req.onerror = () => {
          resolve(getLsQueue());
        };
      } catch {
        resolve(getLsQueue());
      }
    });
  } else {
    return getLsQueue();
  }
};

/**
 * Get pending (unsynced) transactions only
 */
export const getPendingQueuedTransactions = async (): Promise<QueuedTransaction[]> => {
  const all = await getAllQueuedTransactions();
  return all.filter((item) => item.status === 'pending' || item.status === 'failed');
};

/**
 * Mark a transaction as syncing
 */
export const markTransactionSyncing = async (queueId: string): Promise<void> => {
  await initOfflineDb();

  if (activeEngine === 'indexeddb' && dbInstance) {
    return new Promise((resolve) => {
      try {
        const tx = dbInstance!.transaction([QUEUE_STORE], 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const getReq = store.get(queueId);

        getReq.onsuccess = () => {
          if (getReq.result) {
            const updated = {
              ...getReq.result,
              status: 'syncing' as const,
              retryCount: (getReq.result.retryCount || 0) + 1,
            };
            store.put(updated);
          }
          resolve();
        };
        getReq.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } else {
    const queue = getLsQueue();
    const updated = queue.map((item) =>
      item.queueId === queueId
        ? { ...item, status: 'syncing' as const, retryCount: item.retryCount + 1 }
        : item
    );
    setLsQueue(updated);
  }
};

/**
 * Mark a transaction as successfully synced
 */
export const markTransactionSynced = async (
  queueId: string,
  syncedTxn?: Transaction
): Promise<void> => {
  await initOfflineDb();
  const now = new Date().toISOString();

  if (activeEngine === 'indexeddb' && dbInstance) {
    return new Promise((resolve) => {
      try {
        const tx = dbInstance!.transaction([QUEUE_STORE, ARCHIVE_STORE], 'readwrite');
        const queueStore = tx.objectStore(QUEUE_STORE);
        const archiveStore = tx.objectStore(ARCHIVE_STORE);

        const getReq = queueStore.get(queueId);
        getReq.onsuccess = () => {
          if (getReq.result) {
            const item = getReq.result;
            const updatedTxn: Transaction = {
              ...(syncedTxn || item.transaction),
              syncStatus: 'synced',
              syncedAt: now,
            };

            // Remove from active queue or mark synced
            queueStore.delete(queueId);
            archiveStore.put(updatedTxn);
          }
          resolve();
        };
        getReq.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } else {
    const queue = getLsQueue();
    const filtered = queue.filter((item) => item.queueId !== queueId);
    setLsQueue(filtered);
  }
};

/**
 * Mark a transaction sync attempt as failed with error reason
 */
export const markTransactionFailed = async (queueId: string, error: string): Promise<void> => {
  await initOfflineDb();

  if (activeEngine === 'indexeddb' && dbInstance) {
    return new Promise((resolve) => {
      try {
        const tx = dbInstance!.transaction([QUEUE_STORE], 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const getReq = store.get(queueId);

        getReq.onsuccess = () => {
          if (getReq.result) {
            const updated = {
              ...getReq.result,
              status: 'failed' as const,
              lastError: error,
            };
            store.put(updated);
          }
          resolve();
        };
        getReq.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } else {
    const queue = getLsQueue();
    const updated = queue.map((item) =>
      item.queueId === queueId ? { ...item, status: 'failed' as const, lastError: error } : item
    );
    setLsQueue(updated);
  }
};

/**
 * Delete a specific queued item manually
 */
export const deleteQueuedTransaction = async (queueId: string): Promise<void> => {
  await initOfflineDb();

  if (activeEngine === 'indexeddb' && dbInstance) {
    return new Promise((resolve) => {
      try {
        const tx = dbInstance!.transaction([QUEUE_STORE], 'readwrite');
        tx.objectStore(QUEUE_STORE).delete(queueId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } else {
    const queue = getLsQueue();
    setLsQueue(queue.filter((q) => q.queueId !== queueId));
  }
};

/**
 * Clear all queue
 */
export const clearAllOfflineQueue = async (): Promise<void> => {
  await initOfflineDb();

  if (activeEngine === 'indexeddb' && dbInstance) {
    return new Promise((resolve) => {
      try {
        const tx = dbInstance!.transaction([QUEUE_STORE], 'readwrite');
        tx.objectStore(QUEUE_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
  setLsQueue([]);
};

/**
 * Add a sync history log entry
 */
export const recordSyncLog = async (
  log: Omit<SyncLogEntry, 'id' | 'timestamp'>
): Promise<SyncLogEntry> => {
  await initOfflineDb();

  const entry: SyncLogEntry = {
    ...log,
    id: `synclog_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  if (activeEngine === 'indexeddb' && dbInstance) {
    return new Promise((resolve) => {
      try {
        const tx = dbInstance!.transaction([LOGS_STORE], 'readwrite');
        tx.objectStore(LOGS_STORE).put(entry);
        tx.oncomplete = () => resolve(entry);
        tx.onerror = () => {
          const lsLogs = getLsLogs();
          lsLogs.unshift(entry);
          setLsLogs(lsLogs.slice(0, 50));
          resolve(entry);
        };
      } catch {
        const lsLogs = getLsLogs();
        lsLogs.unshift(entry);
        setLsLogs(lsLogs.slice(0, 50));
        resolve(entry);
      }
    });
  } else {
    const lsLogs = getLsLogs();
    lsLogs.unshift(entry);
    setLsLogs(lsLogs.slice(0, 50));
    return entry;
  }
};

/**
 * Retrieve recent sync audit logs
 */
export const getSyncLogs = async (limit = 20): Promise<SyncLogEntry[]> => {
  await initOfflineDb();

  if (activeEngine === 'indexeddb' && dbInstance) {
    return new Promise((resolve) => {
      try {
        const tx = dbInstance!.transaction([LOGS_STORE], 'readonly');
        const store = tx.objectStore(LOGS_STORE);
        const req = store.getAll();

        req.onsuccess = () => {
          const logs = (req.result as SyncLogEntry[]) || [];
          logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          resolve(logs.slice(0, limit));
        };
        req.onerror = () => resolve(getLsLogs().slice(0, limit));
      } catch {
        resolve(getLsLogs().slice(0, limit));
      }
    });
  } else {
    return getLsLogs().slice(0, limit);
  }
};

/**
 * Get summary stats for UI indicators
 */
export const getOfflineSyncStats = async (): Promise<OfflineSyncStats> => {
  const queue = await getAllQueuedTransactions();
  const logs = await getSyncLogs(1);

  const pending = queue.filter((i) => i.status === 'pending' || i.status === 'syncing').length;
  const failed = queue.filter((i) => i.status === 'failed').length;
  const lastSync = logs.length > 0 ? logs[0].timestamp : null;

  return {
    pendingCount: pending,
    syncedCount: 0,
    failedCount: failed,
    lastSyncTime: lastSync,
    storageEngine: activeEngine,
    dbName: DB_NAME,
    dbVersion: DB_VERSION,
  };
};

/**
 * Export offline queue as JSON backup file string
 */
export const exportOfflineQueueJson = async (): Promise<string> => {
  const queue = await getAllQueuedTransactions();
  const logs = await getSyncLogs(50);
  const payload = {
    exportedAt: new Date().toISOString(),
    system: 'Royal POS Offline Sync Engine',
    engine: activeEngine,
    pendingQueue: queue,
    syncHistory: logs,
  };
  return JSON.stringify(payload, null, 2);
};
