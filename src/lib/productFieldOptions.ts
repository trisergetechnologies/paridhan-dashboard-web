export const PRODUCT_FIELD_KEYS = [
  "fabric",
  "color",
  "length",
  "occasion",
  "pattern",
  "fit",
  "texture",
  "washCare",
  "ironing",
  "storage",
] as const;

export type ProductFieldKey = (typeof PRODUCT_FIELD_KEYS)[number];

export type ProductFieldOptionsMap = Record<ProductFieldKey, string[]>;

export const PRODUCT_FIELD_LABELS: Record<ProductFieldKey, string> = {
  fabric: "Fabric",
  color: "Colour",
  length: "Saree length",
  occasion: "Occasion",
  pattern: "Pattern",
  fit: "Fit / drape",
  texture: "Texture",
  washCare: "Wash care",
  ironing: "Ironing",
  storage: "Storage",
};

export const EMPTY_PRODUCT_FIELD_OPTIONS: ProductFieldOptionsMap = Object.fromEntries(
  PRODUCT_FIELD_KEYS.map((k) => [k, []]),
) as ProductFieldOptionsMap;
