"use client";

import { clearTokens } from "@/lib/api/sessionTokens";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRoutesProps {
  children: React.ReactNode;
}

export default function ProtectedRoutes({
  children,
}: ProtectedRoutesProps) {
  const { isAuthenticated, isAuthLoading, isPlatformAdmin, isSeller } = useAuth();
  const router = useRouter();

  const allowed = isPlatformAdmin || isSeller;

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }
    if (!allowed) {
      clearTokens();
      router.replace("/auth");
    }
  }, [isAuthLoading, isAuthenticated, allowed, router]);

  if (isAuthLoading || !isAuthenticated || !allowed) {
    return null;
  }

  return <>{children}</>;
}
