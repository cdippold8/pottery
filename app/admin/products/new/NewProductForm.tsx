"use client";

import { useRef, useState, useTransition } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("mug");
  const [suggestion, setSuggestion] = useState<{ pattern: string; colors: string; notes: string } | null>(
    null
  );
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFilesChange() {
    const files = fileInputRef.current?.files;
    setPreviews(files ? Array.from(files).map((f) => URL.createObjectURL(f)) : []);
    setSuggestion(null);
  }

  function handleAnalyze() {
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("images", f));

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
            ref={fileInputRef}
            type="file"
            name="images"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />
        </label>
        {previews.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="aspect-square rounded object-cover" />
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
