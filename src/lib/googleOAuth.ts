import type { DashboardRole } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function getGoogleOAuthStartUrl(role: DashboardRole) {
  const params = new URLSearchParams({
    client: "dashboard",
    role,
  });
  return `${API_URL}/auth/google?${params.toString()}`;
}

export function startGoogleOAuth(role: DashboardRole) {
  window.location.href = getGoogleOAuthStartUrl(role);
}
