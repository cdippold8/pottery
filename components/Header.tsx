import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import Logo from "./Logo";
import CartBadge from "./CartBadge";
import { logoutAction } from "@/app/actions/auth";

export default async function Header() {
  const admin = await isAdmin();
  const pendingCount = admin ? await prisma.request.count({ where: { status: "pending" } }) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <CartBadge />
          {admin ? (
            <>
              <Link
                href="/admin/products/new"
                className="rounded-full bg-foreground px-4 py-2 font-medium text-background transition hover:opacity-85"
              >
                + Add new product
              </Link>
              <Link href="/admin/products/bulk" className="hidden text-muted hover:text-foreground sm:inline">
                Bulk upload
              </Link>
              <Link href="/admin/requests" className="hidden text-muted hover:text-foreground sm:inline">
                Requests
                {pendingCount > 0 && (
                  <span className="ml-1 rounded-full bg-foreground px-1.5 py-0.5 text-xs font-medium text-background">
                    {pendingCount}
                  </span>
                )}
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
