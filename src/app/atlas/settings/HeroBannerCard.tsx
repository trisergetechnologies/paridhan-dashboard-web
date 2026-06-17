"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiJson } from "@/lib/api/client";
import { uploadToImageKit } from "@/lib/imagekit-upload";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type HeroBannerSettings = {
  image: string;
  imageFileId: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
};

const DEFAULT_PREVIEW_IMAGE =
  "https://images.unsplash.com/photo-1610030161231-d2f51196ca8c?auto=format&fit=crop&w=1920&q=80";

const EMPTY_HERO: HeroBannerSettings = {
  image: "",
  imageFileId: "",
  eyebrow: "Paridhan Emporium",
  title: "Timeless sarees for every occasion",
  subtitle:
    "Handpicked silks, cottons, and festive weaves. Explore the collection or check back for new arrivals.",
  cta: "Explore the shop",
  href: "/shop",
};

export function HeroBannerCard() {
  const { isPlatformAdmin, isAuthLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hero, setHero] = useState<HeroBannerSettings>(EMPTY_HERO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await apiJson<{ hero: HeroBannerSettings }>("/admin/site/hero-banner");
    if (r.success && r.data?.hero) setHero({ ...EMPTY_HERO, ...r.data.hero });
    else if (!r.success) setError(r.message || "Could not load homepage banner");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && isPlatformAdmin) void load();
  }, [load, isAuthLoading, isPlatformAdmin]);

  const save = async () => {
    setMessage(null);
    setError(null);
    setSaving(true);
    const res = await apiFetch("/admin/site/hero-banner", {
      method: "PATCH",
      body: JSON.stringify({ hero }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.success) {
      setError(json.message || "Failed to save banner");
      return;
    }
    if (json.data?.hero) setHero({ ...EMPTY_HERO, ...json.data.hero });
    setMessage("Homepage banner saved. Refresh the customer site to see it.");
  };

  const onPickImage = async (file: File | null) => {
    if (!file) return;
    setMessage(null);
    setError(null);
    setUploading(true);
    try {
      const { url, fileId } = await uploadToImageKit(file, "/admin/imagekit/upload-auth", {
        folder: "/paridhan/hero",
      });
      setHero((prev) => ({ ...prev, image: url, imageFileId: fileId }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed. Is ImageKit configured?");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const previewImage = hero.image.trim() || DEFAULT_PREVIEW_IMAGE;

  if (isAuthLoading || !isPlatformAdmin) {
    return null;
  }

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h2 className="mb-2 text-xl font-semibold text-dark dark:text-white">Homepage hero banner</h2>
      <p className="mb-6 text-sm text-body dark:text-bodydark">
        The large banner at the top of the customer website. It stays fixed until you change it here — new products
        no longer replace the background image.
      </p>

      {loading ? (
        <p className="text-sm text-body dark:text-bodydark">Loading…</p>
      ) : (
        <>
          <div className="mb-6 overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
            <div className="relative aspect-[16/9] w-full bg-gray-2 dark:bg-dark-2">
              <Image
                src={previewImage}
                alt="Homepage banner preview"
                fill
                className="object-cover object-center"
                sizes="(max-width: 700px) 100vw, 700px"
                unoptimized={previewImage.startsWith("http") && !previewImage.includes("ik.imagekit.io")}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-primary">{hero.eyebrow}</p>
                <p className="mt-1 font-serif text-lg font-semibold text-white sm:text-xl">{hero.title}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => void onPickImage(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              disabled={uploading || saving}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {uploading ? "Uploading…" : hero.image ? "Replace background image" : "Upload background image"}
            </button>
            <p className="text-xs text-body dark:text-bodydark">
              Wide landscape photo works best (1920×1080 or similar). JPG, PNG, or WebP.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-dark dark:text-white">Eyebrow label</span>
              <input
                value={hero.eyebrow}
                onChange={(e) => setHero((prev) => ({ ...prev, eyebrow: e.target.value }))}
                className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-dark dark:text-white">Headline</span>
              <input
                value={hero.title}
                onChange={(e) => setHero((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-dark dark:text-white">Subtitle</span>
              <textarea
                value={hero.subtitle}
                onChange={(e) => setHero((prev) => ({ ...prev, subtitle: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-dark dark:text-white">Button label</span>
                <input
                  value={hero.cta}
                  onChange={(e) => setHero((prev) => ({ ...prev, cta: e.target.value }))}
                  className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-dark dark:text-white">Button link</span>
                <input
                  value={hero.href}
                  onChange={(e) => setHero((prev) => ({ ...prev, href: e.target.value }))}
                  placeholder="/shop"
                  className="w-full rounded-lg border border-stroke px-3 py-2 text-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving || uploading}
              onClick={() => void save()}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save banner"}
            </button>
            <button
              type="button"
              disabled={saving || uploading}
              onClick={() => void load()}
              className="rounded-lg border border-stroke px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
            >
              Reset changes
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
          ) : null}
          {message ? (
            <div className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-600 dark:bg-green-900/20">
              {message}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
