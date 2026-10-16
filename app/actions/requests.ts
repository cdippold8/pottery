"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { sendRequestNotificationEmail } from "@/lib/email";

async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Not authorized");
  }
}

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export type CartItem = {
  id: string;
  name: string;
  image: string | null;
  costWholesale: number | null;
  costRetail: number | null;
  sold: boolean;
  requestedInId: string | null;
};

// Called from the public /request page with the product ids held in the
// visitor's local cart, to show current name/price/availability -- never
// trusts anything the client stored about a product besides its id.
export async function getCartSummary(productIds: string[]): Promise<CartItem[]> {
  if (productIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return productIds
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      id: p.id,
      name: p.name,
      image: p.images[0]?.url ?? null,
      costWholesale: p.costWholesale,
      costRetail: p.costRetail,
      sold: p.sold,
      requestedInId: p.requestedInId,
    }));
}

export type SubmitRequestResult =
  | { ok: true; requestId: string }
  | { ok: false; unavailableIds: string[]; message: string };

export async function submitRequest(formData: FormData): Promise<SubmitRequestResult> {
  const productIds = formData.getAll("productIds").map(String).filter(Boolean);
  if (productIds.length === 0) {
    return { ok: false, unavailableIds: [], message: "Your request list is empty." };
  }

  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
  const shippingLine1 = String(formData.get("shippingLine1") ?? "").trim();
  const shippingLine2 = String(formData.get("shippingLine2") ?? "").trim() || null;
  const shippingCity = String(formData.get("shippingCity") ?? "").trim();
  const shippingState = String(formData.get("shippingState") ?? "").trim();
  const shippingZip = String(formData.get("shippingZip") ?? "").trim();
  const shippingCountry = String(formData.get("shippingCountry") ?? "").trim() || "United States";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!customerName || !customerEmail || !shippingLine1 || !shippingCity || !shippingState || !shippingZip) {
    return { ok: false, unavailableIds: [], message: "Please fill in your name, email, and shipping address." };
  }

  const result = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    const byId = new Map(products.map((p) => [p.id, p]));
    const unavailableIds = productIds.filter((id) => {
      const p = byId.get(id);
      return !p || p.sold || p.requestedInId;
    });

    if (unavailableIds.length > 0) {
      return { ok: false as const, unavailableIds };
    }

    const request = await tx.request.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        shippingLine1,
        shippingLine2,
        shippingCity,
        shippingState,
        shippingZip,
        shippingCountry,
        notes,
        items: {
          create: products.map((p) => ({
            productId: p.id,
            costWholesale: p.costWholesale,
            costRetail: p.costRetail,
          })),
        },
      },
    });

    await tx.product.updateMany({
      where: { id: { in: productIds } },
      data: { requestedInId: request.id },
    });

    return { ok: true as const, request, products };
  });

  if (!result.ok) {
    return {
      ok: false,
      unavailableIds: result.unavailableIds,
      message: "Some items in your request are no longer available. Please remove them and try again.",
    };
  }

  revalidatePath("/");
  result.products.forEach((p) => revalidatePath(`/product/${p.id}`));

  const baseUrl = await getBaseUrl();
  await sendRequestNotificationEmail({
    id: result.request.id,
    customerName,
    customerEmail,
    customerPhone,
    shippingLine1,
    shippingLine2,
    shippingCity,
    shippingState,
    shippingZip,
    shippingCountry,
    notes,
    items: result.products.map((p) => ({ name: p.name, costRetail: p.costRetail })),
    baseUrl,
  });

  return { ok: true, requestId: result.request.id };
}

export async function removeRequestItem(requestId: string, productId: string) {
  await requireAdmin();
  await prisma.$transaction([
    prisma.requestItem.deleteMany({ where: { requestId, productId } }),
    prisma.product.updateMany({
      where: { id: productId, requestedInId: requestId },
      data: { requestedInId: null },
    }),
  ]);
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/");
  revalidatePath(`/product/${productId}`);
}

export async function markRequestFulfilled(requestId: string) {
  await requireAdmin();
  const request = await prisma.request.findUnique({ where: { id: requestId }, include: { items: true } });
  if (!request) throw new Error("Request not found");

  await prisma.$transaction([
    prisma.product.updateMany({
      where: { id: { in: request.items.map((i) => i.productId) } },
      data: { sold: true },
    }),
    prisma.request.update({ where: { id: requestId }, data: { status: "fulfilled" } }),
  ]);
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  revalidatePath("/");
}

export async function cancelRequest(requestId: string) {
  await requireAdmin();
  const request = await prisma.request.findUnique({ where: { id: requestId }, include: { items: true } });
  if (!request) throw new Error("Request not found");

  await prisma.$transaction([
    prisma.product.updateMany({
      where: { id: { in: request.items.map((i) => i.productId) }, requestedInId: requestId },
      data: { requestedInId: null },
    }),
    prisma.request.update({ where: { id: requestId }, data: { status: "cancelled" } }),
  ]);
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  revalidatePath("/");
}
