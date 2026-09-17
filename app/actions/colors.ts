"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { GlazeType } from "@prisma/client";

async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Not authorized");
  }
}

function readColorFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Color name is required");

  const brand = String(formData.get("brand") ?? "").trim() || null;
  const glazeTypeRaw = String(formData.get("glazeType") ?? "glaze");
  const glazeType: GlazeType = glazeTypeRaw === "underglaze" ? "underglaze" : "glaze";
  const bestForInterior = formData.get("bestForInterior") === "on";
  const bestForExterior = formData.get("bestForExterior") === "on";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  return { name, brand, glazeType, bestForInterior, bestForExterior, notes };
}

export async function createColor(formData: FormData) {
  await requireAdmin();
  const data = readColorFields(formData);
  const color = await prisma.color.create({ data });
  revalidatePath("/admin/colors");
  return color;
}

export async function updateColor(colorId: string, formData: FormData) {
  await requireAdmin();
  const data = readColorFields(formData);
  await prisma.color.update({ where: { id: colorId }, data });
  revalidatePath("/admin/colors");
  revalidatePath("/");
}

export async function deleteColor(colorId: string) {
  await requireAdmin();
  await prisma.color.delete({ where: { id: colorId } });
  revalidatePath("/admin/colors");
  revalidatePath("/");
}
