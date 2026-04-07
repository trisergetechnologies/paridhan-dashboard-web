import type { PropsWithChildren } from "react";
import type { Metadata } from "next";

import SettingsShell from "./SettingsShell";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsLayout({ children }: PropsWithChildren) {
  return <SettingsShell>{children}</SettingsShell>;
}
