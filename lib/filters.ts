import { Prisma } from "@prisma/client";
import { ProductCategoryValue } from "@/lib/constants";

export type ProductSearchParams = {
  pattern?: string;
  color?: string;
  category?: string;
  difficulty?: string;
  enjoyment?: string;
  preference?: string;
  favorite?: string;
  notSold?: string;
  sort?: string;
};

export function buildProductWhere(
  params: ProductSearchParams,
  isAdmin: boolean,
  extra?: { category?: ProductCategoryValue }
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (extra?.category) {
    where.category = extra.category;
  } else if (params.category) {
    where.category = params.category as ProductCategoryValue;
  }

  if (params.pattern) {
    where.patternId = params.pattern;
  }

  if (params.color) {
    where.colors = { some: { colorId: params.color } };
  }

  if (params.notSold === "1") {
    where.sold = false;
  }

  if (isAdmin) {
    const patternFilter: Prisma.PatternWhereInput = {};
    if (params.difficulty) patternFilter.difficulty = Number(params.difficulty);
    if (params.enjoyment) patternFilter.enjoyment = Number(params.enjoyment);
    if (params.preference) patternFilter.preference = Number(params.preference);
    if (params.favorite === "1") patternFilter.favorite = true;
    if (Object.keys(patternFilter).length > 0) {
      where.pattern = patternFilter;
    }
  }

  return where;
}

export function buildProductOrderBy(
  sort: string | undefined
): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "oldest") return [{ createdAt: "asc" }];
  // "value" sort (enjoyment + preference - difficulty) isn't a stored column,
  // so it's applied in-memory after fetching (see sortByPatternValue below).
  return [{ createdAt: "desc" }];
}

export function sortByPatternValue<
  T extends { pattern: { difficulty: number; enjoyment: number; preference: number } | null }
>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const valueOf = (p: T) =>
      p.pattern ? p.pattern.enjoyment + p.pattern.preference - p.pattern.difficulty : -Infinity;
    return valueOf(b) - valueOf(a);
  });
}
