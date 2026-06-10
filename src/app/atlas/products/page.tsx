"use client";

import { RequireRole } from "@/components/Auth/RequireRole";
import { ProductFormModal, type SellerProductRow } from "@/components/dashboard/ProductFormModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, apiJson, getApiUrl } from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";

export default function SellerProductsPage() {
  const [items, setItems] = useState<SellerProductRow[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string; slug: string }[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<SellerProductRow | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/public/categories`);
      const json = await res.json();
      if (json.success && json.data?.items) setCategories(json.data.items);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: "10", includeDeleted: "true" });
    const r = await apiJson<{ items: SellerProductRow[]; pagination: { totalPages: number } }>(
      `/seller/products?${params}`,
    );
    if (r.success) {
      setItems(r.data.items);
      setTotalPages(r.data.pagination.totalPages);
    } else {
      setError(r.message);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (p: SellerProductRow) => {
    if (!confirm(`Remove "${p.name}" from the public catalog?`)) return;
    const res = await apiFetch(`/seller/products/${p._id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || "Failed");
      return;
    }
    void load();
  };

  return (
    <RequireRole seller>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My products</h1>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setModal("create");
            }}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            Add product
          </button>
        </div>
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
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Slug</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Price</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Stock</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Status</TableHead>
                    <TableHead className="pr-5 text-right font-semibold text-slate-700 dark:text-slate-200">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p) => (
                    <TableRow key={p._id} className="border-slate-100 dark:border-slate-800">
                      <TableCell className="pl-5 font-medium text-slate-900 dark:text-white">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-300">{p.slug}</TableCell>
                      <TableCell className="tabular-nums">₹{p.price}</TableCell>
                      <TableCell className="tabular-nums">{p.stock}</TableCell>
                      <TableCell>
                        {p.isDeleted ? (
                          <span className="text-red-600">Deleted</span>
                        ) : p.isActive ? (
                          <span className="text-emerald-600">Active</span>
                        ) : (
                          <span className="text-amber-600">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            className="text-sm font-medium text-primary hover:underline"
                            disabled={p.isDeleted}
                            onClick={() => {
                              setSelected(p);
                              setModal("edit");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-sm font-medium text-red-600 hover:underline"
                            disabled={p.isDeleted}
                            onClick={() => remove(p)}
                          >
                            Remove
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

        {modal === "create" && (
          <ProductFormModal
            key="create"
            categories={categories}
            title="Create product"
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              void load();
            }}
          />
        )}
        {modal === "edit" && selected && !selected.isDeleted && (
          <ProductFormModal
            key={selected._id}
            categories={categories}
            title="Edit product"
            initial={selected}
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              void load();
            }}
          />
        )}
      </div>
    </RequireRole>
  );
}
