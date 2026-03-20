// Regex pattern to detect local IP addresses (e.g., 192.168.1.1)
const LOCAL_IP_PATTERN = /^\d+\.\d+\.\d+\.\d+$/;


function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || LOCAL_IP_PATTERN.test(hostname);
}

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

  if (isLocalHost(hostname)) {
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

export function isSuperadminHost(): boolean {
  return isLocalHost(window.location.hostname);
}

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


export function getTenantApiBaseUrl(): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = getApiPort();

  if (isSuperadminHost()) {
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

