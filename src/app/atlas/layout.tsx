import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import ProtectedRoutes from "@/components/Auth/ProtectedRoutes";
import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s | Paridhan",
    default: "Dashboard",
  },
  description: "Paridhan operations",
};

export default function AtlasLayout({ children }: PropsWithChildren) {
  return (
    <ProtectedRoutes>
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#0c1222]">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />

          <main className="isolate mx-auto w-full max-w-screen-2xl flex-1 overflow-x-hidden p-4 md:p-6 2xl:p-10">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoutes>
  );
}
