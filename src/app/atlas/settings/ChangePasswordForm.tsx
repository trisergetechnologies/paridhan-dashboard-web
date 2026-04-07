"use client";

import { apiFetch } from "@/lib/api/client";
import { useState } from "react";

export function ChangePasswordForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setMessage(null);
    setError(null);

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch("/user/me/password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || "Failed to update password");
        return;
      }

      setMessage("Password updated successfully");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      setError("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h2 className="mb-6 text-xl font-semibold text-dark dark:text-white">Update your password</h2>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Current password</label>
          <input
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-dark-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">New password</label>
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-dark-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Confirm new password</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-dark-3"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20">{error}</div>
        )}

        {message && (
          <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-600 dark:bg-green-900/20">
            {message}
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </div>
      </div>
    </div>
  );
}
