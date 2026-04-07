"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  footer?: React.ReactNode;
};

const sizeClass = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-5xl",
};

/**
 * Renders via portal on document.body so fixed stacking is not trapped under
 * layout stacking contexts (e.g. main.isolate vs sidebar z-50).
 */
export function DashboardModal({ title, onClose, children, size = "md", footer }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99990] flex items-end justify-center overflow-y-auto bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-[99991] mt-auto w-full rounded-t-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:mt-0 sm:rounded-2xl",
          sizeClass[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <h2 id="dashboard-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <span className="sr-only">Close</span>
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[min(85vh,36rem)] overflow-y-auto px-5 py-4 sm:max-h-[min(90vh,48rem)] sm:px-6 sm:py-5">
          {children}
        </div>
        {footer ? (
          <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
