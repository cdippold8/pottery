import { Prisma } from "@prisma/client";

export const productWithRelations = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
    images: { orderBy: { order: "asc" } },
    pattern: true,
    colors: { include: { color: true } },
  },
});

export type ProductWithRelations = Prisma.ProductGetPayload<typeof productWithRelations>;
