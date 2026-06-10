import type { DashboardRole } from "@/context/AuthContext";

import { normalizeApiBaseUrl } from "./apiBase";

export function getGoogleOAuthStartUrl(role: DashboardRole) {
  const API_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  const params = new URLSearchParams({
    client: "dashboard",
    role,
  });
  return `${API_URL}/auth/google?${params.toString()}`;
}

export function startGoogleOAuth(role: DashboardRole) {
  window.location.href = getGoogleOAuthStartUrl(role);
}
