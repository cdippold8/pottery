"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProductsBulk } from "@/app/actions/products";
import { analyzeProductImages } from "@/app/actions/ai";
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from "@/lib/constants";
import PatternPicker, { PatternOption } from "@/components/PatternPicker";
import ColorPicker, { ColorOption } from "@/components/ColorPicker";

type Suggestion = {
  patternGuess: string;
  patternMatched: boolean;
  colorGuesses: string;
  colorsMatched: boolean;
  notes: string;
};

type BulkItem = {
  key: string;
  file: File;
  previewUrl: string;
  name: string;
  category: string;
  patternId: string | null;
  colorIds: string[];
  analyzing: boolean;
  suggestion: Suggestion | null;
  error: string | null;
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

// Submitting the whole batch as one request doesn't scale: on Vercel, a
// request that uploads many full-resolution photos at once can run past
// either the body size limit or the function's execution time, and the
// platform kills it outright -- the client gets back something that isn't a
// valid Server Action response ("An unexpected response was received from
// the server") instead of a usable error. Splitting the batch into small
// chunks keeps every individual request comfortably inside both limits
// regardless of how many photos are in the batch overall.
const BULK_CHUNK_SIZE = 4;

export default function BulkUploadForm({
  patterns,
  colors,
  aiEnabled,
}: {
  patterns: PatternOption[];
  colors: ColorOption[];
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const nextKey = useRef(0);
  const itemsRef = useRef<BulkItem[]>([]);
  const [items, setItems] = useState<BulkItem[]>([]);
  const [created, setCreated] = useState<{ key: string; id: string; name: string }[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitProgress, setSubmitProgress] = useState<{ done: number; total: number } | null>(null);
  const [isSubmitting, startSubmitting] = useTransition();

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Revoke any remaining preview object URLs when the page is left.
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  function updateItem(key: string, patch: Partial<BulkItem>) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function runAnalysis(key: string, file: File) {
    const formData = new FormData();
    formData.append("images", file);
    (async () => {
      try {
        const result = await analyzeProductImages(formData);
        if (!result) {
          updateItem(key, { analyzing: false });
          return;
        }

        // The AI is prompted to reuse an existing pattern/color name verbatim
        // when one clearly matches, so a case-insensitive exact match against
        // the catalog is enough to auto-select it in the pickers — anything
        // that doesn't match is a new suggestion the admin still has to
        // create (via the picker's own "+ Add new" control) or correct.
        const matchedPattern = result.patternGuess
          ? patterns.find((p) => normalize(p.name) === normalize(result.patternGuess))
          : undefined;
        const matchedColors = result.colorGuesses
          .map((guess) => colors.find((c) => normalize(c.name) === normalize(guess)))
          .filter((c): c is ColorOption => Boolean(c));

        const titlePattern = matchedPattern?.name || result.patternGuess;
        const titleColors = (matchedColors.length > 0 ? matchedColors.map((c) => c.name) : result.colorGuesses).slice(
          0,
          2
        );
        const name = titlePattern
          ? titleColors.length > 0
            ? `${titlePattern}: ${titleColors.join(" & ")}`
            : titlePattern
          : result.name;

        updateItem(key, {
          analyzing: false,
          name,
          category: result.category,
          patternId: matchedPattern?.id ?? null,
          colorIds: matchedColors.map((c) => c.id),
          suggestion: {
            patternGuess: result.patternGuess,
            patternMatched: Boolean(matchedPattern),
            colorGuesses: result.colorGuesses.join(", "),
            colorsMatched: matchedColors.length > 0 && matchedColors.length === result.colorGuesses.length,
            notes: result.notes,
          },
        });
      } catch {
        updateItem(key, { analyzing: false });
      }
    })();
  }

  function handleFilesAdded(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files;
    if (!picked || picked.length === 0) return;

    const newItems: BulkItem[] = Array.from(picked).map((file) => ({
      key: String(nextKey.current++),
      file,
      previewUrl: URL.createObjectURL(file),
      name: "",
      category: "mug",
      patternId: null,
      colorIds: [],
      analyzing: aiEnabled,
      suggestion: null,
      error: null,
    }));
    setItems((prev) => [...prev, ...newItems]);
    e.target.value = "";

    if (aiEnabled) {
      newItems.forEach((item) => runAnalysis(item.key, item.file));
    }
  }

  function handleRemove(key: string) {
    setItems((prev) => {
      const target = prev.find((item) => item.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.key !== key);
    });
  }

  function handleSubmit(formData: FormData) {
    if (items.length === 0) return;
    setSubmitError(null);

    // formData here already has every field from every card (React collects
    // it from the whole <form>) -- split it into one smaller FormData per
    // chunk of items and submit those one at a time, rather than sending
    // everything in a single request.
    const snapshot = items;
    const chunks: BulkItem[][] = [];
    for (let i = 0; i < snapshot.length; i += BULK_CHUNK_SIZE) {
      chunks.push(snapshot.slice(i, i + BULK_CHUNK_SIZE));
    }

    setSubmitProgress({ done: 0, total: snapshot.length });

    startSubmitting(async () => {
      let completedCount = 0;

      for (const chunk of chunks) {
        const chunkFormData = new FormData();
        const chunkKeys = chunk.map((item) => item.key);
        chunkFormData.set("itemKeys", chunkKeys.join(","));
        chunk.forEach((item) => {
          chunkFormData.set(`name_${item.key}`, formData.get(`name_${item.key}`) ?? "");
          chunkFormData.set(`category_${item.key}`, formData.get(`category_${item.key}`) ?? "");
          const patternId = formData.get(`patternId_${item.key}`);
          if (patternId) chunkFormData.set(`patternId_${item.key}`, patternId);
          formData.getAll(`colorIds_${item.key}`).forEach((v) => chunkFormData.append(`colorIds_${item.key}`, v));
          const wholesale = formData.get(`costWholesale_${item.key}`);
          if (wholesale) chunkFormData.set(`costWholesale_${item.key}`, wholesale);
          const retail = formData.get(`costRetail_${item.key}`);
          if (retail) chunkFormData.set(`costRetail_${item.key}`, retail);
          chunkFormData.append(`image_${item.key}`, item.file);
        });

        try {
          const result = await createProductsBulk(chunkFormData);

          if (result.created.length > 0) {
            setCreated((prev) => [...result.created, ...prev]);
          }

          const failedByKey = new Map(result.failed.map((f) => [f.key, f.error]));
          setItems((prev) => {
            const createdKeys = new Set(result.created.map((c) => c.key));
            prev.filter((item) => createdKeys.has(item.key)).forEach((item) => URL.revokeObjectURL(item.previewUrl));
            return prev
              .filter((item) => !createdKeys.has(item.key))
              .map((item) => (chunkKeys.includes(item.key) ? { ...item, error: failedByKey.get(item.key) ?? null } : item));
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Could not create products";
          setSubmitError(
            completedCount > 0
              ? `${message} — anything already created above is safe; the rest is still here, try again`
              : message
          );
          setSubmitProgress(null);
          return;
        }

        completedCount += chunk.length;
        setSubmitProgress({ done: completedCount, total: snapshot.length });
      }

      setSubmitProgress(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Photos</label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-8 text-sm text-muted hover:border-foreground hover:text-foreground">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 16V4M10 4L5 9M10 4l5 5M4 17h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Upload photos — each one becomes its own product
            <input type="file" accept="image/*" multiple onChange={handleFilesAdded} className="hidden" />
          </label>
        </div>

        {items.length > 0 && (
          <div className="flex flex-col gap-4">
            {items.map((item, i) => (
              <div key={item.key} className="rounded-lg border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                    {item.analyzing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-center text-[10px] leading-tight text-white">
                        Guessing...
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs text-muted">Product {i + 1}</p>
                    <input
                      name={`name_${item.key}`}
                      value={item.name}
                      onChange={(e) => updateItem(item.key, { name: e.target.value })}
                      placeholder="Product name"
                      className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.key)}
                    className="shrink-0 text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>

                {item.suggestion && (
                  <p className="mt-2 rounded bg-neutral-50 p-2 text-xs text-muted">
                    AI: pattern &ldquo;{item.suggestion.patternGuess}&rdquo;
                    {item.suggestion.patternMatched ? " (matched)" : " (new — create or pick manually)"}, colors{" "}
                    {item.suggestion.colorGuesses}
                    {item.suggestion.colorsMatched ? " (matched)" : " (new — create or pick manually)"}
                    {item.suggestion.notes ? ` — ${item.suggestion.notes}` : ""}
                  </p>
                )}

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Category</label>
                    <select
                      name={`category_${item.key}`}
                      value={item.category}
                      onChange={(e) => updateItem(item.key, { category: e.target.value })}
                      className="w-full rounded-md border border-border px-2 py-2 text-sm"
                    >
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Wholesale</label>
                      <input
                        type="number"
                        step="0.01"
                        name={`costWholesale_${item.key}`}
                        className="w-full rounded-md border border-border px-2 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Retail</label>
                      <input
                        type="number"
                        step="0.01"
                        name={`costRetail_${item.key}`}
                        className="w-full rounded-md border border-border px-2 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Keyed on whether AI analysis has resolved so the picker
                      remounts (and re-reads its initial selection) once a
                      match comes in — these pickers otherwise only read
                      initialSelectedId/Ids once, at mount. Disabled while
                      analyzing so a selection made in that window (including
                      creating a brand new pattern/color) can't get silently
                      discarded by that remount when the AI result lands. */}
                  <PatternPicker
                    key={`pattern-${item.analyzing}`}
                    patterns={patterns}
                    initialSelectedId={item.patternId}
                    name={`patternId_${item.key}`}
                    disabled={item.analyzing}
                  />
                  <ColorPicker
                    key={`colors-${item.analyzing}`}
                    colors={colors}
                    initialSelectedIds={item.colorIds}
                    name={`colorIds_${item.key}`}
                    disabled={item.analyzing}
                  />
                </div>

                {item.error && <p className="mt-2 text-xs text-red-600">Could not create: {item.error}</p>}
              </div>
            ))}
          </div>
        )}

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        {items.length > 0 && (
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
            >
              {isSubmitting
                ? submitProgress
                  ? `Creating... (${submitProgress.done}/${submitProgress.total})`
                  : "Creating..."
                : `Create ${items.length} product${items.length === 1 ? "" : "s"}`}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-md border border-border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </form>

      {created.length > 0 && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4">
          <p className="mb-2 text-sm font-medium text-green-900">
            Created {created.length} product{created.length === 1 ? "" : "s"}
          </p>
          <ul className="flex flex-col gap-1">
            {created.map((p) => (
              <li key={p.id}>
                <Link href={`/product/${p.id}`} className="text-sm text-green-900 underline hover:no-underline">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
