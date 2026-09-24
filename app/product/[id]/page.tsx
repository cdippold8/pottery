import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { CATEGORY_LABELS } from "@/lib/constants";
import { productWithRelations } from "@/lib/types";
import ProductImages from "@/components/ProductImages";
import ProductDetailPanel from "@/components/ProductDetailPanel";
import ProductPublicView from "@/components/ProductPublicView";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await isAdmin();

  const product = await prisma.product.findUnique({ where: { id }, ...productWithRelations });
  if (!product) notFound();

  // Internal pattern/color fields (difficulty, enjoyment, preference,
  // favorite) and the edit form only ever go to an authenticated admin —
  // for anonymous visitors we skip fetching them entirely and render the
  // plain, public-safe view below.
  const [patterns, colors] = admin
    ? await Promise.all([
        prisma.pattern.findMany({ orderBy: { name: "asc" } }),
        prisma.color.findMany({ orderBy: { name: "asc" } }),
      ])
    : [[], []];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link href={`/category/${product.category}`} className="hover:text-foreground">
          {CATEGORY_LABELS[product.category]}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 sm:grid-cols-[3fr_2fr]">
        <ProductImages
          productId={product.id}
          images={product.images}
          isAdmin={admin}
          productName={product.name}
        />
        {admin ? (
          <ProductDetailPanel product={product} patterns={patterns} colors={colors} />
        ) : (
          <ProductPublicView product={product} />
        )}
      </div>
    </div>
  );
}
