export const PRODUCT_CATEGORIES = ["mug", "planter", "bowl", "handmade", "other"] as const;
export type ProductCategoryValue = (typeof PRODUCT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ProductCategoryValue, string> = {
  mug: "Mugs",
  planter: "Planters",
  bowl: "Bowls",
  handmade: "Handmade",
  other: "Other",
};

export const HOMEPAGE_PREVIEW_COUNT = 6;
