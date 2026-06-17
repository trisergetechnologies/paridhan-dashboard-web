"use client";

import { RequireRole } from "@/components/Auth/RequireRole";
import { apiFetch, apiJson } from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";

type ReturnRow = {
  _id: string;
  returnNumber: string;
  status: string;
  reason: string;
  createdAt: string;
  user?: { name?: string; email?: string };
  order?: { orderNumber?: string; grandTotal?: number; paymentStatus?: string };
};

const RETURN_STATUSES = [
  "requested",
  "approved",
  "pickup_scheduled",
  "in_transit",
  "received",
  "inspected",
  "refunded",
  "rejected",
] as const;

export default function AdminReturnsPage() {
  const [items, setItems] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReturnRow | null>(null);
  const [status, setStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [refNote, setRefNote] = useState("");
  const [manualAwb, setManualAwb] = useState("");
  const [manualCourier, setManualCourier] = useState("");
  const [manualInstructions, setManualInstructions] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await apiJson<{ items: ReturnRow[] }>("/admin/returns?limit=50");
    if (r.success) setItems(r.data.items);
    else setError(r.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = (row: ReturnRow) => {
    setSelected(row);
    setStatus(row.status);
    setAdminNote("");
    setRefNote("");
    setManualAwb("");
    setManualCourier("");
    setManualInstructions("");
  };

  const patchReturn = async () => {
    if (!selected) return;
    const res = await apiFetch(`/admin/returns/${selected._id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNote: adminNote || undefined }),
    });
    const json = await res.json();
    if (!json.success) {
      alert(json.message || "Update failed");
      return;
    }
    setSelected(null);
    void load();
  };

  const scheduleShiprocket = async () => {
    if (!selected) return;
    const res = await apiFetch(`/admin/returns/${selected._id}/schedule-pickup`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    const json = await res.json();
    alert(json.message || (json.success ? "Pickup scheduled" : "Failed"));
    if (json.success) {
      setSelected(null);
      void load();
    }
  };

  const scheduleManual = async () => {
    if (!selected) return;
    const res = await apiFetch(`/admin/returns/${selected._id}/schedule-pickup`, {
      method: "POST",
      body: JSON.stringify({
        useManual: true,
        reverseAwb: manualAwb,
        courierName: manualCourier,
        instructions: manualInstructions,
      }),
    });
    const json = await res.json();
    alert(json.message || (json.success ? "Saved" : "Failed"));
    if (json.success) {
      setSelected(null);
      void load();
    }
  };

  const markRefunded = async () => {
    if (!selected) return;
    const res = await apiFetch(`/admin/returns/${selected._id}/mark-refunded`, {
      method: "PATCH",
      body: JSON.stringify({ referenceNote: refNote || undefined }),
    });
    const json = await res.json();
    alert(json.message || (json.success ? "Marked refunded" : "Failed"));
    if (json.success) {
      setSelected(null);
      void load();
    }
  };

  return (
    <RequireRole admin>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Returns</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-6">Loading…</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3">Return</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((row) => (
                  <tr key={row._id}>
                    <td className="px-4 py-3 font-mono">{row.returnNumber}</td>
                    <td className="px-4 py-3">{row.order?.orderNumber || "—"}</td>
                    <td className="px-4 py-3">
                      <div>{row.user?.name || "—"}</div>
                      <div className="text-xs text-slate-500">{row.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{row.status.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{row.reason}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-primary text-sm font-medium hover:underline"
                        onClick={() => openDetail(row)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selected ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <h2 className="text-lg font-semibold mb-4">{selected.returnNumber}</h2>
              <p className="text-sm text-slate-600 mb-4">{selected.reason}</p>

              <label className="block text-xs font-medium uppercase text-slate-500 mb-1">Status</label>
              <select
                className="w-full rounded border px-3 py-2 text-sm mb-4 dark:bg-slate-800"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {RETURN_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>

              <textarea
                className="w-full rounded border px-3 py-2 text-sm mb-4 dark:bg-slate-800"
                placeholder="Admin note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />

              <div className="space-y-2 mb-4 border-t pt-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Pickup</p>
                <button
                  type="button"
                  className="w-full rounded-lg bg-primary px-3 py-2 text-sm text-white"
                  onClick={() => void scheduleShiprocket()}
                >
                  Schedule Shiprocket pickup
                </button>
                <p className="text-xs text-slate-500">Or manual return:</p>
                <input
                  className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                  placeholder="Return AWB"
                  value={manualAwb}
                  onChange={(e) => setManualAwb(e.target.value)}
                />
                <input
                  className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                  placeholder="Courier name"
                  value={manualCourier}
                  onChange={(e) => setManualCourier(e.target.value)}
                />
                <textarea
                  className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                  placeholder="Instructions for customer"
                  value={manualInstructions}
                  onChange={(e) => setManualInstructions(e.target.value)}
                />
                <button
                  type="button"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  onClick={() => void scheduleManual()}
                >
                  Save manual return shipping
                </button>
              </div>

              <div className="space-y-2 mb-4 border-t pt-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Refund (manual in Cashfree)</p>
                <input
                  className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                  placeholder="Cashfree refund ID / UTR (optional)"
                  value={refNote}
                  onChange={(e) => setRefNote(e.target.value)}
                />
                <button
                  type="button"
                  className="w-full rounded-lg border border-emerald-600 px-3 py-2 text-sm text-emerald-700"
                  onClick={() => void markRefunded()}
                >
                  Mark refunded
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setSelected(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-slate-900"
                  onClick={() => void patchReturn()}
                >
                  Save status
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RequireRole>
  );
}
