"use client";

import { useAuth } from "@/context/AuthContext";
import { setTokens } from "@/lib/api/sessionTokens";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function GoogleOAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();
  const [message, setMessage] = useState("Completing Google sign-in...");
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const error = searchParams.get("error");
    if (error) {
      setMessage(decodeURIComponent(error));
      router.replace("/auth");
      return;
    }

    const code = searchParams.get("code");
    if (!code) {
      setMessage("Missing Google sign-in code.");
      router.replace("/auth");
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/google/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Google sign-in exchange failed");
        }
        const accessToken = json.data?.accessToken;
        const refreshToken = json.data?.refreshToken;
        if (!accessToken || !refreshToken) {
          throw new Error("Server did not return session tokens");
        }
        setTokens(accessToken, refreshToken);
        await refreshProfile();
        router.replace("/atlas");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Google sign-in failed";
        setMessage(msg);
        router.replace("/auth");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] px-4">
      <p className="max-w-sm text-center text-sm text-white/80">{message}</p>
    </div>
  );
}
