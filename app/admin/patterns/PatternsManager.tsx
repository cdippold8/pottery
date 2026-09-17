"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { createPattern, deletePattern } from "@/app/actions/patterns";
import { patternValue } from "@/lib/value";

type Pattern = {
  id: string;
  name: string;
  difficulty: number;
  enjoyment: number;
  preference: number;
  favorite: boolean;
  referenceImage: string | null;
  _count: { products: number };
};

export default function PatternsManager({ initialPatterns }: { initialPatterns: Pattern[] }) {
  const [patterns, setPatterns] = useState(initialPatterns);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const pattern = await createPattern(formData);
        setPatterns((prev) =>
          [...prev, { ...pattern, _count: { products: 0 } }].sort((a, b) => a.name.localeCompare(b.name))
        );
        (document.getElementById("new-pattern-form") as HTMLFormElement | null)?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create pattern");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this pattern? Products using it will keep their other details.")) return;
    startTransition(async () => {
      await deletePattern(id);
      setPatterns((prev) => prev.filter((p) => p.id !== id));
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form id="new-pattern-form" action={handleCreate} className="flex flex-col gap-3 rounded-md border border-border p-4">
        <h2 className="text-sm font-medium">Add new pattern</h2>
        <input name="name" placeholder="Pattern name" required className="rounded border border-border px-2 py-1.5 text-sm" />
        <div className="grid grid-cols-3 gap-2">
          <ScoreField name="difficulty" label="Difficulty (1-5)" />
          <ScoreField name="enjoyment" label="Enjoyment (1-5)" />
          <ScoreField name="preference" label="Preference (1-5)" />
        </div>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" name="favorite" /> Favorite
        </label>
        <div>
          <label className="mb-1 block text-sm text-muted">Reference image</label>
          <input type="file" name="referenceImageFile" accept="image/*" className="text-sm" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-fit rounded-md bg-foreground px-4 py-2 text-sm text-background"
        >
          {isPending ? "Adding..." : "Add pattern"}
        </button>
      </form>

      <div className="flex flex-col divide-y divide-border">
        {patterns.map((p) => (
          <div key={p.id} className="flex items-center gap-3 py-3">
            {p.referenceImage ? (
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                <Image src={p.referenceImage} alt="" fill className="object-cover" />
              </span>
            ) : (
              <span className="h-12 w-12 shrink-0 rounded bg-neutral-100" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {p.name} {p.favorite && <span className="text-amber-500">&#9733;</span>}
              </p>
              <p className="text-xs text-muted">
                Difficulty {p.difficulty} · Enjoyment {p.enjoyment} · Preference {p.preference} · Value{" "}
                {patternValue(p.difficulty, p.enjoyment, p.preference)} · {p._count.products} product
                {p._count.products === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(p.id)}
              disabled={isPending}
              className="text-xs text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
        {patterns.length === 0 && <p className="py-3 text-sm text-muted">No patterns yet.</p>}
      </div>
    </div>
  );
}

function ScoreField({ name, label }: { name: string; label: string }) {
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
