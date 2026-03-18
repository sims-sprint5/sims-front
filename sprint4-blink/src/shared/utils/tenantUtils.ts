/**
 * Extracts the tenant slug from the current hostname.
 * - uberddos.lvh.me → 'uberddos'
 * - simsgrup2.app / www.simsgrup2.app → 'central'
 * - localhost / 127.0.0.1 → 'localhost'
 */
function isIpLikeHost(hostname: string): boolean {
  return /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
}

function isLocalLikeHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || isIpLikeHost(hostname);
}

function isBaseDomainHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  if (normalized === 'simsgrup2.app' || normalized === 'www.simsgrup2.app') {
    return true;
  }

  const customBaseDomain = (import.meta.env.VITE_APP_BASE_DOMAIN as string | undefined)?.toLowerCase();
  if (!customBaseDomain) return false;

  return normalized === customBaseDomain || normalized === `www.${customBaseDomain}`;
}

export function hasTenantSubdomain(hostname = window.location.hostname): boolean {
  if (isLocalLikeHost(hostname) || isBaseDomainHost(hostname)) {
    return false;
  }

  const parts = hostname.split('.').filter(Boolean);
  return parts.length > 2;
}

export function getCurrentTenant(): string {
  const hostname = window.location.hostname;

  // Localhost o IP local
  if (isLocalLikeHost(hostname)) {
    return 'localhost';
  }

  if (isBaseDomainHost(hostname)) {
    return 'central';
  }

  // Subdominio tenant real
  if (hasTenantSubdomain(hostname)) {
    const parts = hostname.split('.');
    return parts[0] || 'localhost';
  }

  return 'central';
}

/** Returns the API port from the current URL, VITE_API_PORT env var, or the protocol default. */
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

/**
 * Builds the API base URL for the current tenant.
 * - uberddos.lvh.me:5173 → http://uberddos.lvh.me:5173/api  (proxied by Vite in dev)
 * - localhost:5173        → http://localhost:5173/api
 */
export function getTenantApiBaseUrl(): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const isLocalLike = isLocalLikeHost(hostname);

  if (isLocalLike) {
    const port = getApiPort();
    return `${protocol}//localhost${port}/api`;
  }

  return `${protocol}//${hostname}/api`;
}

/** Builds the full API URL for a given endpoint path. */
export function buildTenantApiUrl(endpoint: string): string {
  const baseUrl = getTenantApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}


export function getTenantInfo() {
  return {
    tenant: getCurrentTenant(),
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
    apiBaseUrl: getTenantApiBaseUrl(),
  };
}
