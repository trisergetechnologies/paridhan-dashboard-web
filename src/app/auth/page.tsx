"use client";

import { useAuth, type DashboardRole } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Signin() {
  const router = useRouter();
  const { loginWithPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState<DashboardRole>("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginWithPassword(email, password, requestedRole);
      router.push("/atlas");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617]" />
      <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-primary/30 blur-[140px]" />
      <div className="absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-purple-500/30 blur-[140px]" />

      <div className="relative w-full max-w-[400px] rounded-2xl bg-white/90 shadow-2xl backdrop-blur-xl dark:bg-dark/90">
        <div className="border-b border-stroke px-6 py-5 dark:border-dark-3">
          <h2 className="text-center text-2xl font-semibold text-dark dark:text-white">
            Paridhan Dashboard
          </h2>
          <p className="text-body-color mt-1 text-center text-sm">
            Sign in as platform admin or seller
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="mb-4">
            <span className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Account type
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRequestedRole("admin")}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  requestedRole === "admin"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-stroke text-dark dark:border-dark-3 dark:text-white"
                }`}
              >
                Platform admin
              </button>
              <button
                type="button"
                onClick={() => setRequestedRole("seller")}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  requestedRole === "seller"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-stroke text-dark dark:border-dark-3 dark:text-white"
                }`}
              >
                Seller
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
