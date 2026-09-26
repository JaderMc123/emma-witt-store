import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Administración", template: "%s · Admin Emma WITT" }, robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return children;
}
