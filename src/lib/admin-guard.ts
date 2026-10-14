import "server-only";
import { redirect } from "next/navigation";
import { isAdmin } from "./auth";

/**
 * Chame no topo de TODA página do painel. Layouts não são reexecutados em navegações
 * internas, então a checagem precisa estar também em cada página.
 */
export async function requirePageAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
