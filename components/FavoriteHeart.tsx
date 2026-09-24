"use client";

import { useState, useTransition } from "react";
import { toggleProductFavorite } from "@/app/actions/products";

export default function FavoriteHeart({
  productId,
  initialFavorite,
  size = "sm",
}: {
  productId: string;
  initialFavorite: boolean;
  size?: "sm" | "lg";
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      await toggleProductFavorite(productId, next);
    });
  }

  const dimensions = size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const iconSize = size === "lg" ? 18 : 14;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorite}
      className={`flex ${dimensions} items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-105`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 20 20"
        fill={favorite ? "#e11d48" : "none"}
        stroke={favorite ? "#e11d48" : "currentColor"}
        strokeWidth="1.5"
      >
        <path
          d="M10 17.5s-6.5-4.06-8.5-8.02C.34 6.5 1.9 3.5 5 3.5c1.8 0 3.2 1 5 3 1.8-2 3.2-3 5-3 3.1 0 4.66 3 3.5 5.98-2 3.96-8.5 8.02-8.5 8.02z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
