"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartBadge() {
  const { ids } = useCart();

  return (
    <Link href="/request" className="relative text-muted hover:text-foreground">
      Request list
      {ids.length > 0 && (
        <span className="ml-1 rounded-full bg-foreground px-1.5 py-0.5 text-xs font-medium text-background">
          {ids.length}
        </span>
      )}
    </Link>
  );
}
