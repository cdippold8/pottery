"use client";

import { useActionState } from "react";
import { loginAction, LoginState } from "@/app/actions/auth";

const initialState: LoginState = { error: null };

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        autoFocus
        className="rounded-md border border-border px-3 py-2 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
