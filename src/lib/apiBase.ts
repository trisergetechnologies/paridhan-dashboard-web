function ensureUrlProtocol(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const isLocal =
    /^localhost(?::\d+)?(\/|$)/i.test(value) ||
    /^127\.0\.0\.1(?::\d+)?(\/|$)/.test(value);
  return `${isLocal ? "http" : "https"}://${value}`;
}

export function normalizeApiBaseUrl(raw: string | undefined | null): string {
  if (raw == null || !String(raw).trim()) return "";
  let u = String(raw).trim().replace(/\/$/, "");
  u = ensureUrlProtocol(u);
  if (/\/api\/v\d+$/i.test(u)) return u;
  return `${u}/api/v1`;
}
