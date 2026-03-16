// Regex pattern to detect local IP addresses (e.g., 192.168.1.1)
const LOCAL_IP_PATTERN = /^\d+\.\d+\.\d+\.\d+$/;


function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || LOCAL_IP_PATTERN.test(hostname);
}

export function getCurrentTenant(): string {
  const hostname = window.location.hostname;

  if (isLocalHost(hostname)) {
    return 'localhost';
  }

  if (hostname.includes('.')) {
    return hostname.split('.')[0] || 'localhost';
  }

  return 'localhost';
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
  const protocol = window.location.protocol;
  const port = getApiPort();

  if (isSuperadminHost()) {
    return `${protocol}//localhost${port}/api`;
  }

  return `${protocol}//${window.location.hostname}${port}/api`;
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

