import GoogleOAuthCallbackContent from "./GoogleOAuthCallbackContent";
import { Suspense } from "react";

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] px-4">
          <p className="max-w-sm text-center text-sm text-white/80">Completing Google sign-in...</p>
        </div>
      }
    >
      <GoogleOAuthCallbackContent />
    </Suspense>
  );
}
