"use client";

import { RequireRole } from "@/components/Auth/RequireRole";
import { DashboardModal } from "@/components/ui/DashboardModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, apiJson } from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";

type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  productCount?: number;
};

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    const r = await apiJson<{ items: Category[]; pagination: { totalPages: number } }>(
      `/admin/categories?${params}`,
    );
    if (r.success) {
      setItems(r.data.items);
      setTotalPages(r.data.pagination.totalPages);
    } else setError(r.message);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    const res = await apiFetch(`/admin/categories/${c._id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || "Failed");
      return;
    }
    void load();
  };

  return (
    <RequireRole admin>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Categories</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Sellers assign products to these categories. Inactive categories are hidden on the storefront.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setModal("create");
            }}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Add category
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
                  <TableRow className="border-slate-200 bg-slate-50/90 hover:bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
                    <TableHead className="pl-5 font-semibold text-slate-700 dark:text-slate-200">Name</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Slug</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Status</TableHead>
                    <TableHead className="pr-5 text-right font-semibold text-slate-700 dark:text-slate-200">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow
                      key={c._id}
                      className="border-slate-100 dark:border-slate-800"
                    >
                      <TableCell className="pl-5 font-medium text-slate-900 dark:text-white">{c.name}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-300">{c.slug}</TableCell>
                      <TableCell>
                        {c.isActive ? (
                          <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            className="text-sm font-medium text-primary hover:underline"
                            onClick={() => {
                              setSelected(c);
                              setModal("edit");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-sm font-medium text-red-600 hover:underline"
                            onClick={() => remove(c)}
                          >
                            Delete
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
          <CategoryFormModal
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              void load();
            }}
          />
        )}
        {modal === "edit" && selected && (
          <CategoryFormModal
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

function CategoryFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Category;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const body = { name, description, isActive, ...(slug.trim() ? { slug: slug.trim() } : {}) };
    const url = initial ? `/admin/categories/${initial._id}` : "/admin/categories";
    const res = await apiFetch(url, {
      method: initial ? "PATCH" : "POST",
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok || !json.success) {
      alert(json.message || "Failed");
      return;
    }
    onSaved();
  };

  return (
    <DashboardModal title={initial ? "Edit category" : "New category"} onClose={onClose} size="md">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">
          <span className="text-slate-700 dark:text-slate-300">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-primary/20 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700 dark:text-slate-300">Slug (optional)</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto from name if empty"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700 dark:text-slate-300">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active on storefront
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium dark:border-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : initial ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </DashboardModal>
  );
}
