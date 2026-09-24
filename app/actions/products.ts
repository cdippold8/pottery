"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { saveUploadedImage, deleteUploadedImage } from "@/lib/uploads";
import { PRODUCT_CATEGORIES, ProductCategoryValue } from "@/lib/constants";

async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Not authorized");
  }
}

function readCategory(formData: FormData): ProductCategoryValue {
  const raw = String(formData.get("category") ?? "");
  if (!(PRODUCT_CATEGORIES as readonly string[]).includes(raw)) {
    throw new Error("Invalid product category");
  }
  return raw as ProductCategoryValue;
}

function readOptionalNumber(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${key} must be a number`);
  return value;
}

export async function createProduct(formData: FormData): Promise<never> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Product name is required");

  const category = readCategory(formData);
  const patternId = String(formData.get("patternId") ?? "") || null;
  const colorIds = formData.getAll("colorIds").map(String).filter(Boolean);
  const costWholesale = readOptionalNumber(formData, "costWholesale");
  const costRetail = readOptionalNumber(formData, "costRetail");

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const imageUrls = await Promise.all(files.map(saveUploadedImage));

  const product = await prisma.product.create({
    data: {
      name,
      category,
      patternId,
      costWholesale,
      costRetail,
      images: { create: imageUrls.map((url, order) => ({ url, order })) },
      colors: { create: colorIds.map((colorId) => ({ colorId })) },
    },
  });

  // A pattern's reference image defaults to the first photo of the first
  // product made with it -- only fills in a pattern that doesn't already
  // have one, so it never overwrites a deliberately chosen reference image.
  if (patternId && imageUrls.length > 0) {
    await prisma.pattern.updateMany({
      where: { id: patternId, referenceImage: null },
      data: { referenceImage: imageUrls[0] },
    });
  }

  revalidatePath("/");
  revalidatePath(`/category/${category}`);
  redirect(`/product/${product.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Product name is required");

  const category = readCategory(formData);
  const patternId = String(formData.get("patternId") ?? "") || null;
  const colorIds = formData.getAll("colorIds").map(String).filter(Boolean);
  const costWholesale = readOptionalNumber(formData, "costWholesale");
  const costRetail = readOptionalNumber(formData, "costRetail");

  await prisma.$transaction([
    prisma.productColor.deleteMany({ where: { productId } }),
    prisma.product.update({
      where: { id: productId },
      data: {
        name,
        category,
        patternId,
        costWholesale,
        costRetail,
        colors: { create: colorIds.map((colorId) => ({ colorId })) },
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath(`/product/${productId}`);
}

export async function markProductSold(productId: string, sold: boolean) {
  await requireAdmin();
  await prisma.product.update({ where: { id: productId }, data: { sold } });
  revalidatePath("/");
  revalidatePath(`/product/${productId}`);
}

export async function toggleProductFavorite(productId: string, favorite: boolean) {
  await requireAdmin();
  await prisma.product.update({ where: { id: productId }, data: { favorite } });
  revalidatePath("/");
  revalidatePath(`/product/${productId}`);
}

export async function deleteProduct(productId: string): Promise<never> {
  await requireAdmin();
  const product = await prisma.product.delete({
    where: { id: productId },
    include: { images: true },
  });
  await Promise.all(product.images.map((image) => deleteUploadedImage(image.url)));
  revalidatePath("/");
  revalidatePath(`/category/${product.category}`);
  redirect(`/category/${product.category}`);
}

export async function addProductImage(productId: string, formData: FormData) {
  await requireAdmin();

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("An image file is required");
  }

  const url = await saveUploadedImage(file);
  const maxOrder = await prisma.productImage.aggregate({
    where: { productId },
    _max: { order: true },
  });

  await prisma.productImage.create({
    data: { productId, url, order: (maxOrder._max.order ?? -1) + 1 },
  });

  revalidatePath(`/product/${productId}`);
}

export async function deleteProductImage(imageId: string) {
  await requireAdmin();
  const image = await prisma.productImage.delete({ where: { id: imageId } });
  await deleteUploadedImage(image.url);
  revalidatePath(`/product/${image.productId}`);
}
