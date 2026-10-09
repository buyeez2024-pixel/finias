import { getApiUrl } from '../utils/apiBase';

export interface SystemStatusResponse {
  success: boolean;
  isInstalled: boolean;
  installedAt?: string | null;
  businessName?: string | null;
  adminEmail?: string | null;
  adminUsername?: string | null;
  settings?: any;
  adminUser?: any;
  logoUrl?: string | null;
}

export const checkServerSystemStatus = async (): Promise<SystemStatusResponse> => {
  // Check endpoints in order of priority: Node.js server, PHP on cPanel, static JSON mirrors
  const endpoints = [
    getApiUrl('api/system/status'),
    getApiUrl('api/system.php?action=status'),
    getApiUrl('system_status.json'),
    getApiUrl('api/system_status.json'),
  ];

  for (const endpoint of endpoints) {
    try {
      const url = endpoint + (endpoint.includes('?') ? '&' : '?') + 't=' + Date.now();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const text = await res.text();
        const trimmed = text.trim();
        // Guard against Apache rewrite returning index.html (starts with '<')
        if (trimmed && !trimmed.startsWith('<')) {
          const data = JSON.parse(trimmed);
          if (data && typeof data === 'object') {
            const isInstalled = Boolean(data.isInstalled || data.installationCompleted);
            const logo = data.logoUrl || data.logo || data.settings?.logoUrl || data.settings?.logo || null;
            return {
              success: true,
              isInstalled,
              installedAt: data.installedAt || null,
              businessName: data.businessName || null,
              adminEmail: data.adminEmail || null,
              adminUsername: data.adminUsername || null,
              settings: data.settings || null,
              adminUser: data.adminUser || null,
              logoUrl: logo,
            };
          }
        }
      }
    } catch {
      // Continue to next fallback endpoint
    }
  }

  // Local fallback (in case browser is offline or on standalone static hosting)
  const localInstalled = typeof window !== 'undefined' && (
    localStorage.getItem('pos_installed') === 'true' ||
    localStorage.getItem('app_installed') === 'true' ||
    localStorage.getItem('app_installation_completed') === 'true' ||
    localStorage.getItem('is_installed') === 'true' ||
    localStorage.getItem('system_installed') === 'true' ||
    localStorage.getItem('installation_locked') === 'true' ||
    localStorage.getItem('installation_wizard_deleted') === 'true'
  );

  return {
    success: true,
    isInstalled: localInstalled,
  };
};

export const completeServerInstallation = async (payload: {
  businessName?: string;
  adminName?: string;
  adminEmail?: string;
  adminUsername?: string;
  settings?: any;
  adminUser?: any;
  isDemoInstallation?: boolean;
  dbConfig?: any;
}): Promise<boolean> => {
  let anySuccess = false;
  const endpoints = [
    getApiUrl('api/system/install'),
    getApiUrl('api/system.php?action=install'),
    getApiUrl('api/system.php'),
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        anySuccess = true;
      }
    } catch {
      // Continue to next endpoint
    }
  }

  return anySuccess;
};

export const resetServerInstallation = async (): Promise<boolean> => {
  const endpoints = [
    getApiUrl('api/system/reset'),
    getApiUrl('api/system.php?action=reset'),
    getApiUrl('api/system.php'),
  ];

  for (const ep of endpoints) {
    try {
      await fetch(ep + (ep.includes('?') ? '&' : '?') + 'action=reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
    } catch {}
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('pos_installed');
    localStorage.removeItem('app_installed');
    localStorage.removeItem('app_installation_completed');
    localStorage.removeItem('is_installed');
    localStorage.removeItem('system_installed');
    localStorage.removeItem('installation_locked');
    localStorage.removeItem('installation_wizard_deleted');
    localStorage.removeItem('app_fresh_installed');
    localStorage.removeItem('installation_type');
    localStorage.removeItem('pos_db_engine');
    localStorage.removeItem('pos_db_name');
    localStorage.removeItem('pos_db_prefix');
    localStorage.removeItem('ultimate_erp_pos_database_v1_auth_user');
  }

  return true;
};
