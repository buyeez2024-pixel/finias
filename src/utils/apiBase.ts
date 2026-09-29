/**
 * Resolves API endpoints dynamically based on the current subfolder or root path.
 * Supports root deployments (/api/...) and subfolder deployments (/farm/api/...).
 */
export const getApiUrl = (endpoint: string): string => {
  const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const lastSlash = pathname.lastIndexOf('/');
    const basePath = lastSlash >= 0 ? pathname.substring(0, lastSlash + 1) : '/';
    return `${basePath}${clean}`;
  }
  return `/${clean}`;
};
