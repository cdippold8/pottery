import { Prisma } from "@prisma/client";

export const productWithRelations = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
    images: { orderBy: { order: "asc" } },
    pattern: true,
    colors: { include: { color: true } },
  },
});

export type ProductWithRelations = Prisma.ProductGetPayload<typeof productWithRelations>;

export const requestWithRelations = Prisma.validator<Prisma.RequestDefaultArgs>()({
  include: {
    items: {
      include: {
        product: {
          include: {
            images: { orderBy: { order: "asc" }, take: 1 },
            pattern: true,
            colors: { include: { color: true } },
          },
        },
      },
    },
  },
});

export type RequestWithRelations = Prisma.RequestGetPayload<typeof requestWithRelations>;
