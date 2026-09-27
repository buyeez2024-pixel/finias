export interface SystemStatusResponse {
  success: boolean;
  isInstalled: boolean;
  installedAt?: string | null;
  businessName?: string | null;
  adminEmail?: string | null;
  settings?: any;
  adminUser?: any;
}

export const checkServerSystemStatus = async (): Promise<SystemStatusResponse> => {
  try {
    const res = await fetch('/api/system/status');
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to fetch system status from server:', err);
  }

  // Local fallback
  const localInstalled = typeof window !== 'undefined' && (
    localStorage.getItem('pos_installed') === 'true' ||
    localStorage.getItem('app_installed') === 'true' ||
    localStorage.getItem('app_installation_completed') === 'true' ||
    localStorage.getItem('is_installed') === 'true' ||
    localStorage.getItem('system_installed') === 'true'
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
}): Promise<boolean> => {
  try {
    const res = await fetch('/api/system/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to report installation completion to server:', err);
    return false;
  }
};
