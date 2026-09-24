"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from "@/lib/constants";

type Option = { id: string; name: string };
type ChipOption = { value: string; label: string };

const SCORE_OPTIONS: ChipOption[] = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }));

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

  const categoryOptions: ChipOption[] = PRODUCT_CATEGORIES.map((c) => ({
    value: c,
    label: CATEGORY_LABELS[c],
  }));
  const patternOptions: ChipOption[] = patterns.map((p) => ({ value: p.id, label: p.name }));
  const colorOptions: ChipOption[] = colors.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {showSort && (
        <FilterChip
          label="Sort"
          value={searchParams.get("sort") ?? "newest"}
          options={[
            { value: "newest", label: "Newest to oldest" },
            { value: "oldest", label: "Oldest to newest" },
            ...(isAdmin ? [{ value: "value", label: "Value" }] : []),
          ]}
          onChange={(v) => set("sort", v)}
          alwaysShowLabel
        />
      )}

      {showCategoryFilter && (
        <FilterChip
          label="Category"
          value={searchParams.get("category") ?? ""}
          options={categoryOptions}
          onChange={(v) => set("category", v)}
        />
      )}

      <FilterChip
        label="Pattern"
        value={searchParams.get("pattern") ?? ""}
        options={patternOptions}
        onChange={(v) => set("pattern", v)}
        searchable
      />

      <FilterChip
        label="Color"
        value={searchParams.get("color") ?? ""}
        options={colorOptions}
        onChange={(v) => set("color", v)}
        searchable
      />

      {isAdmin && (
        <>
          <FilterChip
            label="Difficulty"
            value={searchParams.get("difficulty") ?? ""}
            options={SCORE_OPTIONS}
            onChange={(v) => set("difficulty", v)}
          />
          <FilterChip
            label="Enjoyment"
            value={searchParams.get("enjoyment") ?? ""}
            options={SCORE_OPTIONS}
            onChange={(v) => set("enjoyment", v)}
          />
          <FilterChip
            label="Ease"
            value={searchParams.get("preference") ?? ""}
            options={SCORE_OPTIONS}
            onChange={(v) => set("preference", v)}
          />
          <ToggleChip
            label="Favorites"
            active={searchParams.get("favorite") === "1"}
            onClick={() => toggle("favorite")}
          />
        </>
      )}

      <ToggleChip
        label="Not sold"
        active={searchParams.get("notSold") === "1"}
        onClick={() => toggle("notSold")}
      />
    </div>
  );
}

function FilterChip({
  label,
  value,
  options,
  onChange,
  searchable,
  alwaysShowLabel,
}: {
  label: string;
  value: string;
  options: ChipOption[];
  onChange: (value: string) => void;
  searchable?: boolean;
  alwaysShowLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value) ?? null;
  const filtered = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative z-30 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
          selected
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background text-foreground hover:border-foreground"
        }`}
      >
        {selected && !alwaysShowLabel ? `${label}: ${selected.label}` : selected ? selected.label : label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={selected ? "opacity-80" : "opacity-50"}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-48 rounded-md border border-border bg-background shadow-lg">
          {searchable && (
            <div className="p-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full rounded border border-border px-2 py-1.5 text-sm"
                autoFocus
              />
            </div>
          )}
          <ul className="max-h-56 overflow-y-auto py-1">
            {!alwaysShowLabel && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-50 ${
                    !value ? "font-medium text-foreground" : "text-muted"
                  }`}
                >
                  All {label.toLowerCase()}
                </button>
              </li>
            )}
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-50 ${
                    value === o.value ? "font-medium text-foreground" : "text-foreground"
                  }`}
                >
                  {o.label}
                </button>
              </li>
            ))}
            {searchable && filtered.length === 0 && (
              <li className="px-3 py-1.5 text-sm text-muted">No matches</li>
            )}
          </ul>
        </div>
      )}

      {open && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-10 cursor-default"
        />
      )}
    </div>
  );
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-foreground hover:border-foreground"
      }`}
    >
      {label}
    </button>
  );
}
