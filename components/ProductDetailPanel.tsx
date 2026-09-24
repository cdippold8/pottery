"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CATEGORY_LABELS, PRODUCT_CATEGORIES, ProductCategoryValue } from "@/lib/constants";
// Only ever rendered for a logged-in admin (see app/product/[id]/page.tsx) —
// anonymous visitors get ProductPublicView instead, which is a plain Server
// Component and never serializes internal fields to the client.
import { patternValue } from "@/lib/value";
import { deleteProduct, markProductSold, updateProduct } from "@/app/actions/products";
import PatternPicker, { PatternOption } from "./PatternPicker";
import ColorPicker, { ColorOption } from "./ColorPicker";
import FavoriteHeart from "./FavoriteHeart";

type Product = {
  id: string;
  name: string;
  category: ProductCategoryValue;
  sold: boolean;
  favorite: boolean;
  costWholesale: number | null;
  costRetail: number | null;
  pattern: PatternOption | null;
  colors: { color: ColorOption }[];
};

export default function ProductDetailPanel({
  product,
  patterns,
  colors,
}: {
  product: Product;
  patterns: PatternOption[];
  colors: ColorOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateProduct(product.id, formData);
        setEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save changes");
      }
    });
  }

  function handleMarkSold(sold: boolean) {
    startTransition(async () => {
      await markProductSold(product.id, sold);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteProduct(product.id);
    });
  }

  if (!editing) {
    const value = product.pattern
      ? patternValue(product.pattern.difficulty, product.pattern.enjoyment, product.pattern.preference)
      : null;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <div className="flex items-center gap-2">
            <FavoriteHeart productId={product.id} initialFavorite={product.favorite} size="lg" />
            <span className="rounded-full border border-border px-3 py-1 text-xs font-medium">
              {product.sold ? "Sold" : "Available"}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted">{CATEGORY_LABELS[product.category]}</p>

        {value !== null && (
          <div>
            <p className="text-4xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted">Value</p>
          </div>
        )}

        {product.colors.length > 0 && (
          <p className="text-sm">
            Colors:{" "}
            {product.colors.map((c, i) => (
              <span key={c.color.id}>
                <Link href={`/?color=${c.color.id}`} className="underline hover:text-foreground">
                  {c.color.name}
                </Link>
                {i < product.colors.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}

        <div className="flex gap-6 text-sm">
          <p>Wholesale: {product.costWholesale != null ? `$${product.costWholesale.toFixed(2)}` : "—"}</p>
          <p>Retail: {product.costRetail != null ? `$${product.costRetail.toFixed(2)}` : "—"}</p>
        </div>

        {product.pattern && (
          <div className="rounded-md border border-border p-3 text-sm">
            <Link href={`/?pattern=${product.pattern.id}`} className="font-medium underline hover:text-foreground">
              Pattern: {product.pattern.name}
            </Link>
            <p className="mt-1 text-muted">
              Difficulty {product.pattern.difficulty} · Enjoyment {product.pattern.enjoyment} · Preference{" "}
              {product.pattern.preference}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-foreground"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleMarkSold(!product.sold)}
            disabled={isPending}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-foreground"
          >
            Mark as {product.sold ? "available" : "sold"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:border-red-400"
          >
            Delete product
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={handleSave} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input
          name="name"
          defaultValue={product.name}
          required
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        <select
          name="category"
          defaultValue={product.category}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <PatternPicker patterns={patterns} initialSelectedId={product.pattern?.id} />
      <ColorPicker colors={colors} initialSelectedIds={product.colors.map((c) => c.color.id)} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Wholesale cost</label>
          <input
            type="number"
            step="0.01"
            name="costWholesale"
            defaultValue={product.costWholesale ?? ""}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Retail cost</label>
          <input
            type="number"
            step="0.01"
            name="costRetail"
            defaultValue={product.costRetail ?? ""}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md border border-border px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
