import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { CATEGORY_LABELS, PRODUCT_CATEGORIES, ProductCategoryValue } from "@/lib/constants";
import { buildProductOrderBy, buildProductWhere, sortByPatternValue, ProductSearchParams } from "@/lib/filters";
import { productWithRelations } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";

export function generateStaticParams() {
  return PRODUCT_CATEGORIES.map((slug) => ({ slug }));
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ProductSearchParams>;
}) {
  const { slug } = await params;
  if (!(PRODUCT_CATEGORIES as readonly string[]).includes(slug)) notFound();
  const category = slug as ProductCategoryValue;

  const searchParamsValue = await searchParams;
  const admin = await isAdmin();

  // See the equivalent note in app/page.tsx: only public-safe fields belong
  // in props handed to the (client) FilterBar.
  const [patterns, colors] = await Promise.all([
    prisma.pattern.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.color.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const where = buildProductWhere(searchParamsValue, admin, { category });

  let products = await prisma.product.findMany({
    where,
    orderBy: buildProductOrderBy(searchParamsValue.sort),
    ...productWithRelations,
  });

  if (searchParamsValue.sort === "value") products = sortByPatternValue(products);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{CATEGORY_LABELS[category]}</h1>
        <FilterBar patterns={patterns} colors={colors} isAdmin={admin} showSort />
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-muted">No products match these filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
