"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export default function SettingsShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { isPlatformAdmin, isAuthLoading } = useAuth();

  const links = isPlatformAdmin
    ? [
        { href: "/atlas/settings/website", label: "Website" },
        { href: "/atlas/settings/product-fields", label: "Product fields" },
        { href: "/atlas/settings/password", label: "Change Password" },
      ]
    : [{ href: "/atlas/settings/password", label: "Change Password" }];

  return (
    <div className="mx-auto w-full max-w-[700px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-dark dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-body dark:text-bodydark">
          {isPlatformAdmin ? "Manage the customer site and your account." : "Update your account password."}
        </p>
      </div>

      {!isAuthLoading && (
        <nav className="mb-8 flex flex-wrap gap-2 border-b border-stroke pb-px dark:border-dark-3" aria-label="Settings sections">
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-body hover:text-dark dark:text-bodydark dark:hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      {children}
    </div>
  );
}
