"use client";

import { RequireRole } from "@/components/Auth/RequireRole";
import { UserDetailModal } from "@/components/dashboard/UserDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiJson } from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";

type Customer = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isBlocked?: boolean;
  createdAt?: string;
};

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (q.trim()) params.set("q", q.trim());
    const r = await apiJson<{ items: Customer[]; pagination: { totalPages: number } }>(
      `/admin/customers?${params}`,
    );
    if (r.success) {
      setItems(r.data.items);
      setTotalPages(r.data.pagination.totalPages);
    } else {
      setError(r.message);
    }
    setLoading(false);
  }, [page, q]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage((p) => (p === 1 ? p : 1));
  }, [q]);

  return (
    <RequireRole admin>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Customers</h1>
        <input
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[240px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
                    <TableHead className="pl-5 font-semibold text-slate-700 dark:text-slate-200">Name</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Email</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Phone</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Status</TableHead>
                    <TableHead className="pr-5 text-right font-semibold text-slate-700 dark:text-slate-200">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c._id} className="border-slate-100 dark:border-slate-800">
                      <TableCell className="pl-5 font-medium text-slate-900 dark:text-white">{c.name}</TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">{c.email}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{c.phone || "—"}</TableCell>
                      <TableCell>
                        {c.isBlocked ? (
                          <span className="text-amber-700 dark:text-amber-400">Blocked</span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400">Active</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:underline"
                          onClick={() => setDetailId(c._id)}
                        >
                          Details
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-600"
          >
            Prev
          </button>
          <span className="py-1.5 text-slate-600">
            Page {page}
            {totalPages > 0 ? ` / ${totalPages}` : ""}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-600"
          >
            Next
          </button>
        </div>

        {detailId && (
          <UserDetailModal userId={detailId} variant="customer" onClose={() => setDetailId(null)} />
        )}
      </div>
    </RequireRole>
  );
}
