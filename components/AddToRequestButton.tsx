"use client";

import { useCart } from "./CartProvider";

export default function AddToRequestButton({
  productId,
  disabled,
  size = "sm",
}: {
  productId: string;
  disabled?: boolean;
  size?: "sm" | "lg";
}) {
  const { has, add, remove } = useCart();
  const inCart = has(productId);

  if (disabled) {
    return <span className="text-xs text-muted">Not available to request</span>;
  }

  function handleClick(e: React.MouseEvent) {
    // ProductCard renders this inside a Link wrapping the whole card -- stop
    // the click from also triggering navigation.
    e.preventDefault();
    e.stopPropagation();
    if (inCart) remove(productId);
    else add(productId);
  }

  const base = "font-medium transition";
  const sizeClass = size === "lg" ? "rounded-md border px-3 py-1.5 text-sm" : "text-xs underline-offset-2 hover:underline";
  const toneClass = inCart
    ? size === "lg"
      ? "border-border text-foreground hover:border-foreground"
      : "text-foreground"
    : size === "lg"
      ? "border-foreground bg-foreground text-background hover:opacity-85"
      : "text-foreground";

  return (
    <button type="button" onClick={handleClick} className={`${base} ${sizeClass} ${toneClass}`}>
      {inCart ? "Remove from request" : "Add to request"}
    </button>
  );
}
