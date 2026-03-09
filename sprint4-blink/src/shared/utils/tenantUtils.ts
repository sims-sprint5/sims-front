/**
 * Extracts tenant from hostname (e.g., ubberdos.lvh.me → 'ubberdos')
 */
export function getCurrentTenant(): string {
  const hostname = window.location.hostname;

  if (hostname.includes('.')) {
    return hostname.split('.')[0] || 'localhost';
  }

  return 'localhost';
}

/** Gets API port from browser, env var, or defaults to 8000/443 */
function getApiPort(): string {
  if (window.location.port) {
    return `:${window.location.port}`;
  }

  const envPort = import.meta.env.VITE_API_PORT;
  if (envPort) {
    return `:${envPort}`;
  }

  return window.location.protocol === 'https:' ? ':443' : ':8000';
}

/** Builds the API base URL for the current tenant */
export function getTenantApiBaseUrl(): string {
  const tenant = getCurrentTenant();
  const protocol = window.location.protocol;
  const port = getApiPort();

  if (tenant === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(tenant)) {
    return `${protocol}//localhost${port}/api`;
  }

  return `${protocol}//${tenant}.lvh.me${port}/api`;
}

/** Builds the complete API URL for an endpoint */
export function buildTenantApiUrl(endpoint: string): string {
  const baseUrl = getTenantApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}
