import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import { AuthProvider } from "@/context/AuthContext";
import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import NextTopLoader from "nextjs-toploader";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | Paridhan",
    default: "Paridhan Dashboard",
  },
  description: "Paridhan platform admin and seller dashboard",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <Providers>
            <NextTopLoader color="#0d9488" showSpinner={false} height={3} />
            {children}
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
