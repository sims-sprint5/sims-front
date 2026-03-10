/**
 * TENANT DETECTION CONFIGURATION
 * Suporta múltiples formats de subdomini
 */

interface TenantConfig {
  domain: string; // Dominio del tenant (lvh.me, sims.local, etc.)
  isLocalhost: boolean;
  port: string;
}

/**
 * Obté la configuració del tenant actual
 */
function getTenantConfig(): TenantConfig {
  const hostname = window.location.hostname;
  const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');

  return {
    hostname,
    isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1',
    port: `:${port}`,
  } as any;
}

/**
 * Extracts tenant from hostname
 * Soperta:
 * - uberddos.lvh.me → 'uberddos'
 * - uberddos.sims.local → 'uberddos'
 * - localhost o 127.0.0.1 → 'localhost'
 */
export function getCurrentTenant(): string {
  const hostname = window.location.hostname;

  // Localhost o IP local
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return 'localhost';
  }

  // Extreu el primer part del hostname com a tenant
  if (hostname.includes('.')) {
    const parts = hostname.split('.');
    return parts[0] || 'localhost';
  }

  return 'localhost';
}

/**
 * Gets API port from browser, env var, or defaults to 8000/443
 */
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
 * Builds the API base URL for the current tenant
 * 
 * Exemples:
 * - uberddos.lvh.me:8000 → http://uberddos.lvh.me:8000/api
 * - localhost:8000 → http://localhost:8000/api
 * - 127.0.0.1:8000 → http://localhost:8000/api
 */
export function getTenantApiBaseUrl(): string {
  const tenant = getCurrentTenant();
  const protocol = window.location.protocol;
  const port = getApiPort();

  // Localhost o IP: Usar localhost directament
  if (tenant === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(tenant)) {
    return `${protocol}//localhost${port}/api`;
  }

  // Subdomini: Mantenir el format (lvh.me, sims.local, etc.)
  // El hostname ja conté el subdomini, només agafem el tenant per a referència
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}${port}/api`;
}

/**
 * Builds the complete API URL for an endpoint
 * 
 * Exemple:
 * buildTenantApiUrl('tickets') → 'http://uberddos.lvh.me:8000/api/tickets'
 */
export function buildTenantApiUrl(endpoint: string): string {
  const baseUrl = getTenantApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

/**
 * Obté informació del tenant actual (debugging)
 */
export function getTenantInfo() {
  return {
    tenant: getCurrentTenant(),
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
    apiBaseUrl: getTenantApiBaseUrl(),
  };
}
