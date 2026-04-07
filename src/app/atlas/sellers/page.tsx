"use client";

import { RequireRole } from "@/components/Auth/RequireRole";
import { UserDetailModal } from "@/components/dashboard/UserDetailModal";
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

type Seller = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isBlocked?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
};

export default function SellersPage() {
  const [items, setItems] = useState<Seller[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [modal, setModal] = useState<"create" | "edit" | "password" | null>(null);
  const [selected, setSelected] = useState<Seller | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (q.trim()) params.set("q", q.trim());
    const r = await apiJson<{ items: Seller[]; pagination: { totalPages: number } }>(
      `/admin/sellers?${params}`,
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

  const softDelete = async (s: Seller) => {
    if (!confirm(`Deactivate seller ${s.name}? They will not be able to log in.`)) return;
    const res = await apiFetch(`/admin/sellers/${s._id}`, { method: "DELETE" });
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sellers</h1>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setModal("create");
            }}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            Add seller
          </button>
        </div>

        <input
          placeholder="Search name, email, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[240px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
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
                  {items.map((s) => (
                    <TableRow key={s._id} className="border-slate-100 dark:border-slate-800">
                      <TableCell className="pl-5 font-medium text-slate-900 dark:text-white">{s.name}</TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">{s.email}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{s.phone || "—"}</TableCell>
                      <TableCell>
                        {s.isDeleted ? (
                          <span className="text-red-600">Deleted</span>
                        ) : s.isBlocked ? (
                          <span className="text-amber-600">Blocked</span>
                        ) : (
                          <span className="text-emerald-600">Active</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            className="text-sm font-medium text-primary hover:underline"
                            disabled={s.isDeleted}
                            onClick={() => setDetailId(s._id)}
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            className="text-sm font-medium text-slate-700 hover:underline dark:text-slate-300"
                            disabled={s.isDeleted}
                            onClick={() => {
                              setSelected(s);
                              setModal("edit");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-sm font-medium text-primary hover:underline"
                            disabled={s.isDeleted}
                            onClick={() => {
                              setSelected(s);
                              setModal("password");
                            }}
                          >
                            Password
                          </button>
                          <button
                            type="button"
                            className="text-sm font-medium text-red-600 hover:underline"
                            disabled={s.isDeleted}
                            onClick={() => softDelete(s)}
                          >
                            Deactivate
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
          <SellerFormModal
            title="Create seller"
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              void load();
            }}
          />
        )}
        {modal === "edit" && selected && !selected.isDeleted && (
          <SellerEditModal
            seller={selected}
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              void load();
            }}
          />
        )}
        {modal === "password" && selected && !selected.isDeleted && (
          <SellerPasswordModal
            seller={selected}
            onClose={() => setModal(null)}
            onSaved={() => setModal(null)}
          />
        )}

        {detailId && <UserDetailModal userId={detailId} variant="seller" onClose={() => setDetailId(null)} />}
      </div>
    </RequireRole>
  );
}

function SellerFormModal({
  title,
  onClose,
  onSaved,
}: {
  title: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await apiFetch("/admin/sellers", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone: phone || undefined }),
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
    <DashboardModal title={title} onClose={onClose} size="md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Create"}
          </button>
        </div>
      </form>
    </DashboardModal>
  );
}

function SellerEditModal({
  seller,
  onClose,
  onSaved,
}: {
  seller: Seller;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(seller.name);
  const [email, setEmail] = useState(seller.email);
  const [phone, setPhone] = useState(seller.phone || "");
  const [isBlocked, setIsBlocked] = useState(!!seller.isBlocked);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await apiFetch(`/admin/sellers/${seller._id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, email, phone: phone || undefined, isBlocked }),
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
    <DashboardModal title="Edit seller" onClose={onClose} size="md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={isBlocked} onChange={(e) => setIsBlocked(e.target.checked)} />
          Blocked
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </DashboardModal>
  );
}

function SellerPasswordModal({
  seller,
  onClose,
  onSaved,
}: {
  seller: Seller;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await apiFetch(`/admin/sellers/${seller._id}/password`, {
      method: "PATCH",
      body: JSON.stringify({ password }),
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
    <DashboardModal title={`Set password — ${seller.name}`} onClose={onClose} size="md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password" type="password" value={password} onChange={setPassword} required minLength={6} />
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </DashboardModal>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700 dark:text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-primary/20 focus:ring-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
      />
    </label>
  );
}
