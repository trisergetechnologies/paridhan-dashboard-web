"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiJson } from "@/lib/api/client";
import {
  EMPTY_PRODUCT_FIELD_OPTIONS,
  PRODUCT_FIELD_KEYS,
  PRODUCT_FIELD_LABELS,
  type ProductFieldKey,
  type ProductFieldOptionsMap,
} from "@/lib/productFieldOptions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function FieldGroupEditor({
  fieldKey,
  values,
  onChange,
}: {
  fieldKey: ProductFieldKey;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    const exists = values.some((x) => x.toLowerCase() === v.toLowerCase());
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  };

  const remove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <section className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-dark dark:text-white">{PRODUCT_FIELD_LABELS[fieldKey]}</h2>
        <p className="mt-0.5 text-xs text-body dark:text-bodydark">
          Sellers see these as quick picks; they can still type a custom value.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {values.length === 0 ? (
          <p className="text-sm text-body dark:text-bodydark">No suggestions yet.</p>
        ) : (
          values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-stroke bg-gray-2 px-3 py-1 text-sm text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-0.5 rounded-full px-1 text-body hover:text-red-600 dark:text-bodydark"
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={`Add ${PRODUCT_FIELD_LABELS[fieldKey].toLowerCase()} option…`}
          className="flex-1 rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Add
        </button>
      </div>
    </section>
  );
}

export default function ProductFieldsSettingsPage() {
  const { isPlatformAdmin, isAuthLoading } = useAuth();
  const router = useRouter();
  const [options, setOptions] = useState<ProductFieldOptionsMap>(EMPTY_PRODUCT_FIELD_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<ProductFieldKey>("fabric");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await apiJson<{ options: ProductFieldOptionsMap }>("/admin/product-field-options");
    if (r.success && r.data?.options) setOptions(r.data.options);
    else setError(r.message || "Could not load product field options");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isPlatformAdmin) {
      router.replace("/atlas/settings/password");
      return;
    }
    void load();
  }, [isAuthLoading, isPlatformAdmin, load, router]);

  const save = async () => {
    setMessage(null);
    setError(null);
    setSaving(true);
    const res = await apiFetch("/admin/product-field-options", {
      method: "PATCH",
      body: JSON.stringify({ options }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.success) {
      setError(json.message || "Failed to save");
      return;
    }
    if (json.data?.options) setOptions(json.data.options);
    setMessage("Product field suggestions saved. Sellers will see them on the next form open.");
  };

  const patchField = (key: ProductFieldKey, values: string[]) => {
    setOptions((prev) => ({ ...prev, [key]: values }));
  };

  if (isAuthLoading || !isPlatformAdmin) {
    return (
      <>
        <Breadcrumb pageName="Product fields" />
        <p className="py-6 text-sm text-body dark:text-bodydark">Loading…</p>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Product fields" />
      <div className="mx-auto w-full max-w-[820px] space-y-6">
        <div>
          <h1 className="text-[22px] font-semibold text-dark dark:text-white">Product field suggestions</h1>
          <p className="mt-1 text-sm text-body dark:text-bodydark">
            Manage dropdown suggestions for saree details (fabric, occasion, care, etc.). Sellers pick from your list
            or type their own text.
          </p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700 dark:text-green-400">{message}</p> : null}

        {loading ? (
          <p className="text-sm text-body dark:text-bodydark">Loading…</p>
        ) : (
          <>
            <nav
              className="flex flex-wrap gap-2 border-b border-stroke pb-3 dark:border-dark-3"
              aria-label="Product field groups"
            >
              {PRODUCT_FIELD_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setOpenKey(key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition",
                    openKey === key
                      ? "bg-primary text-white"
                      : "bg-gray-2 text-body hover:text-dark dark:bg-dark-2 dark:text-bodydark dark:hover:text-white",
                  )}
                >
                  {PRODUCT_FIELD_LABELS[key]}
                  <span className="ml-1.5 text-xs opacity-80">({options[key]?.length ?? 0})</span>
                </button>
              ))}
            </nav>

            <FieldGroupEditor
              fieldKey={openKey}
              values={options[openKey] ?? []}
              onChange={(vals) => patchField(openKey, vals)}
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save all suggestions"}
              </button>
              <button
                type="button"
                onClick={() => void load()}
                disabled={saving}
                className="rounded-lg border border-stroke px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
              >
                Reset changes
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
