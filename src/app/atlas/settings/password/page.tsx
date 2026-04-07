"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

import { ChangePasswordForm } from "../ChangePasswordForm";

export default function SettingsPasswordPage() {
  return (
    <>
      <Breadcrumb pageName="Change Password" />
      <ChangePasswordForm />
    </>
  );
}
