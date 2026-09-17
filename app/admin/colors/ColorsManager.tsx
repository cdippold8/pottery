"use client";

import { useState, useTransition } from "react";
import { createColor, deleteColor } from "@/app/actions/colors";

type Color = {
  id: string;
  name: string;
  brand: string | null;
  glazeType: "glaze" | "underglaze";
  bestForInterior: boolean;
  bestForExterior: boolean;
  notes: string | null;
  _count: { products: number };
};

export default function ColorsManager({ initialColors }: { initialColors: Color[] }) {
  const [colors, setColors] = useState(initialColors);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const color = await createColor(formData);
        setColors((prev) =>
          [...prev, { ...color, _count: { products: 0 } }].sort((a, b) => a.name.localeCompare(b.name))
        );
        (document.getElementById("new-color-form") as HTMLFormElement | null)?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create color");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this color? Products using it will keep their other details.")) return;
    startTransition(async () => {
      await deleteColor(id);
      setColors((prev) => prev.filter((c) => c.id !== id));
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form id="new-color-form" action={handleCreate} className="flex flex-col gap-3 rounded-md border border-border p-4">
        <h2 className="text-sm font-medium">Add new color</h2>
        <input name="name" placeholder="Color name" required className="rounded border border-border px-2 py-1.5 text-sm" />
        <input name="brand" placeholder="Brand" className="rounded border border-border px-2 py-1.5 text-sm" />
        <select name="glazeType" defaultValue="glaze" className="rounded border border-border px-2 py-1.5 text-sm">
          <option value="glaze">Glaze</option>
          <option value="underglaze">Underglaze</option>
        </select>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" name="bestForInterior" defaultChecked /> Best for interior
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" name="bestForExterior" /> Best for exterior
          </label>
        </div>
        <textarea name="notes" placeholder="Notes" rows={2} className="rounded border border-border px-2 py-1.5 text-sm" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-fit rounded-md bg-foreground px-4 py-2 text-sm text-background"
        >
          {isPending ? "Adding..." : "Add color"}
        </button>
      </form>

      <div className="flex flex-col divide-y divide-border">
        {colors.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {c.name} {c.brand && <span className="font-normal text-muted">— {c.brand}</span>}
              </p>
              <p className="text-xs text-muted">
                {c.glazeType === "glaze" ? "Glaze" : "Underglaze"} ·{" "}
                {[c.bestForInterior && "Interior", c.bestForExterior && "Exterior"].filter(Boolean).join(", ") ||
                  "No surface noted"}{" "}
                · {c._count.products} product{c._count.products === 1 ? "" : "s"}
              </p>
              {c.notes && <p className="text-xs text-muted">{c.notes}</p>}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(c.id)}
              disabled={isPending}
              className="text-xs text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
        {colors.length === 0 && <p className="py-3 text-sm text-muted">No colors yet.</p>}
      </div>
    </div>
  );
}
