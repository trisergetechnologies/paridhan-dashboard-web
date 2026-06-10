import { getDashboardApiBase } from "@/lib/apiBase";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./sessionTokens";

export function getApiUrl(): string {
  return getDashboardApiBase();
}

const DASHBOARD_HEADERS = {
  "Content-Type": "application/json",
  "X-Paridhan-Client": "dashboard",
} as const;

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${getDashboardApiBase()}/auth/refresh`, {
      method: "POST",
      headers: DASHBOARD_HEADERS,
      body: JSON.stringify({ refreshToken: refresh }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success || !json.data?.accessToken || !json.data?.refreshToken) {
      return false;
    }
    setTokens(json.data.accessToken, json.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function queueRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export type ApiResult<T> = { success: true; data: T } | { success: false; message: string };

/**
 * Authenticated JSON request with Bearer + refresh-on-401.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
  canRetry = true
): Promise<Response> {
  const access = getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("X-Paridhan-Client", "dashboard");
  if (access) {
    headers.set("Authorization", `Bearer ${access}`);
  }
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const base = getDashboardApiBase();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, { ...init, headers });

  if (res.status !== 401 || !canRetry) return res;

  const refreshed = await queueRefresh();
  if (!refreshed) return res;

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("X-Paridhan-Client", "dashboard");
  const nextAccess = getAccessToken();
  if (nextAccess) retryHeaders.set("Authorization", `Bearer ${nextAccess}`);
  if (!retryHeaders.has("Content-Type") && init.body && typeof init.body === "string") {
    retryHeaders.set("Content-Type", "application/json");
  }

  return fetch(url, { ...init, headers: retryHeaders });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const res = await apiFetch(path, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      message: json.message || `Request failed (${res.status})`,
    };
  }
  if (json.success === false) {
    return { success: false, message: json.message || "Request failed" };
  }
  return { success: true, data: json.data as T };
}

export { DASHBOARD_HEADERS };
