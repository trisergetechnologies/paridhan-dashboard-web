"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsIndexPage() {
  const { isPlatformAdmin, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;
    router.replace(isPlatformAdmin ? "/atlas/settings/website" : "/atlas/settings/password");
  }, [isAuthLoading, isPlatformAdmin, router]);

  return (
    <p className="py-8 text-sm text-body dark:text-bodydark" aria-live="polite">
      Loading…
    </p>
  );
}
