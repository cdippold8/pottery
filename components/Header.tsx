import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import Logo from "./Logo";
import { logoutAction } from "@/app/actions/auth";

export default async function Header() {
  const admin = await isAdmin();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {admin ? (
            <>
              <Link
                href="/admin/products/new"
                className="rounded-full bg-foreground px-4 py-2 font-medium text-background transition hover:opacity-85"
              >
                + Add new product
              </Link>
              <Link href="/admin/patterns" className="hidden text-muted hover:text-foreground sm:inline">
                Patterns
              </Link>
              <Link href="/admin/colors" className="hidden text-muted hover:text-foreground sm:inline">
                Colors
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="text-muted hover:text-foreground">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link href="/admin/login" className="text-muted hover:text-foreground">
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
