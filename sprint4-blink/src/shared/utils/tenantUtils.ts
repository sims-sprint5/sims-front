const LOCAL_IP_PATTERN = /^\d+\.\d+\.\d+\.\d+$/;

function isIpLikeHost(hostname: string): boolean {
  return LOCAL_IP_PATTERN.test(hostname);
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
  if (!customBaseDomain) {
    return false;
  }

  return normalized === customBaseDomain || normalized === `www.${customBaseDomain}`;
}

export function hasTenantSubdomain(hostname = window.location.hostname): boolean {
  if (isLocalLikeHost(hostname) || isBaseDomainHost(hostname)) {
    return false;
  }

  const parts = hostname.split('.').filter(Boolean);
  return parts.length > 2;
}

/**
 * Extracts tenant from current host:
 * - tenant.lvh.me => tenant
 * - simsgrup2.app / www.simsgrup2.app => central
 * - localhost / 127.0.0.1 / local IP => localhost
 */
export function getCurrentTenant(): string {
  const hostname = window.location.hostname;

  if (isLocalLikeHost(hostname)) {
    return 'localhost';
  }

  if (isBaseDomainHost(hostname)) {
    return 'central';
  }

  if (hasTenantSubdomain(hostname)) {
    return hostname.split('.')[0] || 'localhost';
  }

  return 'central';
}

export function isSuperadminHost(): boolean {
  const hostname = window.location.hostname;
  return isLocalLikeHost(hostname) || isBaseDomainHost(hostname);
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function getLocalApiPort(): string {
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
  const explicitBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (explicitBaseUrl) {
    return normalizeBaseUrl(explicitBaseUrl);
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  if (isLocalLikeHost(hostname)) {
    const port = getLocalApiPort();
    return `${protocol}//localhost${port}/api`;
  }

  return `${protocol}//${hostname}/api`;
}

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

