"use client";

import { ComboboxField } from "@/components/ui/ComboboxField";
import { DashboardModal } from "@/components/ui/DashboardModal";
import { apiFetch, apiJson } from "@/lib/api/client";
import { type ProductImagePayload, uploadToImageKit } from "@/lib/imagekit-upload";
import {
  EMPTY_PRODUCT_FIELD_OPTIONS,
  type ProductFieldOptionsMap,
} from "@/lib/productFieldOptions";
import { useCallback, useEffect, useMemo, useState } from "react";

export type SellerProductRow = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
  isDeleted?: boolean;
  categories?: { _id: string; name: string }[];
};

type Category = { _id: string; name: string; slug: string };

type VariantFormRow = {
  publicId: string;
  attributes: { name: string; value: string }[];
  sku: string;
  price: string;
  mrp: string;
  stock: string;
  isActive: boolean;
  images: ProductImagePayload[];
};

function emptyVariantRow(): VariantFormRow {
  return {
    publicId: "",
    attributes: [
      { name: "Blouse", value: "" },
      { name: "Border", value: "" },
    ],
    sku: "",
    price: "",
    mrp: "",
    stock: "0",
    isActive: true,
    images: [],
  };
}

function mapApiVariantToRow(v: Record<string, unknown>): VariantFormRow {
  const attrs = (v.attributes as { name?: string; value?: string }[]) || [];
  const imgs = (v.images as { url?: string; alt?: string; fileId?: string }[]) || [];
  return {
    publicId: String(v.publicId || ""),
    attributes:
      attrs.length > 0
        ? attrs.map((a) => ({ name: String(a.name || ""), value: String(a.value || "") }))
        : [{ name: "Option", value: "" }],
    sku: String(v.sku || ""),
    price: v.price != null ? String(v.price) : "",
    mrp: v.mrp != null ? String(v.mrp) : "",
    stock: String(v.stock ?? "0"),
    isActive: v.isActive !== false,
    images: imgs.map((i) => ({
      url: String(i.url || ""),
      alt: String(i.alt || ""),
      ...(i.fileId ? { fileId: String(i.fileId) } : {}),
    })),
  };
}

function rowToPayload(row: VariantFormRow) {
  const attrs = row.attributes
    .map((a) => ({ name: a.name.trim(), value: a.value.trim() }))
    .filter((a) => a.name || a.value);
  return {
    ...(row.publicId.trim() ? { publicId: row.publicId.trim() } : {}),
    attributes: attrs.length ? attrs : [{ name: "Default", value: "Standard" }],
    sku: row.sku.trim() || undefined,
    price: row.price.trim() !== "" ? Number(row.price) : undefined,
    mrp: row.mrp.trim() !== "" ? Number(row.mrp) : undefined,
    stock: Math.max(0, Number(row.stock) || 0),
    isActive: row.isActive,
    images: row.images.filter((i) => i.url),
  };
}

