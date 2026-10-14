import type { Metadata } from "next";
import "@/styles/admin.css";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel Lavena" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="admin-root">{children}</div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
