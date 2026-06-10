"use client";

import { GoogleIcon } from "@/assets/icons";
import type { DashboardRole } from "@/context/AuthContext";
import { startGoogleOAuth } from "@/lib/googleOAuth";

export default function GoogleSigninButton({
  text,
  role,
}: {
  text: string;
  role: DashboardRole;
}) {
  return (
    <button
      type="button"
      onClick={() => startGoogleOAuth(role)}
      className="flex w-full items-center justify-center gap-3.5 rounded-lg border border-stroke bg-gray-2 p-[15px] font-medium hover:bg-opacity-50 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-opacity-50"
    >
      <GoogleIcon />
      {text} with Google
    </button>
  );
}
