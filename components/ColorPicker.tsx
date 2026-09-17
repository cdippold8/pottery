"use client";

import { useMemo, useState, useTransition } from "react";
import { createColor } from "@/app/actions/colors";

export type ColorOption = { id: string; name: string; brand: string | null };

export default function ColorPicker({
  colors,
  initialSelectedIds,
}: {
  colors: ColorOption[];
  initialSelectedIds?: string[];
}) {
  const [options, setOptions] = useState(colors);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds ?? []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showAddNew, setShowAddNew] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selected = options.filter((c) => selectedIds.includes(c.id));

  const filtered = useMemo(
    () => options.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const color = await createColor(formData);
        const option: ColorOption = { id: color.id, name: color.name, brand: color.brand };
        setOptions((prev) => [option, ...prev]);
        setSelectedIds((prev) => [...prev, option.id]);
        setShowAddNew(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create color");
      }
    });
  }

  return (
    <div className="relative">
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="colorIds" value={id} />
      ))}
      <label className="mb-1 block text-sm font-medium text-foreground">Colors</label>

      <button
        type="button"
        data-testid="color-picker-trigger"
        onClick={() => setOpen((v) => !v)}
        className="relative z-30 flex w-full flex-wrap items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-left text-sm"
      >
        {selected.length === 0 && <span className="text-muted">Select colors</span>}
        {selected.map((c) => (
          <span key={c.id} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-foreground">
            {c.name}
          </span>
        ))}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
          <div className="p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search colors..."
              className="w-full rounded border border-border px-2 py-1.5 text-sm"
              autoFocus
            />
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {filtered.map((c) => (
              <li key={c.id}>
                <label className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => toggle(c.id)}
                  />
                  {c.name}
                  {c.brand && <span className="text-xs text-muted">({c.brand})</span>}
                </label>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted">No matching colors</li>
            )}
          </ul>
          <div className="border-t border-border p-2">
            {!showAddNew ? (
              <button
                type="button"
                onClick={() => setShowAddNew(true)}
                className="text-sm font-medium text-foreground hover:underline"
              >
                + Add new color
              </button>
            ) : (
              <form action={handleCreate} className="flex flex-col gap-2">
                <input
                  name="name"
                  placeholder="Color name"
                  required
                  className="rounded border border-border px-2 py-1.5 text-sm"
                />
                <input
                  name="brand"
                  placeholder="Brand"
                  className="rounded border border-border px-2 py-1.5 text-sm"
                />
                <select name="glazeType" defaultValue="glaze" className="rounded border border-border px-2 py-1.5 text-sm">
                  <option value="glaze">Glaze</option>
                  <option value="underglaze">Underglaze</option>
                </select>
                <div className="flex gap-3 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" name="bestForInterior" defaultChecked /> Interior
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" name="bestForExterior" /> Exterior
                  </label>
                </div>
                <textarea
                  name="notes"
                  placeholder="Notes"
                  className="rounded border border-border px-2 py-1.5 text-sm"
                  rows={2}
                />
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
