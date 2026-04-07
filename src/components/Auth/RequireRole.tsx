"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  admin?: boolean;
  seller?: boolean;
  children: React.ReactNode;
};

export function RequireRole({ admin, seller, children }: Props) {
  const { isPlatformAdmin, isSeller, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;
    if (admin && !isPlatformAdmin) router.replace("/atlas");
    if (seller && !isSeller) router.replace("/atlas");
  }, [admin, seller, isAuthLoading, isPlatformAdmin, isSeller, router]);

  if (isAuthLoading) return null;
  if (admin && !isPlatformAdmin) return null;
  if (seller && !isSeller) return null;

  return <>{children}</>;
}
