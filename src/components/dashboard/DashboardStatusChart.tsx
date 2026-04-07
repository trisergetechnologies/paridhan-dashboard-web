"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  ordersByStatus: Record<string, number>;
  title?: string;
};

const ORDER_LABELS: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function DashboardStatusChart({ ordersByStatus, title = "Orders by status" }: Props) {
  const { labels, data } = useMemo(() => {
    const keys = Object.keys(ORDER_LABELS);
    return {
      labels: keys.map((k) => ORDER_LABELS[k] || k),
      data: keys.map((k) => ordersByStatus[k] ?? 0),
    };
  }, [ordersByStatus]);

  const options = useMemo(
    () => ({
      chart: {
        toolbar: { show: false },
        fontFamily: "inherit",
        background: "transparent",
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: "55%",
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: labels,
        labels: {
          style: { colors: "var(--tw-prose-body, #64748b)", fontSize: "11px" },
        },
      },
      yaxis: {
        labels: {
          style: { colors: "#64748b", fontSize: "11px" },
        },
        tickAmount: 4,
      },
      grid: {
        borderColor: "#e2e8f0",
        strokeDashArray: 4,
      },
      colors: ["#0d9488"],
      theme: { mode: undefined as "light" | "dark" | undefined },
    }),
    [labels],
  );

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mb-4 text-xs text-slate-500">Distribution across pipeline stages</p>
      <Chart type="bar" height={280} series={[{ name: "Orders", data }]} options={options} />
    </div>
  );
}
