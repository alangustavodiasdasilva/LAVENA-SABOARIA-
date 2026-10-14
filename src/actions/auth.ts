"use server";

import { adminAction, changePasswordWithCurrent, loginWithPassword, logoutAdmin } from "@/lib/auth";

export async function login(password: string) {
  return loginWithPassword(String(password ?? ""));
}

export async function logout() {
  await logoutAdmin();
}

export async function changePassword(current: string, next: string) {
  return adminAction("changePassword", () => changePasswordWithCurrent(String(current ?? ""), String(next ?? "")));
}
