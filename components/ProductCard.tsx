import Link from "next/link";
import Image from "next/image";
import type { ProductWithRelations } from "@/lib/types";

export default function ProductCard({ product }: { product: ProductWithRelations }) {
  const thumbnail = product.images[0];

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col gap-2"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-neutral-50">
        {thumbnail ? (
          <Image
            src={thumbnail.url}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">No photo</div>
        )}
        {product.sold && (
          <span className="absolute left-2 top-2 rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
            Sold
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{product.name}</p>
          {product.pattern && <p className="text-xs text-muted">{product.pattern.name}</p>}
        </div>
        {product.costRetail != null && (
          <p className="whitespace-nowrap text-sm text-muted">${product.costRetail.toFixed(2)}</p>
        )}
      </div>
    </Link>
  );
}
