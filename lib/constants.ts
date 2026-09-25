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

// Rounded chip used for pattern/color references that link to the filtered
// catalog -- no underline, fills solid on hover instead.
export const CHIP_LINK_CLASS =
  "rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-foreground hover:bg-foreground hover:text-background";
