"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { StorefrontModeCard } from "../StorefrontModeCard";
import { HeroBannerCard } from "../HeroBannerCard";

export default function SettingsWebsitePage() {
  const { isPlatformAdmin, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isPlatformAdmin) {
      router.replace("/atlas/settings/password");
    }
  }, [isAuthLoading, isPlatformAdmin, router]);

  if (isAuthLoading || !isPlatformAdmin) {
    return (
      <>
        <Breadcrumb pageName="Website" />
        <p className="py-6 text-sm text-body dark:text-bodydark">Loading…</p>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Website" />
      <div className="space-y-6">
        <HeroBannerCard />
        <StorefrontModeCard />
      </div>
    </>
  );
}
