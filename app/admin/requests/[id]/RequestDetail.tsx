"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { RequestWithRelations } from "@/lib/types";
import { cancelRequest, markRequestFulfilled, removeRequestItem } from "@/app/actions/requests";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  fulfilled: "bg-green-100 text-green-800",
  cancelled: "bg-neutral-100 text-neutral-500",
};

export default function RequestDetail({ request }: { request: RequestWithRelations }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const wholesaleTotal = request.items.reduce((sum, i) => sum + (i.costWholesale ?? 0), 0);
  const retailTotal = request.items.reduce((sum, i) => sum + (i.costRetail ?? 0), 0);
  const isPendingStatus = request.status === "pending";

  function handleRemoveItem(productId: string) {
    if (!confirm("Remove this item from the request? It becomes available to request again.")) return;
    startTransition(async () => {
      await removeRequestItem(request.id, productId);
      router.refresh();
    });
  }

  function handleMarkFulfilled() {
    if (!confirm("Mark every item in this request as sold?")) return;
    startTransition(async () => {
      await markRequestFulfilled(request.id);
      router.refresh();
    });
  }

  function handleCancel() {
    if (!confirm("Cancel this request? All its items become available again.")) return;
    startTransition(async () => {
      await cancelRequest(request.id);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/admin/requests" className="mb-4 inline-block text-sm text-muted hover:text-foreground">
        &larr; All requests
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{request.customerName}</h1>
          <p className="text-sm text-muted">{new Date(request.createdAt).toLocaleString()}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[request.status] ?? ""}`}>
          {request.status}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-md border border-border p-4 text-sm">
          <p className="mb-2 font-medium">Contact</p>
          <p>{request.customerEmail}</p>
          {request.customerPhone && <p>{request.customerPhone}</p>}
          {request.notes && (
            <p className="mt-2 text-muted">
              <span className="font-medium text-foreground">Note: </span>
              {request.notes}
            </p>
          )}
        </div>
        <div className="rounded-md border border-border p-4 text-sm">
          <p className="mb-2 font-medium">Ship to</p>
          <p>{request.shippingLine1}</p>
          {request.shippingLine2 && <p>{request.shippingLine2}</p>}
          <p>
            {request.shippingCity}, {request.shippingState} {request.shippingZip}
          </p>
          <p>{request.shippingCountry}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <a
          href={`/admin/requests/${request.id}/invoice`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-foreground"
        >
          Download invoice
        </a>
        <a
          href={`/admin/requests/${request.id}/packing-slip`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-foreground"
        >
          Download packing slip
        </a>
      </div>

      <div className="flex flex-col divide-y divide-border rounded-md border border-border">
        {request.items.map((item) => {
          const thumbnail = item.product.images[0];
          return (
            <div key={item.id} className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-50">
                {thumbnail && <Image src={thumbnail.url} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-muted">
                  {item.product.pattern?.name ?? "No pattern"}
                  {item.product.colors.length > 0 && ` · ${item.product.colors.map((c) => c.color.name).join(", ")}`}
                </p>
              </div>
              <div className="shrink-0 text-right text-sm">
                <p>Wholesale: {item.costWholesale != null ? `$${item.costWholesale.toFixed(2)}` : "—"}</p>
                <p className="text-muted">Retail: {item.costRetail != null ? `$${item.costRetail.toFixed(2)}` : "—"}</p>
              </div>
              {isPendingStatus && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.productId)}
                  disabled={isPending}
                  className="shrink-0 text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
        {request.items.length === 0 && <p className="p-4 text-sm text-muted">No items left on this request.</p>}
      </div>

      <div className="mt-4 flex justify-end gap-8 text-sm">
        <p>
          Wholesale total: <strong>${wholesaleTotal.toFixed(2)}</strong>
        </p>
        <p>
          Retail total: <strong>${retailTotal.toFixed(2)}</strong>
        </p>
      </div>

      {isPendingStatus && (
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={handleMarkFulfilled}
            disabled={isPending || request.items.length === 0}
            className="rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
          >
            Mark all as sold
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-md border border-red-200 px-4 py-2 text-sm text-red-600 hover:border-red-400"
          >
            Cancel request
          </button>
        </div>
      )}
    </div>
  );
}
