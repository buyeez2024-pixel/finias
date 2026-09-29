/**
 * Resolves API endpoints dynamically based on the current subfolder or root path.
 * Supports root deployments (/api/...) and subfolder deployments (/farm/api/...).
 */
export const getApiUrl = (endpoint: string): string => {
  const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/farm/') || pathname === '/farm') {
      return `/farm/${clean}`;
    }
    return `/${clean}`;
  }
  return `/${clean}`;
};
