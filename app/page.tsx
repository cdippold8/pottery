import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { CATEGORY_LABELS, HOMEPAGE_PREVIEW_COUNT, PRODUCT_CATEGORIES } from "@/lib/constants";
import { buildProductOrderBy, buildProductWhere, sortByPatternValue, ProductSearchParams } from "@/lib/filters";
import { productWithRelations } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<ProductSearchParams>;
}) {
  const params = await searchParams;
  const admin = await isAdmin();

  // Select only public-safe fields: these lists feed a client-side filter
  // bar, and any field handed to a Client Component gets serialized to the
  // browser whether or not the UI ends up rendering it — so internal
  // pattern/color metadata must never be included here.
  const [patterns, colors] = await Promise.all([
    prisma.pattern.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.color.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const hasFilters = Boolean(
    params.pattern ||
      params.color ||
      params.category ||
      params.difficulty ||
      params.enjoyment ||
      params.preference ||
      params.favorite === "1" ||
      params.notSold === "1"
  );

  const where = buildProductWhere(params, admin);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <FilterBar patterns={patterns} colors={colors} isAdmin={admin} showCategoryFilter />
      </div>

      {hasFilters ? (
        <FilteredResults where={where} sort={params.sort} isAdmin={admin} />
      ) : (
        <div className="flex flex-col gap-12">
          {PRODUCT_CATEGORIES.map((category) => (
            <CategorySection key={category} category={category} isAdmin={admin} />
          ))}
        </div>
      )}
    </div>
  );
}

async function CategorySection({
  category,
  isAdmin,
}: {
  category: (typeof PRODUCT_CATEGORIES)[number];
  isAdmin: boolean;
}) {
  const products = await prisma.product.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
    take: HOMEPAGE_PREVIEW_COUNT,
    ...productWithRelations,
  });

  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-medium">{CATEGORY_LABELS[category]}</h2>
        <Link href={`/category/${category}`} className="text-sm text-muted hover:text-foreground">
          See all &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} isAdmin={isAdmin} />
        ))}
      </div>
    </section>
  );
}

async function FilteredResults({
  where,
  sort,
  isAdmin,
}: {
  where: Awaited<ReturnType<typeof buildProductWhere>>;
  sort?: string;
  isAdmin: boolean;
}) {
  let products = await prisma.product.findMany({
    where,
    orderBy: buildProductOrderBy(sort),
    ...productWithRelations,
  });

  if (sort === "value") products = sortByPatternValue(products);

  if (products.length === 0) {
    return <p className="text-sm text-muted">No products match these filters.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} isAdmin={isAdmin} />
      ))}
    </div>
  );
}
