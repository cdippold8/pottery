"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";

async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Not authorized");
  }
}

function readScore(formData: FormData, key: string): number {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value) || value < 1 || value > 5) {
    throw new Error(`${key} must be a number between 1 and 5`);
  }
  return value;
}

export async function createPattern(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Pattern name is required");

  const difficulty = readScore(formData, "difficulty");
  const enjoyment = readScore(formData, "enjoyment");
  const preference = readScore(formData, "preference");
  const favorite = formData.get("favorite") === "on";

  const referenceImageFile = formData.get("referenceImageFile");
  let referenceImage: string | null = String(formData.get("referenceImage") ?? "") || null;
  if (referenceImageFile instanceof File && referenceImageFile.size > 0) {
    referenceImage = await saveUploadedImage(referenceImageFile);
  }

  const pattern = await prisma.pattern.create({
    data: { name, difficulty, enjoyment, preference, favorite, referenceImage },
  });

  revalidatePath("/admin/patterns");
  return pattern;
}

export async function updatePattern(patternId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Pattern name is required");

  const difficulty = readScore(formData, "difficulty");
  const enjoyment = readScore(formData, "enjoyment");
  const preference = readScore(formData, "preference");
  const favorite = formData.get("favorite") === "on";

  await prisma.pattern.update({
    where: { id: patternId },
    data: { name, difficulty, enjoyment, preference, favorite },
  });

  revalidatePath("/admin/patterns");
  revalidatePath("/");
}

export async function deletePattern(patternId: string) {
  await requireAdmin();
  await prisma.pattern.delete({ where: { id: patternId } });
  revalidatePath("/admin/patterns");
  revalidatePath("/");
}
