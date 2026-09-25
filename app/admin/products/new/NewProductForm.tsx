"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/app/actions/products";
import { analyzeProductImages } from "@/app/actions/ai";
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from "@/lib/constants";
import PatternPicker, { PatternOption } from "@/components/PatternPicker";
import ColorPicker, { ColorOption } from "@/components/ColorPicker";

export default function NewProductForm({
  patterns,
  colors,
  aiEnabled,
}: {
  patterns: PatternOption[];
  colors: ColorOption[];
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("mug");
  const [suggestion, setSuggestion] = useState<{ pattern: string; colors: string; notes: string } | null>(
    null
  );
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files;
    if (picked && picked.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(picked)]);
    }
    setSuggestion(null);
    // Allow re-selecting the same file(s) later and keep the curated list in
    // React state rather than the input's own (unremovable) FileList.
    e.target.value = "";
  }

  function handleRemovePhoto(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setSuggestion(null);
  }

  function handleAnalyze() {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));

    setError(null);
    startAnalyzing(async () => {
      try {
        const result = await analyzeProductImages(formData);
        if (result) {
          setName(result.name);
          setCategory(result.category);
          setSuggestion({
            pattern: result.patternGuess,
            colors: result.colorGuesses.join(", "),
            notes: result.notes,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "AI analysis failed");
      }
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    files.forEach((f) => formData.append("images", f));
    startSubmitting(async () => {
      try {
        await createProduct(formData);
      } catch (err) {
        // createProduct redirects to the new PDP on success, which Next.js
        // implements by throwing a special error carrying this digest.
        // Let that propagate; only report genuine failures.
        const digest = (err as { digest?: string })?.digest;
        if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setError(err instanceof Error ? err.message : "Could not create product");
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
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
          Upload photos
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />
        </label>
        {previews.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(i)}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs leading-none text-white transition sm:opacity-0 sm:group-hover:opacity-100"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
        {aiEnabled && previews.length > 0 && (
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="mt-2 rounded-md border border-border px-3 py-1.5 text-sm hover:border-foreground"
          >
            {isAnalyzing ? "Analyzing..." : "Guess details with AI"}
          </button>
        )}
        {suggestion && (
          <div className="mt-2 rounded-md bg-neutral-50 p-3 text-xs text-muted">
            <p>AI suggests pattern: {suggestion.pattern}</p>
            <p>AI suggests colors: {suggestion.colors}</p>
            {suggestion.notes && <p>{suggestion.notes}</p>}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <PatternPicker patterns={patterns} />
      <ColorPicker colors={colors} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Wholesale cost</label>
          <input
            type="number"
            step="0.01"
            name="costWholesale"
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Retail cost</label>
          <input
            type="number"
            step="0.01"
            name="costRetail"
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
        >
          {isSubmitting ? "Uploading..." : "Upload complete"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-md border border-border px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
