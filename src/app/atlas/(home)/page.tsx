"use client";

import { DashboardStatusChart } from "@/components/dashboard/DashboardStatusChart";
import { useAuth } from "@/context/AuthContext";
import { apiJson } from "@/lib/api/client";
import Link from "next/link";
import { useEffect, useState } from "react";

type AdminStats = {
  totalOrders: number;
  revenuePaidOrders: number;
  sellerCount: number;
  customerCount: number;
  productCount: number;
  ordersLast30Days: number;
  ordersByStatus: Record<string, number>;
};

type SellerStats = {
  productCount: number;
  orderCount: number;
  openOrders: number;
  revenuePaidLines: number;
  ordersLast30Days: number;
  ordersByStatus: Record<string, number>;
};

export default function AtlasHome() {
  const { isPlatformAdmin } = useAuth();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setErr(null);
      if (isPlatformAdmin) {
        const r = await apiJson<AdminStats>("/admin/stats");
        if (r.success) setAdminStats(r.data);
        else setErr(r.message);
      } else {
        const r = await apiJson<SellerStats>("/seller/stats");
        if (r.success) setSellerStats(r.data);
        else setErr(r.message);
      }
    };
    void load();
  }, [isPlatformAdmin]);

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
      n || 0,
    );

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-emerald-800 to-slate-900 p-8 text-white shadow-xl md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium uppercase tracking-wider text-teal-200/90">
            {isPlatformAdmin ? "Platform overview" : "Your storefront"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Paridhan Dashboard</h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 md:text-base">
            {isPlatformAdmin
              ? "Monitor orders, revenue, and growth across sellers and customers."
              : "Track your products, orders, and earnings from items you fulfill."}
          </p>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
          {err}
        </div>
      )}

      {isPlatformAdmin && adminStats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total orders" value={String(adminStats.totalOrders)} accent="from-teal-500/20" />
            <StatCard label="Revenue (paid)" value={fmtMoney(adminStats.revenuePaidOrders)} accent="from-emerald-500/20" />
            <StatCard label="Last 30 days" value={String(adminStats.ordersLast30Days)} accent="from-cyan-500/20" />
            <StatCard label="Sellers" value={String(adminStats.sellerCount)} accent="from-slate-500/20" />
            <StatCard label="Customers" value={String(adminStats.customerCount)} accent="from-violet-500/20" />
            <StatCard label="Products" value={String(adminStats.productCount)} accent="from-amber-500/20" />
          </div>
          <DashboardStatusChart ordersByStatus={adminStats.ordersByStatus} title="Platform orders by status" />
        </>
      )}

      {!isPlatformAdmin && sellerStats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="My products" value={String(sellerStats.productCount)} accent="from-teal-500/20" />
            <StatCard label="Orders (you)" value={String(sellerStats.orderCount)} accent="from-emerald-500/20" />
            <StatCard label="Open orders" value={String(sellerStats.openOrders)} accent="from-amber-500/20" />
            <StatCard label="Revenue (paid lines)" value={fmtMoney(sellerStats.revenuePaidLines)} accent="from-cyan-500/20" />
            <StatCard label="Last 30 days" value={String(sellerStats.ordersLast30Days)} accent="from-violet-500/20" />
          </div>
          <DashboardStatusChart ordersByStatus={sellerStats.ordersByStatus} title="Your orders by status" />
        </>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Quick links</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {isPlatformAdmin ? (
            <>
              <Quick href="/atlas/sellers">Sellers</Quick>
              <Quick href="/atlas/customers">Customers</Quick>
              <Quick href="/atlas/categories">Categories</Quick>
              <Quick href="/atlas/orders">All orders</Quick>
              <Quick href="/atlas/settings/website">Website</Quick>
            </>
          ) : (
            <>
              <Quick href="/atlas/products">My products</Quick>
              <Quick href="/atlas/my-orders">My orders</Quick>
            </>
          )}
          <Quick href="/atlas/settings/password">Change password</Quick>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-gradient-to-br ${accent} to-white p-5 shadow-sm dark:border-slate-700 dark:to-slate-900`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function Quick({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
    >
      {children}
    </Link>
  );
}
