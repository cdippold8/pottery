"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from "@/lib/constants";

type Option = { id: string; name: string };

export default function FilterBar({
  patterns,
  colors,
  isAdmin,
  showCategoryFilter,
  showSort,
}: {
  patterns: Option[];
  colors: Option[];
  isAdmin: boolean;
  showCategoryFilter?: boolean;
  showSort?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function set(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggle(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === "1") {
      params.delete(key);
    } else {
      params.set(key, "1");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const selectClass =
    "rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground";

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      {showSort && (
        <select
          className={selectClass}
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) => set("sort", e.target.value)}
        >
          <option value="newest">Newest to oldest</option>
          <option value="oldest">Oldest to newest</option>
          {isAdmin && <option value="value">Value</option>}
        </select>
      )}

      {showCategoryFilter && (
        <select
          className={selectClass}
          value={searchParams.get("category") ?? ""}
          onChange={(e) => set("category", e.target.value)}
        >
          <option value="">All categories</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      )}

      <select
        className={selectClass}
        value={searchParams.get("pattern") ?? ""}
        onChange={(e) => set("pattern", e.target.value)}
      >
        <option value="">All patterns</option>
        {patterns.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={searchParams.get("color") ?? ""}
        onChange={(e) => set("color", e.target.value)}
      >
        <option value="">All colors</option>
        {colors.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {isAdmin && (
        <>
          <select
            className={selectClass}
            value={searchParams.get("difficulty") ?? ""}
            onChange={(e) => set("difficulty", e.target.value)}
          >
            <option value="">Any difficulty</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Difficulty {n}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={searchParams.get("enjoyment") ?? ""}
            onChange={(e) => set("enjoyment", e.target.value)}
          >
            <option value="">Any enjoyment</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Enjoyment {n}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={searchParams.get("preference") ?? ""}
            onChange={(e) => set("preference", e.target.value)}
          >
            <option value="">Any ease</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Ease {n}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={searchParams.get("favorite") === "1"}
              onChange={() => toggle("favorite")}
            />
            Favorites
          </label>
        </>
      )}

      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={searchParams.get("notSold") === "1"}
          onChange={() => toggle("notSold")}
        />
        Not sold
      </label>
    </div>
  );
}
