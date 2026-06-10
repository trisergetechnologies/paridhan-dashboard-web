"use client";

import { RequireRole } from "@/components/Auth/RequireRole";
import { OrderDetailModal } from "@/components/dashboard/OrderDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DownloadShippingLabelButton } from "@/components/dashboard/DownloadShippingLabelButton";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiJson } from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";

const ORDER_STATUSES = [
  "awaiting_payment",
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
const PAYMENT_STATUSES = ["pending", "paid", "failed"] as const;

type OrderRow = {
  _id: string;
  orderNumber: string;
  grandTotal: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  user?: { name?: string; email?: string };
};

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<OrderRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, { orderStatus: string; paymentStatus: string }>>({});
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    const r = await apiJson<{ items: OrderRow[]; pagination: { totalPages: number } }>(
      `/seller/orders?${params}`,
    );
    if (r.success) {
      setItems(r.data.items);
      setTotalPages(r.data.pagination.totalPages);
      const next: Record<string, { orderStatus: string; paymentStatus: string }> = {};
      for (const o of r.data.items) {
        next[o._id] = { orderStatus: o.orderStatus, paymentStatus: o.paymentStatus };
      }
      setEditing(next);
    } else {
      setError(r.message);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (id: string) => {
    const cur = editing[id];
    if (!cur) return;
    const res = await apiFetch(`/seller/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ orderStatus: cur.orderStatus, paymentStatus: cur.paymentStatus }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || "Update failed");
      return;
    }
    void load();
  };

  return (
    <RequireRole seller>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My orders</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Orders that include at least one of your products.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-6">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
                <TableHead className="pl-5 font-semibold text-slate-700 dark:text-slate-200">Order</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Customer</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Total</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Payment</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Pay status</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Order status</TableHead>
                <TableHead className="pr-5 text-right font-semibold text-slate-700 dark:text-slate-200">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((o) => (
                <TableRow key={o._id}>
                  <TableCell className="pl-5 font-mono text-sm">{o.orderNumber}</TableCell>
                  <TableCell className="text-sm">
                    <div>{o.user?.name || "—"}</div>
                    <div className="text-gray-6">{o.user?.email || ""}</div>
                  </TableCell>
                  <TableCell>₹{o.grandTotal}</TableCell>
                  <TableCell className="text-sm">{o.paymentMethod}</TableCell>
                  <TableCell>
                    <select
                      className="rounded border border-stroke bg-transparent px-2 py-1 text-sm dark:border-dark-3"
                      value={editing[o._id]?.paymentStatus ?? o.paymentStatus}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [o._id]: {
                            orderStatus: prev[o._id]?.orderStatus ?? o.orderStatus,
                            paymentStatus: e.target.value,
                          },
                        }))
                      }
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      className="rounded border border-stroke bg-transparent px-2 py-1 text-sm dark:border-dark-3"
                      value={editing[o._id]?.orderStatus ?? o.orderStatus}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [o._id]: {
                            orderStatus: e.target.value,
                            paymentStatus: prev[o._id]?.paymentStatus ?? o.paymentStatus,
                          },
                        }))
                      }
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <DownloadShippingLabelButton
                        orderId={o._id}
                        ordersPath="/seller/orders"
                        sellerId={user?._id}
                        sellerName={user?.name}
                        variant="link"
                      />
                      <button
                        type="button"
                        className="text-sm font-medium text-primary hover:underline"
                        onClick={() => setDetailId(o._id)}
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-slate-700 hover:underline dark:text-slate-300"
                        onClick={() => patch(o._id)}
                      >
                        Save
                      </button>
                    </div>
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
          className="rounded border px-3 py-1 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="py-1">
          Page {page}
          {totalPages > 0 ? ` / ${totalPages}` : ""}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded border px-3 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {detailId && (
        <OrderDetailModal
          orderId={detailId}
          ordersPath="/seller/orders"
          sellerId={user?._id}
          sellerName={user?.name}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
    </RequireRole>
  );
}