export function ProductFormModal({
  categories,
  title,
  initial,
  onClose,
  onSaved,
}: {
  categories: Category[];
  title: string;
  initial?: SellerProductRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [gstPercent, setGstPercent] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<ProductImagePayload[]>([]);
  const [variants, setVariants] = useState<VariantFormRow[]>([]);
  const [fabric, setFabric] = useState("");
  const [color, setColor] = useState("");
  const [blouseIncluded, setBlouseIncluded] = useState(true);
  const [length, setLength] = useState("5.5m");
  const [occasion, setOccasion] = useState("");
  const [pattern, setPattern] = useState("");
  const [fit, setFit] = useState("");
  const [texture, setTexture] = useState("");
  const [washCare, setWashCare] = useState("");
  const [ironing, setIroning] = useState("");
  const [storage, setStorage] = useState("");
  const [shippingUseDefault, setShippingUseDefault] = useState(true);
  const [shippingCharge, setShippingCharge] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detailLoading, setDetailLoading] = useState(Boolean(initial));
  const [detailError, setDetailError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<ProductFieldOptionsMap>(EMPTY_PRODUCT_FIELD_OPTIONS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await apiJson<{ options: ProductFieldOptionsMap }>("/seller/product-field-options");
      if (!cancelled && r.success && r.data?.options) setFieldOptions(r.data.options);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const calcDiscountFromMrp = useMemo(() => {
    const p = Number(price);
    const m = Number(mrp);
    if (!mrp || Number.isNaN(m) || Number.isNaN(p) || m <= 0 || m <= p) return null;
    return Math.round(((m - p) / m) * 100);
  }, [price, mrp]);

  useEffect(() => {
    if (!initial) {
      setDetailLoading(false);
      setDetailError(null);
      setName("");
      setDescription("");
      setPrice("");
      setMrp("");
      setStock("");
      setDiscountPercentage("");
      setGstPercent("");
      setHsnCode("");
      setSelectedCats([]);
      setIsActive(true);
      setImages([]);
      setVariants([]);
      setFabric("");
      setColor("");
      setBlouseIncluded(true);
      setLength("5.5m");
      setOccasion("");
      setPattern("");
      setFit("");
      setTexture("");
      setWashCare("");
      setIroning("");
      setStorage("");
      setShippingUseDefault(true);
      setShippingCharge("");
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    (async () => {
      const r = await apiJson<Record<string, unknown>>(`/seller/products/${initial._id}`);
      if (cancelled) return;
      if (!r.success) {
        setDetailError(r.message || "Could not load product details");
        setDetailLoading(false);
        return;
      }
      const d = r.data;
      setName(String(d.name ?? ""));
      setDescription(String(d.description ?? ""));
      setPrice(String(d.price ?? ""));
      setStock(String(d.stock ?? ""));
      setIsActive(Boolean(d.isActive));
      if (d.mrp != null) setMrp(String(d.mrp));
      else setMrp("");
      if (d.discountPercentage != null) setDiscountPercentage(String(d.discountPercentage));
      else setDiscountPercentage("");
      if (d.gstPercent != null) setGstPercent(String(d.gstPercent));
      else setGstPercent("");
      setHsnCode(d.hsnCode != null ? String(d.hsnCode) : "");
      const cats = (d.categories as { _id: string }[]) || [];
      setSelectedCats(cats.map((c) => String(c._id)));
      const imgs = (d.images as { url?: string; alt?: string; fileId?: string }[]) || [];
      setImages(
        imgs.map((i) => ({
          url: String(i.url || ""),
          alt: String(i.alt || ""),
          ...(i.fileId ? { fileId: String(i.fileId) } : {}),
        })),
      );
      const vars = (d.variants as Record<string, unknown>[]) || [];
      setVariants(vars.length ? vars.map(mapApiVariantToRow) : []);
      setFabric(d.fabric != null ? String(d.fabric) : "");
      setColor(d.color != null ? String(d.color) : "");
      setBlouseIncluded(d.blouseIncluded !== false);
      setLength(d.length != null ? String(d.length) : "5.5m");
      setOccasion(d.occasion != null ? String(d.occasion) : "");
      setPattern(d.pattern != null ? String(d.pattern) : "");
      setFit(d.fit != null ? String(d.fit) : "");
      setTexture(d.texture != null ? String(d.texture) : "");
      setWashCare(d.washCare != null ? String(d.washCare) : "");
      setIroning(d.ironing != null ? String(d.ironing) : "");
      setStorage(d.storage != null ? String(d.storage) : "");
      setShippingUseDefault(d.shippingUseDefault !== false);
      setShippingCharge(
        d.shippingCharge != null && d.shippingUseDefault === false
          ? String(d.shippingCharge)
          : "",
      );
      setDetailLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [initial?._id]);

  const toggleCat = (id: string) => {
    setSelectedCats((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const uploadFiles = useCallback(
    async (files: FileList | File[], target: "product" | { variantIndex: number }) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) return;
      setUploading(true);
      try {
        for (const file of list) {
          const { url, fileId } = await uploadToImageKit(file, "/seller/imagekit/upload-auth", {
            folder: "/paridhan/products",
            fileName: file.name,
          });
          const payload: ProductImagePayload = { url, alt: file.name.replace(/\.[^.]+$/, ""), fileId };
          if (target === "product") {
            setImages((prev) => [...prev, payload]);
          } else {
            const idx = target.variantIndex;
            setVariants((prev) =>
              prev.map((row, i) => (i === idx ? { ...row, images: [...row.images, payload] } : row)),
            );
          }
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Image upload failed. Is ImageKit configured?");
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files, "product");
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateImageAlt = (idx: number, alt: string) => {
    setImages((prev) => prev.map((img, i) => (i === idx ? { ...img, alt } : img)));
  };

  const addVariant = () => setVariants((prev) => [...prev, emptyVariantRow()]);
  const removeVariant = (idx: number) => setVariants((prev) => prev.filter((_, i) => i !== idx));

  const updateVariant = (idx: number, patch: Partial<VariantFormRow>) => {
    setVariants((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const updateVariantAttr = (vIdx: number, aIdx: number, field: "name" | "value", value: string) => {
    setVariants((prev) =>
      prev.map((row, i) => {
        if (i !== vIdx) return row;
        const next = row.attributes.map((a, j) => (j === aIdx ? { ...a, [field]: value } : a));
        return { ...row, attributes: next };
      }),
    );
  };

  const addVariantAttr = (vIdx: number) => {
    setVariants((prev) =>
      prev.map((row, i) => (i === vIdx ? { ...row, attributes: [...row.attributes, { name: "", value: "" }] } : row)),
    );
  };

  const removeVariantImage = (vIdx: number, imgIdx: number) => {
    setVariants((prev) =>
      prev.map((row, i) =>
        i === vIdx ? { ...row, images: row.images.filter((_, j) => j !== imgIdx) } : row,
      ),
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCats.length === 0) {
      alert("Select at least one category");
      return;
    }
    setBusy(true);
    const variantPayload = variants.map(rowToPayload);
    const body: Record<string, unknown> = {
      name,
      description,
      price: Number(price),
      mrp: mrp.trim() !== "" ? Number(mrp) : undefined,
      stock: Number(stock),
      categories: selectedCats,
      isActive,
      images,
      variants: variantPayload,
      discountPercentage: discountPercentage.trim() !== "" ? Number(discountPercentage) : null,
      gstPercent: gstPercent.trim() !== "" ? Number(gstPercent) : null,
      hsnCode: hsnCode.trim() || null,
      fabric: fabric.trim() || null,
      color: color.trim() || null,
      blouseIncluded,
      length: length.trim() || "5.5m",
      occasion: occasion.trim() || null,
      pattern: pattern.trim() || null,
      fit: fit.trim() || null,
      texture: texture.trim() || null,
      washCare: washCare.trim() || null,
      ironing: ironing.trim() || null,
      storage: storage.trim() || null,
      shippingUseDefault,
      shippingCharge:
        !shippingUseDefault && shippingCharge.trim() !== ""
          ? Number(shippingCharge)
          : null,
    };
    const url = initial ? `/seller/products/${initial._id}` : "/seller/products";
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

  const dropzoneClass =
    "relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 transition-colors " +
    (dragActive
      ? "border-primary bg-primary/10 dark:bg-primary/15"
      : "border-slate-300/80 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 hover:border-primary/50 dark:border-slate-600 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20");

  return (
    <DashboardModal title={title} onClose={onClose} size="2xl">
      <form onSubmit={submit} className="space-y-6">
        {initial && detailLoading ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Loading product details…
          </p>
        ) : null}
        {detailError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {detailError}
          </p>
        ) : null}

        <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/40 sm:p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Basics</h3>
          <label className="block text-sm">
            <span className="text-slate-700 dark:text-slate-300">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700 dark:text-slate-300">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/40 sm:p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saree details</h3>
          <p className="text-xs text-slate-500">
            Pick a suggestion or type your own. Options are managed by the platform admin under Settings → Product
            fields.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <ComboboxField
              label="Fabric"
              listId="product-fabric"
              value={fabric}
              onChange={setFabric}
              options={fieldOptions.fabric}
              placeholder="e.g. Kanjivaram Silk"
            />
            <ComboboxField
              label="Colour"
              listId="product-color"
              value={color}
              onChange={setColor}
              options={fieldOptions.color}
              placeholder="e.g. Mustard Yellow"
            />
            <ComboboxField
              label="Saree length"
              listId="product-length"
              value={length}
              onChange={setLength}
              options={fieldOptions.length}
              placeholder="5.5m"
            />
            <label className="flex items-end gap-2 pb-2 text-sm text-slate-700 dark:text-slate-300 sm:col-span-2">
              <input
                type="checkbox"
                checked={blouseIncluded}
                onChange={(e) => setBlouseIncluded(e.target.checked)}
              />
              Blouse piece included
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <ComboboxField
              label="Occasion"
              listId="product-occasion"
              value={occasion}
              onChange={setOccasion}
              options={fieldOptions.occasion}
              placeholder="e.g. Wedding"
            />
            <ComboboxField
              label="Pattern"
              listId="product-pattern"
              value={pattern}
              onChange={setPattern}
              options={fieldOptions.pattern}
              placeholder="e.g. Banarasi jacquard"
            />
            <ComboboxField
              label="Fit / drape"
              listId="product-fit"
              value={fit}
              onChange={setFit}
              options={fieldOptions.fit}
              placeholder="e.g. Ready to drape"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/40 sm:p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fabric &amp; care</h3>
          <p className="text-xs text-slate-500">
            Shown on the Fabric &amp; Care tab on the product page. Leave blank to hide a row.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <ComboboxField
              label="Texture"
              listId="product-texture"
              value={texture}
              onChange={setTexture}
              options={fieldOptions.texture}
              placeholder="e.g. Soft, premium finish"
            />
            <ComboboxField
              label="Wash care"
              listId="product-wash-care"
              value={washCare}
              onChange={setWashCare}
              options={fieldOptions.washCare}
              placeholder="e.g. Dry clean recommended"
            />
            <ComboboxField
              label="Ironing"
              listId="product-ironing"
              value={ironing}
              onChange={setIroning}
              options={fieldOptions.ironing}
              placeholder="e.g. Low heat on reverse"
            />
            <ComboboxField
              label="Storage"
              listId="product-storage"
              value={storage}
              onChange={setStorage}
              options={fieldOptions.storage}
              placeholder="e.g. Fold in muslin cloth"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/40 sm:p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pricing & inventory</h3>
          <p className="text-xs text-slate-500">
            Base price and stock apply when the product has no variants, or as defaults for catalog rules. Add variants
            below for size/color options with their own price and stock.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm">
              <span className="text-slate-700 dark:text-slate-300">Selling price (₹)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 tabular-nums dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 dark:text-slate-300">MRP (₹)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 tabular-nums dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 dark:text-slate-300">Stock (units)</span>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 tabular-nums dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 dark:text-slate-300">Discount % (display)</span>
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                placeholder="Optional"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 tabular-nums dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 dark:text-slate-300">GST % (this product)</span>
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
                placeholder="Platform default if empty"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 tabular-nums dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 dark:text-slate-300">HSN code</span>
              <input
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="e.g. 540752"
                maxLength={16}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </label>
          </div>
          {calcDiscountFromMrp != null && (
            <p className="text-xs text-teal-700 dark:text-teal-400">
              From MRP vs selling price: ~{calcDiscountFromMrp}% off — you can still set an explicit discount % for badges.
            </p>
          )}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-900/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Delivery charge</p>
            <p className="mt-1 text-xs text-slate-500">
              Platform default: ₹80 delivery (free on orders above ₹999). Override for heavy or special sarees.
            </p>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={shippingUseDefault}
                onChange={(e) => {
                  setShippingUseDefault(e.target.checked);
                  if (e.target.checked) setShippingCharge("");
                }}
                className="size-4 rounded border-slate-300"
              />
              Use platform default shipping
            </label>
            {!shippingUseDefault ? (
              <label className="mt-3 block text-sm">
                <span className="text-slate-700 dark:text-slate-300">Custom shipping charge (₹)</span>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={shippingCharge}
                  onChange={(e) => setShippingCharge(e.target.value)}
                  required
                  placeholder="e.g. 150"
                  className="mt-1 w-full max-w-xs rounded-xl border border-slate-200 px-3 py-2.5 tabular-nums dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                />
              </label>
            ) : null}
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/40 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gallery</h3>
            <span className="text-xs text-slate-500">ImageKit · drag & drop or click</span>
          </div>
          <div
            className={dropzoneClass}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
              onChange={(e) => {
                const f = e.target.files;
                if (f?.length) void uploadFiles(f, "product");
                e.target.value = "";
              }}
              disabled={uploading}
            />
            <div className="pointer-events-none flex flex-col items-center gap-2 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Drop product images here</p>
              <p className="max-w-sm text-xs text-slate-500">PNG, JPG, WebP — multiple files. Removed images are deleted from ImageKit when you save.</p>
            </div>
          </div>
          {uploading && (
            <p className="text-center text-sm font-medium text-primary">Uploading…</p>
          )}
          {images.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img, idx) => (
                <li
                  key={`${img.url}-${idx}`}
                  className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-600 dark:bg-slate-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg ring-2 ring-white/20 transition hover:bg-red-700"
                  >
                    <span className="sr-only">Remove</span>×
                  </button>
                  <div className="border-t border-slate-200 p-2 dark:border-slate-600">
                    <label className="block text-[10px] font-medium uppercase text-slate-500">Alt text</label>
                    <input
                      value={img.alt}
                      onChange={(e) => updateImageAlt(idx, e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/40 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Variants</h3>
            <button
              type="button"
              onClick={addVariant}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              + Add variant
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Each variant can have its own price, MRP, stock, and optional images. Customers pick a variant at checkout.
          </p>
          {variants.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-600">
              No variants — this product uses base price and stock only.
            </p>
          ) : (
            <div className="space-y-4">
              {variants.map((row, vIdx) => (
                <div
                  key={vIdx}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-600 dark:bg-slate-900/30"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Variant {vIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeVariant(vIdx)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Remove variant
                    </button>
                  </div>
                  <div className="mb-3 space-y-2">
                    {row.attributes.map((attr, aIdx) => (
                      <div key={aIdx} className="flex flex-wrap gap-2 sm:flex-nowrap">
                        <input
                          placeholder="Label (e.g. Blouse)"
                          value={attr.name}
                          onChange={(e) => updateVariantAttr(vIdx, aIdx, "name", e.target.value)}
                          className="min-w-[100px] flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                        />
                        <input
                          placeholder="Value (e.g. Unstitched)"
                          value={attr.value}
                          onChange={(e) => updateVariantAttr(vIdx, aIdx, "value", e.target.value)}
                          className="min-w-[100px] flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addVariantAttr(vIdx)}
                      className="text-xs text-primary hover:underline"
                    >
                      + Add attribute
                    </button>
                  </div>
                  <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                      placeholder="SKU"
                      value={row.sku}
                      onChange={(e) => updateVariant(vIdx, { sku: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Price (₹)"
                      value={row.price}
                      onChange={(e) => updateVariant(vIdx, { price: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="MRP (₹)"
                      value={row.mrp}
                      onChange={(e) => updateVariant(vIdx, { mrp: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Stock"
                      value={row.stock}
                      onChange={(e) => updateVariant(vIdx, { stock: e.target.value })}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <label className="mb-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.isActive}
                      onChange={(e) => updateVariant(vIdx, { isActive: e.target.checked })}
                    />
                    Active
                  </label>
                  <div className="rounded-lg border border-dashed border-slate-200 p-3 dark:border-slate-600">
                    <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">Variant images (optional)</p>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="absolute inset-0 z-10 cursor-pointer opacity-0"
                        onChange={(e) => {
                          const f = e.target.files;
                          if (f?.length) void uploadFiles(f, { variantIndex: vIdx });
                          e.target.value = "";
                        }}
                        disabled={uploading}
                      />
                      <div className="rounded-lg bg-slate-50 py-4 text-center text-xs text-slate-500 dark:bg-slate-800/80">
                        Click to upload variant images
                      </div>
                    </div>
                    {row.images.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {row.images.map((img, imgIdx) => (
                          <li key={`${img.url}-${imgIdx}`} className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt="" className="size-16 rounded-lg border object-cover" />
                            <button
                              type="button"
                              onClick={() => removeVariantImage(vIdx, imgIdx)}
                              className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/40 sm:p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Categories</h3>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-600">
            {categories.map((c) => (
              <label key={c._id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selectedCats.includes(c._id)} onChange={() => toggleCat(c._id)} />
                {c.name}
              </label>
            ))}
          </div>
        </section>

        {initial && (
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active (visible when not deleted)
          </label>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium dark:border-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || (Boolean(initial) && detailLoading)}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {busy ? "Saving…" : initial ? "Save product" : "Create product"}
          </button>
        </div>
      </form>
    </DashboardModal>
  );
}
