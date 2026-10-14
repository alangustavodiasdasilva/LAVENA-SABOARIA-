import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/login-form";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await isAdmin().catch(() => false)) redirect("/admin");
  return (
    <div className="admin-center">
      <LoginForm />
    </div>
  );
}
