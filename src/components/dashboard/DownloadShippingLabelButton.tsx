"use client";

import { apiJson } from "@/lib/api/client";
import { downloadShippingLabel, type ShippingLabelOrder } from "@/lib/shippingLabel";
import { Download } from "lucide-react";
import { useState } from "react";

export function DownloadShippingLabelButton({
  orderId,
  ordersPath,
  sellerId,
  sellerName,
  variant = "button",
  className = "",
}: {
  orderId: string;
  ordersPath: "/admin/orders" | "/seller/orders";
  sellerId?: string;
  sellerName?: string;
  variant?: "button" | "link";
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      const r = await apiJson<ShippingLabelOrder>(`${ordersPath}/${orderId}`);
      if (!r.success) {
        alert(r.message || "Could not load order for label");
        return;
      }
      downloadShippingLabel(r.data, {
        sellerId: ordersPath === "/seller/orders" ? sellerId : undefined,
        sellerName: ordersPath === "/seller/orders" ? sellerName : undefined,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Label download failed");
    } finally {
      setBusy(false);
    }
  };

  if (variant === "link") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleDownload()}
        className={`inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline disabled:opacity-50 ${className}`}
      >
        <Download className="h-3.5 w-3.5" />
        {busy ? "Generating…" : "Label"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void handleDownload()}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-primary/40 hover:text-primary disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 ${className}`}
    >
      <Download className="h-4 w-4" />
      {busy ? "Generating…" : "Download label"}
    </button>
  );
}
