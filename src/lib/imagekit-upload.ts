import { apiFetch, apiJson } from "./api/client";

export type ProductImagePayload = { url: string; alt: string; fileId?: string };

type AuthPayload = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
};

const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

/**
 * Upload a file to ImageKit using server-issued auth (see https://imagekit.io/docs).
 * `authPath` is `/admin/imagekit/upload-auth` or `/seller/imagekit/upload-auth`.
 */
export async function uploadToImageKit(
  file: File,
  authPath: "/admin/imagekit/upload-auth" | "/seller/imagekit/upload-auth",
  options?: { folder?: string; fileName?: string },
): Promise<{ url: string; fileId: string }> {
  const authRes = await apiJson<AuthPayload>(authPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!authRes.success || !authRes.data?.signature) {
    throw new Error(authRes.message || "Could not get ImageKit upload credentials");
  }
  const { token, expire, signature, publicKey } = authRes.data;

  const form = new FormData();
  form.append("file", file);
  form.append("fileName", options?.fileName || file.name.replace(/[^\w.-]+/g, "_"));
  form.append("publicKey", publicKey);
  form.append("signature", signature);
  form.append("token", token);
  form.append("expire", String(expire));
  if (options?.folder) {
    form.append("folder", options.folder);
  }

  const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || "ImageKit upload failed");
  }
  const url = json.url as string;
  const fileId = json.fileId as string;
  if (!url || !fileId) {
    throw new Error("ImageKit response missing url or fileId");
  }
  return { url, fileId };
}

export async function deleteImageKitFile(
  fileId: string,
  path: "/admin/imagekit/delete-file" | "/seller/imagekit/delete-file",
): Promise<void> {
  await apiFetch(path, {
    method: "POST",
    body: JSON.stringify({ fileId }),
  });
}
