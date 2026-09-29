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

function readCategory(formData: FormData, key = "category"): ProductCategoryValue {
  const raw = String(formData.get(key) ?? "");
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

export type BulkCreateResult = {
  created: { key: string; id: string; name: string }[];
  failed: { key: string; name: string; error: string }[];
};

// One photo -> one product. Each item's fields are namespaced by a client-
// generated key (name_<key>, category_<key>, etc.) so a single form can
// carry an arbitrary number of draft products; itemKeys lists which keys to
// process. Items are created concurrently rather than one at a time —
// each upload is a network round trip to Blob storage, and a sequential
// loop over a real-sized batch can add up to more than a serverless
// function's execution timeout, which kills the request outright before
// any response (including partial failures) reaches the client. A failure
// on one item (a bad file, a missing name) is reported back rather than
// aborting the rest of the batch, since the whole point of bulk upload is
// not losing everything else in it to one bad photo.
export async function createProductsBulk(formData: FormData): Promise<BulkCreateResult> {
  await requireAdmin();

  const keys = String(formData.get("itemKeys") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const results = await Promise.all(
    keys.map(async (key) => {
      const name = String(formData.get(`name_${key}`) ?? "").trim();
      try {
        if (!name) throw new Error("Name is required");

        const category = readCategory(formData, `category_${key}`);
        const patternId = String(formData.get(`patternId_${key}`) ?? "") || null;
        const colorIds = formData.getAll(`colorIds_${key}`).map(String).filter(Boolean);
        const costWholesale = readOptionalNumber(formData, `costWholesale_${key}`);
        const costRetail = readOptionalNumber(formData, `costRetail_${key}`);

        const file = formData.get(`image_${key}`);
        if (!(file instanceof File) || file.size === 0) throw new Error("Photo is missing");
        const imageUrl = await saveUploadedImage(file);

        const product = await prisma.product.create({
          data: {
            name,
            category,
            patternId,
            costWholesale,
            costRetail,
            images: { create: [{ url: imageUrl, order: 0 }] },
            colors: { create: colorIds.map((colorId) => ({ colorId })) },
          },
        });

        if (patternId) {
          await prisma.pattern.updateMany({
            where: { id: patternId, referenceImage: null },
            data: { referenceImage: imageUrl },
          });
        }

        return { ok: true as const, key, id: product.id, name: product.name, category };
      } catch (err) {
        return {
          ok: false as const,
          key,
          name,
          error: err instanceof Error ? err.message : "Could not create product",
        };
      }
    })
  );

  const created: BulkCreateResult["created"] = [];
  const failed: BulkCreateResult["failed"] = [];
  const categoriesTouched = new Set<ProductCategoryValue>();

  for (const result of results) {
    if (result.ok) {
      created.push({ key: result.key, id: result.id, name: result.name });
      categoriesTouched.add(result.category);
    } else {
      failed.push({ key: result.key, name: result.name, error: result.error });
    }
  }

  if (created.length > 0) {
    revalidatePath("/");
    categoriesTouched.forEach((category) => revalidatePath(`/category/${category}`));
  }

  return { created, failed };
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
