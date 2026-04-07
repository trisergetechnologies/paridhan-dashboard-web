"use client";

import { DashboardModal } from "@/components/ui/DashboardModal";
import { apiJson } from "@/lib/api/client";
import { useEffect, useState } from "react";

type UserDetail = Record<string, unknown> & {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  roles?: string[];
  isBlocked?: boolean;
  isDeleted?: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  orderCount?: number;
  lastOrder?: { orderNumber?: string; createdAt?: string; grandTotal?: number; orderStatus?: string };
  productCount?: number;
  ordersWithSellerLines?: number;
};

export function UserDetailModal({
  userId,
  variant,
  onClose,
}: {
  userId: string;
  variant: "customer" | "seller";
  onClose: () => void;
}) {
  const [u, setU] = useState<UserDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const path =
      variant === "customer" ? `/admin/customers/${userId}` : `/admin/sellers/${userId}`;
    (async () => {
      const r = await apiJson<UserDetail>(path);
      if (cancelled) return;
      if (r.success) setU(r.data);
      else setErr(r.message);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, variant]);

  const title = variant === "customer" ? "Customer details" : "Seller details";

  return (
    <DashboardModal title={title} onClose={onClose} size="lg">
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!u && !err && <p className="text-sm text-slate-500">Loading…</p>}
      {u && (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Name" value={u.name} />
          <Detail label="Email" value={u.email} />
          <Detail label="Phone" value={u.phone || "—"} />
          <Detail label="Role" value={u.role} />
          <Detail label="Roles" value={Array.isArray(u.roles) ? u.roles.join(", ") : "—"} />
          <Detail
            label="Status"
            value={
              u.isDeleted
                ? "Deleted"
                : u.isBlocked
                  ? "Blocked"
                  : "Active"
            }
          />
          <Detail label="Email verified" value={u.isEmailVerified ? "Yes" : "No"} />
          <Detail label="Created" value={u.createdAt ? new Date(String(u.createdAt)).toLocaleString() : "—"} />
          <Detail label="Last login" value={u.lastLoginAt ? new Date(String(u.lastLoginAt)).toLocaleString() : "—"} />
          {variant === "customer" && (
            <>
              <Detail label="Orders placed" value={u.orderCount != null ? String(u.orderCount) : "—"} />
              {u.lastOrder && (
                <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="text-xs font-medium uppercase text-slate-500">Latest order</p>
                  <p className="mt-1 text-slate-800 dark:text-slate-200">
                    {u.lastOrder.orderNumber} · {u.lastOrder.orderStatus} · ₹{u.lastOrder.grandTotal}
                  </p>
                  {u.lastOrder.createdAt && (
                    <p className="text-xs text-slate-500">
                      {new Date(u.lastOrder.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          {variant === "seller" && (
            <>
              <Detail label="Products" value={u.productCount != null ? String(u.productCount) : "—"} />
              <Detail
                label="Orders (with your lines)"
                value={u.ordersWithSellerLines != null ? String(u.ordersWithSellerLines) : "—"}
              />
            </>
          )}
        </dl>
      )}
    </DashboardModal>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{value ?? "—"}</dd>
    </div>
  );
}
