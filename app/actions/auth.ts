"use server";

import { redirect } from "next/navigation";
import { checkAdminPassword, clearAdminCookie, setAdminCookie } from "@/lib/auth";

export type LoginState = { error: string | null };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!checkAdminPassword(password)) {
    return { error: "Incorrect password." };
  }

  await setAdminCookie();
  redirect(redirectTo || "/");
}

export async function logoutAction() {
  await clearAdminCookie();
  redirect("/");
}
