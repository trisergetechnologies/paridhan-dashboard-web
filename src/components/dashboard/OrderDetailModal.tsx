"use client";

import { DownloadShippingLabelButton } from "@/components/dashboard/DownloadShippingLabelButton";
import { DashboardModal } from "@/components/ui/DashboardModal";
import { apiFetch, apiJson } from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";

type OrderItem = {
  name?: string;
  image?: string;
  price: number;
  mrp?: number;
  quantity: number;
  subtotal: number;
  variantPublicId?: string;
  variantLabel?: string;
  seller?: string;
  gstPercent?: number;
  hsnCode?: string;
  lineTax?: number;
};

type OrderDoc = {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress?: Record<string, string | undefined>;
  itemsTotal: number;
  taxAmount: number;
  deliveryCharge: number;
  grandTotal: number;
  currency?: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt?: string;
  updatedAt?: string;
  cancelReason?: string;
  shipping?: {
    mode?: string;
    awb?: string;
    courierName?: string;
    trackingUrl?: string;
    shiprocketError?: string;
  };
  refund?: {
    referenceNote?: string;
    refundedAt?: string;
  };
  user?: { name?: string; email?: string; phone?: string };
};

export function OrderDetailModal({
  orderId,
  ordersPath,
  sellerId,
  sellerName,
  onClose,
}: {
  orderId: string;
  ordersPath: "/admin/orders" | "/seller/orders";
  sellerId?: string;
  sellerName?: string;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<OrderDoc | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [awb, setAwb] = useState("");
  const [courierName, setCourierName] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [refNote, setRefNote] = useState("");
  const [shipMsg, setShipMsg] = useState<string | null>(null);
  const isAdmin = ordersPath === "/admin/orders";

  const reload = useCallback(async () => {
    const r = await apiJson<OrderDoc>(`${ordersPath}/${orderId}`);
    if (r.success) {
      setOrder(r.data);
      setAwb(r.data.shipping?.awb || "");
      setCourierName(r.data.shipping?.courierName || "");
      setTrackingUrl(r.data.shipping?.trackingUrl || "");
    } else setErr(r.message);
  }, [orderId, ordersPath]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
      n || 0,
    );

  const createShiprocket = async () => {
    setShipMsg(null);
    const res = await apiFetch(`/admin/orders/${orderId}/create-shipment`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    const json = await res.json();
    setShipMsg(json.message || (json.success ? "Shipment created" : "Failed"));
    void reload();
  };

  const enableManual = async () => {
    setShipMsg(null);
    const res = await apiFetch(`/admin/orders/${orderId}/create-shipment`, {
      method: "POST",
      body: JSON.stringify({ useManual: true }),
    });
    const json = await res.json();
    setShipMsg(json.message || (json.success ? "Manual mode enabled" : "Failed"));
    void reload();
  };

  const saveManualShipping = async () => {
    setShipMsg(null);
    const res = await apiFetch(`/admin/orders/${orderId}/shipping`, {
      method: "PATCH",
      body: JSON.stringify({ awb, courierName, trackingUrl, markShipped: true }),
    });
    const json = await res.json();
    setShipMsg(json.message || (json.success ? "Shipping saved" : "Failed"));
    void reload();
  };

  const markRefunded = async () => {
    const res = await apiFetch(`/admin/orders/${orderId}/mark-refunded`, {
      method: "PATCH",
      body: JSON.stringify({ referenceNote: refNote || undefined }),
    });
    const json = await res.json();
    setShipMsg(json.message || (json.success ? "Marked refunded" : "Failed"));
    void reload();
  };

  return (
    <DashboardModal title="Order details" onClose={onClose} size="xl">
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!order && !err && <p className="text-sm text-slate-500">Loading…</p>}
      {order && (
        <div className="space-y-6 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Shipping</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Try Shiprocket first, or download PDF label and ship manually.
              </p>
              {order.shipping?.mode ? (
                <p className="mt-1 text-xs capitalize text-slate-500">Mode: {order.shipping.mode}</p>
              ) : null}
              {order.shipping?.shiprocketError ? (
                <p className="mt-1 text-xs text-amber-700">{order.shipping.shiprocketError}</p>
              ) : null}
            </div>
            <DownloadShippingLabelButton
              orderId={orderId}
              ordersPath={ordersPath}
              sellerId={sellerId}
              sellerName={sellerName}
            />
          </div>

          {isAdmin && ["confirmed", "packed"].includes(order.orderStatus) ? (
            <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white"
                onClick={() => void createShiprocket()}
              >
                Create Shiprocket shipment
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium"
                onClick={() => void enableManual()}
              >
                Ship manually
              </button>
            </div>
          ) : null}

          {isAdmin && (order.shipping?.mode === "manual" || !order.shipping?.awb) ? (
            <div className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase text-slate-500">Manual AWB</p>
              <input
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                placeholder="AWB / tracking number"
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
              />
              <input
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                placeholder="Courier name"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
              />
              <input
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                placeholder="Tracking URL (optional)"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg border px-3 py-2 text-xs font-medium"
                onClick={() => void saveManualShipping()}
              >
                Save & mark shipped
              </button>
            </div>
          ) : null}

          {order.shipping?.awb ? (
            <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
              <p className="text-xs font-medium uppercase text-slate-500">Tracking</p>
              <p className="mt-1">
                AWB:{" "}
                {order.shipping.trackingUrl ? (
                  <a href={order.shipping.trackingUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                    {order.shipping.awb}
                  </a>
                ) : (
                  order.shipping.awb
                )}
              </p>
              {order.shipping.courierName ? <p>Courier: {order.shipping.courierName}</p> : null}
            </div>
          ) : null}

          {shipMsg ? <p className="text-sm text-slate-600">{shipMsg}</p> : null}

          {isAdmin && order.paymentStatus === "refund_pending" ? (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-200">
                Refund pending — process in Cashfree panel
              </p>
              <input
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                placeholder="Cashfree refund ID / UTR (optional)"
                value={refNote}
                onChange={(e) => setRefNote(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white"
                onClick={() => void markRefunded()}
              >
                Mark refunded
              </button>
            </div>
          ) : null}

          {order.cancelReason ? (
            <p className="text-sm text-slate-600">
              <span className="font-medium">Cancel reason:</span> {order.cancelReason}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Order</p>
              <p className="mt-1 font-mono text-base font-semibold text-slate-900 dark:text-white">
                {order.orderNumber}
              </p>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Status: <span className="font-medium capitalize">{order.orderStatus}</span>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Payment: <span className="font-medium capitalize">{order.paymentStatus}</span> ·{" "}
                {order.paymentMethod?.toUpperCase()}
              </p>
              {order.createdAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Placed {new Date(order.createdAt).toLocaleString()}
                </p>
              )}
            </div>
            {order.user && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Customer</p>
                <p className="mt-1 font-medium text-slate-900 dark:text-white">{order.user.name || "—"}</p>
                <p className="text-slate-600 dark:text-slate-300">{order.user.email}</p>
                {order.user.phone && <p className="text-slate-600 dark:text-slate-300">{order.user.phone}</p>}
              </div>
            )}
          </div>

          {order.shippingAddress && (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Shipping address</p>
              <p className="mt-2 text-slate-800 dark:text-slate-200">
                {order.shippingAddress.fullName}
                <br />
                {order.shippingAddress.street}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                <br />
                {order.shippingAddress.country}
                <br />
                Phone: {order.shippingAddress.phone}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Line items</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Variant</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit</th>
                    <th className="px-3 py-2 text-right">MRP</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                    <th className="px-3 py-2 text-right">GST%</th>
                    <th className="px-3 py-2">HSN</th>
                    <th className="px-3 py-2 text-right">Line tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(order.items || []).map((line, i) => (
                    <tr key={i} className="bg-white dark:bg-slate-900/40">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {line.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={line.image} alt="" className="size-12 rounded-lg object-cover" />
                          ) : null}
                          <span className="font-medium text-slate-900 dark:text-white">{line.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                        {line.variantLabel || line.variantPublicId || "—"}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{line.quantity}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmt(line.price)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-500">
                        {line.mrp != null ? fmt(line.mrp) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums">{fmt(line.subtotal)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                        {line.gstPercent != null ? `${line.gstPercent}%` : "—"}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {line.hsnCode || "—"}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {line.lineTax != null ? fmt(line.lineTax) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ml-auto max-w-sm space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Items total</span>
              <span className="tabular-nums">{fmt(order.itemsTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Tax</span>
              <span className="tabular-nums">{fmt(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Delivery</span>
              <span className="tabular-nums">{fmt(order.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900 dark:border-slate-600 dark:text-white">
              <span>Grand total</span>
              <span className="tabular-nums">{fmt(order.grandTotal)}</span>
            </div>
            {order.currency && order.currency !== "INR" && (
              <p className="text-xs text-slate-500">Currency: {order.currency}</p>
            )}
          </div>
        </div>
      )}
    </DashboardModal>
  );
}
