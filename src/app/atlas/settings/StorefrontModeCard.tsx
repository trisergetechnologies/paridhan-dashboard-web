"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiJson } from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";

export type StorefrontMode = "live" | "maintenance" | "coming_soon";

const MODE_OPTIONS: { value: StorefrontMode; label: string; hint: string }[] = [
  { value: "live", label: "Live", hint: "Customers see the full store." },
  { value: "coming_soon", label: "Coming soon", hint: "Single landing page; APIs stay on for setup." },
  { value: "maintenance", label: "Maintenance", hint: "Polished downtime page; dashboards unchanged." },
];

export function StorefrontModeCard() {
  const { isPlatformAdmin, isAuthLoading } = useAuth();
  const [mode, setMode] = useState<StorefrontMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await apiJson<{ mode: StorefrontMode }>("/admin/site/storefront-mode");
    if (r.success && r.data?.mode) setMode(r.data.mode);
    else if (!r.success) setError(r.message || "Could not load storefront mode");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && isPlatformAdmin) void load();
  }, [load, isAuthLoading, isPlatformAdmin]);

  const save = async (next: StorefrontMode) => {
    setMessage(null);
    setError(null);
    setSaving(true);
    const res = await apiFetch("/admin/site/storefront-mode", {
      method: "PATCH",
      body: JSON.stringify({ mode: next }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.success) {
      setError(json.message || "Failed to update");
      return;
    }
    setMode(json.data?.mode ?? next);
    setMessage("Customer website mode updated.");
  };

  if (isAuthLoading || !isPlatformAdmin) {
    return null;
  }

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h2 className="mb-2 text-xl font-semibold text-dark dark:text-white">Customer website mode</h2>
      <p className="mb-6 text-sm text-body dark:text-bodydark">
        Controls the public Paridhan shop only. Admin and seller dashboards always stay available; APIs are not
        blocked so you can onboard sellers and products before going live.
      </p>

      {loading ? (
        <p className="text-sm text-body dark:text-bodydark">Loading…</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {MODE_OPTIONS.map((opt) => {
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={saving}
                  onClick={() => void save(opt.value)}
                  className={`flex min-w-[140px] flex-1 flex-col rounded-xl border-2 px-4 py-3 text-left transition ${
                    active
                      ? "border-primary bg-primary/10 dark:bg-primary/15"
                      : "border-stroke hover:border-primary/50 dark:border-dark-3"
                  } disabled:opacity-60`}
                >
                  <span className="font-semibold text-dark dark:text-white">{opt.label}</span>
                  <span className="mt-1 text-xs text-body dark:text-bodydark">{opt.hint}</span>
                </button>
              );
            })}
          </div>
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-600 dark:bg-green-900/20">
              {message}
            </div>
          )}
        </>
      )}
    </div>
  );
}
