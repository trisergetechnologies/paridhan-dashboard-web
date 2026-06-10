function ensureUrlProtocol(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const isLocal =
    /^localhost(?::\d+)?(\/|$)/i.test(value) ||
    /^127\.0\.0\.1(?::\d+)?(\/|$)/.test(value);
  return `${isLocal ? "http" : "https"}://${value}`;
}

export function normalizeApiBaseUrl(raw: string | undefined | null): string {
  if (raw == null || !String(raw).trim()) return "";
  let u = String(raw).trim().replace(/\/$/, "");
  u = ensureUrlProtocol(u);
  if (/\/api\/v\d+$/i.test(u)) return u;
  return `${u}/api/v1`;
}

export function isProductionDashboardHost(hostname: string): boolean {
  const configured = (process.env.NEXT_PUBLIC_DASHBOARD_HOSTNAMES || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  const defaults = ["admin.paridhanemporium.com"];
  const hosts = configured.length ? configured : defaults;
  return hosts.includes(hostname.toLowerCase());
}

export function getProductionApiBaseFallback(): string {
  const fromOrigin = process.env.NEXT_PUBLIC_API_ORIGIN?.trim();
  if (fromOrigin) return normalizeApiBaseUrl(fromOrigin);
  return "https://api.paridhanemporium.com/api/v1";
}

function looksLocalApiUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/**
 * Resolved API base for dashboard fetches (call at request time in the browser).
 */
export function getDashboardApiBase(): string {
  const fromEnv = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  const onLiveDashboard =
    typeof window !== "undefined" && isProductionDashboardHost(window.location.hostname);

  if (onLiveDashboard) {
    if (!fromEnv || looksLocalApiUrl(fromEnv)) {
      return getProductionApiBaseFallback();
    }
    return fromEnv;
  }

  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/v1`;
  }

  if (process.env.NODE_ENV === "production") {
    return getProductionApiBaseFallback();
  }

  return normalizeApiBaseUrl("http://localhost:4601/api/v1");
}
