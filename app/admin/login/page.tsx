import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  if (await isAdmin()) redirect(redirectTo || "/");

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin login</h1>
        <p className="mt-1 text-sm text-muted">
          Enter the studio password to manage inventory.
        </p>
      </div>
      <LoginForm redirectTo={redirectTo ?? "/"} />
    </div>
  );
}
