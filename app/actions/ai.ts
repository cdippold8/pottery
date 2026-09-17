"use server";

import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAiConfigured, suggestProductDetails, ProductSuggestion } from "@/lib/ai";

export async function analyzeProductImages(formData: FormData): Promise<ProductSuggestion | null> {
  if (!(await isAdmin())) {
    throw new Error("Not authorized");
  }

  if (!isAiConfigured()) return null;

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return null;

  const images = await Promise.all(
    files.slice(0, 5).map(async (file) => ({
      base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
      mediaType: file.type || "image/jpeg",
    }))
  );

  const [patterns, colors] = await Promise.all([
    prisma.pattern.findMany({ select: { name: true } }),
    prisma.color.findMany({ select: { name: true } }),
  ]);

  return suggestProductDetails(images, {
    existingPatterns: patterns.map((p) => p.name),
    existingColors: colors.map((c) => c.name),
  });
}
