"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();

  const handleAction = () => {
    if (isAuthenticated) {
      router.push("/atlas");
    } else {
      router.push("/auth");
    }
  };

  if (isAuthLoading) return null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617]" />

      {/* Decorative Glows */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[160px]" />
      <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-purple-500/30 blur-[160px]" />
      <div className="absolute bottom-[-200px] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[180px]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium text-white/70 backdrop-blur">
            Paridhan · Operations
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Paridhan
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Sign in as a platform administrator or a seller to manage catalog, orders, and storefront
            operations from one place.
          </p>

          {/* CTA */}
          <div className="flex justify-center">
            <button
              onClick={handleAction}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-primary/40"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10">
                Open dashboard
              </span>
            </button>
          </div>

          {/* Footer Hint */}
          <p className="mt-8 text-xs text-white/40">
            Secure · Fast
          </p>
        </div>
      </div>
    </div>
  );
}
