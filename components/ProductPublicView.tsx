import Link from "next/link";
import { CATEGORY_LABELS, CHIP_LINK_CLASS, ProductCategoryValue } from "@/lib/constants";
import AddToRequestButton from "./AddToRequestButton";

// Server Component only — deliberately not "use client". Anything rendered
// here is safe to show to anonymous visitors, so this component (and only
// this component) is what the public share view is allowed to render for
// the product's details.
export default function ProductPublicView({
  product,
}: {
  product: {
    id: string;
    name: string;
    category: ProductCategoryValue;
    sold: boolean;
    requestedInId: string | null;
    costRetail: number | null;
    pattern: { id: string; name: string } | null;
    colors: { color: { id: string; name: string } }[];
  };
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium">
          {product.sold ? "Sold" : product.requestedInId ? "Requested" : "Available"}
        </span>
      </div>
      <p className="text-sm text-muted">{CATEGORY_LABELS[product.category]}</p>

      <AddToRequestButton
        productId={product.id}
        disabled={product.sold || Boolean(product.requestedInId)}
        size="lg"
      />

      {product.colors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span>Colors:</span>
          {product.colors.map((c) => (
            <Link key={c.color.id} href={`/?color=${c.color.id}`} className={CHIP_LINK_CLASS}>
              {c.color.name}
            </Link>
          ))}
        </div>
      )}

      {product.costRetail != null && <p className="text-lg font-medium">${product.costRetail.toFixed(2)}</p>}

      {product.pattern && (
        <div className="flex items-center gap-1.5 text-sm">
          <span>Pattern:</span>
          <Link href={`/?pattern=${product.pattern.id}`} className={CHIP_LINK_CLASS}>
            {product.pattern.name}
          </Link>
        </div>
      )}
    </div>
  );
}
