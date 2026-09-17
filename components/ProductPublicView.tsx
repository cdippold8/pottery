import { CATEGORY_LABELS, ProductCategoryValue } from "@/lib/constants";

// Server Component only — deliberately not "use client". Anything rendered
// here is safe to show to anonymous visitors, so this component (and only
// this component) is what the public share view is allowed to render for
// the product's details.
export default function ProductPublicView({
  product,
}: {
  product: {
    name: string;
    category: ProductCategoryValue;
    sold: boolean;
    costRetail: number | null;
    pattern: { name: string } | null;
    colors: { color: { name: string } }[];
  };
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium">
          {product.sold ? "Sold" : "Available"}
        </span>
      </div>
      <p className="text-sm text-muted">{CATEGORY_LABELS[product.category]}</p>
      {product.pattern && <p className="text-sm">Pattern: {product.pattern.name}</p>}
      {product.colors.length > 0 && (
        <p className="text-sm">Colors: {product.colors.map((c) => c.color.name).join(", ")}</p>
      )}
      {product.costRetail != null && <p className="text-lg font-medium">${product.costRetail.toFixed(2)}</p>}
    </div>
  );
}
