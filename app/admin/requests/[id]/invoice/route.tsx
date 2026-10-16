import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { requestWithRelations } from "@/lib/types";
import InvoiceDocument from "@/lib/pdf/InvoiceDocument";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return new Response("Not authorized", { status: 403 });
  }

  const { id } = await params;
  const request = await prisma.request.findUnique({ where: { id }, ...requestWithRelations });
  if (!request) {
    return new Response("Not found", { status: 404 });
  }

  const items = request.items.map((item) => ({
    name: item.product.name,
    // Product images are absolute Blob URLs in production; the local-disk
    // fallback (/uploads/...) is relative, so resolve it against this same
    // request's own origin.
    imageUrl: item.product.images[0] ? new URL(item.product.images[0].url, req.url).toString() : null,
    costWholesale: item.costWholesale,
    costRetail: item.costRetail,
  }));

  const buffer = await renderToBuffer(
    <InvoiceDocument
      requestId={request.id}
      createdAt={request.createdAt}
      customerName={request.customerName}
      customerEmail={request.customerEmail}
      customerPhone={request.customerPhone}
      shippingAddress={[
        request.shippingLine1,
        request.shippingLine2,
        `${request.shippingCity}, ${request.shippingState} ${request.shippingZip}`,
        request.shippingCountry,
      ].filter((line): line is string => Boolean(line))}
      items={items}
    />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${request.id.slice(-8)}.pdf"`,
    },
  });
}
