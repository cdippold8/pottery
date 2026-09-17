"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { createPattern } from "@/app/actions/patterns";

export type PatternOption = {
  id: string;
  name: string;
  referenceImage: string | null;
  difficulty: number;
  enjoyment: number;
  preference: number;
};

export default function PatternPicker({
  patterns,
  initialSelectedId,
}: {
  patterns: PatternOption[];
  initialSelectedId?: string | null;
}) {
  const [options, setOptions] = useState(patterns);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showAddNew, setShowAddNew] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selected = options.find((p) => p.id === selectedId) ?? null;

  const filtered = useMemo(
    () => options.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const pattern = await createPattern(formData);
        const option: PatternOption = {
          id: pattern.id,
          name: pattern.name,
          referenceImage: pattern.referenceImage,
          difficulty: pattern.difficulty,
          enjoyment: pattern.enjoyment,
          preference: pattern.preference,
        };
        setOptions((prev) => [option, ...prev]);
        setSelectedId(option.id);
        setShowAddNew(false);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create pattern");
      }
    });
  }

  return (
    <div className="relative">
      <input type="hidden" name="patternId" value={selectedId ?? ""} />
      <label className="mb-1 block text-sm font-medium text-foreground">Pattern</label>

      <button
        type="button"
        data-testid="pattern-picker-trigger"
        onClick={() => setOpen((v) => !v)}
        className="relative z-30 flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm"
      >
        {selected?.referenceImage ? (
          <span className="relative h-8 w-8 overflow-hidden rounded">
            <Image src={selected.referenceImage} alt="" fill className="object-cover" />
          </span>
        ) : (
          <span className="h-8 w-8 rounded bg-neutral-100" />
        )}
        <span className={selected ? "text-foreground" : "text-muted"}>
          {selected ? selected.name : "Select a pattern"}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
          <div className="p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patterns..."
              className="w-full rounded border border-border px-2 py-1.5 text-sm"
              autoFocus
            />
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(p.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                >
                  {p.referenceImage ? (
                    <span className="relative h-8 w-8 overflow-hidden rounded">
                      <Image src={p.referenceImage} alt="" fill className="object-cover" />
                    </span>
                  ) : (
                    <span className="h-8 w-8 rounded bg-neutral-100" />
                  )}
                  {p.name}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted">No matching patterns</li>
            )}
          </ul>
          <div className="border-t border-border p-2">
            {!showAddNew ? (
              <button
                type="button"
                onClick={() => setShowAddNew(true)}
                className="text-sm font-medium text-foreground hover:underline"
              >
                + Add new pattern
              </button>
            ) : (
              <form action={handleCreate} className="flex flex-col gap-2">
                <input
                  name="name"
                  placeholder="Pattern name"
                  required
                  className="rounded border border-border px-2 py-1.5 text-sm"
                />
                <div className="grid grid-cols-3 gap-2">
                  <ScoreSelect name="difficulty" label="Difficulty" />
                  <ScoreSelect name="enjoyment" label="Enjoyment" />
                  <ScoreSelect name="preference" label="Preference" />
                </div>
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="favorite" /> Favorite
                </label>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded bg-foreground px-3 py-1.5 text-sm text-background"
                  >
                    {isPending ? "Creating..." : "Create & select"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddNew(false)}
                    className="rounded border border-border px-3 py-1.5 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
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

function ScoreSelect({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <select name={name} defaultValue={3} className="rounded border border-border px-1 py-1 text-sm text-foreground">
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}
