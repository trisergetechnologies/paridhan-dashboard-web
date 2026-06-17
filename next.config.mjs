/** @type {import("next").NextConfig} */

function normalizeProxyTarget(raw) {
  let value = raw.trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(value)) {
    const isLocal =
      /^localhost(?::\d+)?$/i.test(value) || /^127\.0\.0\.1(?::\d+)?$/.test(value);
    value = `${isLocal ? "http" : "https"}://${value}`;
  }
  return value;
}

function resolveApiProxyOrigin() {
  const explicit = process.env.API_PROXY_TARGET?.trim();
  if (explicit) return normalizeProxyTarget(explicit);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiUrl) {
    let normalized = apiUrl.replace(/\/$/, "");
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    normalized = normalized.replace(/\/api\/v\d+$/i, "");
    return normalizeProxyTarget(normalized);
  }

  if (process.env.NODE_ENV === "production") {
    return "https://api.paridhanemporium.com";
  }

  return normalizeProxyTarget(process.env.BACKEND_URL || "http://127.0.0.1:4601");
}

const apiProxyTarget = resolveApiProxyOrigin();

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "pub-b7fd9c30cdbf439183b75041f5f71b92.r2.dev",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
