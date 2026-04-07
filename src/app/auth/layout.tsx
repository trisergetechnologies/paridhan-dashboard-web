"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { PropsWithChildren, useEffect } from "react";

export default function AuthLayout({ children }: PropsWithChildren) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace("/atlas");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading || isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
