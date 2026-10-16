"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { getCartSummary, submitRequest, type CartItem } from "@/app/actions/requests";

const EMPTY_FIELDS = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  shippingLine1: "",
  shippingLine2: "",
  shippingCity: "",
  shippingState: "",
  shippingZip: "",
  shippingCountry: "United States",
  notes: "",
};

export default function RequestPage() {
  const { ids, remove, clear } = useCart();
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  // Controlled rather than left to the native form: React clears
  // uncontrolled fields once a form action settles, success or not, which
  // would otherwise wipe everything the customer typed on a failed submit
  // (e.g. an item going unavailable moments before they hit Submit).
  const [fields, setFields] = useState(EMPTY_FIELDS);

  function updateField<K extends keyof typeof EMPTY_FIELDS>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    let cancelled = false;
    getCartSummary(ids).then((result) => {
      if (!cancelled) setItems(result);
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  async function refreshItems() {
    const result = await getCartSummary(ids);
    setItems(result);
    return result;
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    ids.forEach((id) => formData.append("productIds", id));
    startSubmitting(async () => {
      const result = await submitRequest(formData);
      if (result.ok) {
        clear();
        setFields(EMPTY_FIELDS);
        setConfirmationId(result.requestId);
      } else {
        setError(result.message);
        await refreshItems();
      }
    });
  }

  if (confirmationId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold">Request sent</h1>
        <p className="text-sm text-muted">
          Thanks! I&rsquo;ll be in touch soon about your request (reference {confirmationId.slice(-8)}).
        </p>
        <Link href="/" className="mt-6 inline-block text-sm underline hover:no-underline">
          Back to the catalog
        </Link>
      </div>
    );
  }

  if (items === null) {
    return <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-muted sm:px-6">Loading…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold">Your request list is empty</h1>
        <p className="text-sm text-muted">Browse the catalog and add pieces you&rsquo;re interested in.</p>
        <Link href="/" className="mt-6 inline-block text-sm underline hover:no-underline">
          Browse the catalog
        </Link>
      </div>
    );
  }

  const wholesaleTotal = items.reduce((sum, i) => sum + (i.costWholesale ?? 0), 0);
  const retailTotal = items.reduce((sum, i) => sum + (i.costRetail ?? 0), 0);
  const hasUnavailable = items.some((i) => i.sold || i.requestedInId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold">Your request list</h1>

      <div className="flex flex-col divide-y divide-border">
        {items.map((item) => {
          const unavailable = item.sold || item.requestedInId;
          return (
            <div key={item.id} className="flex items-center gap-4 py-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-50">
                {item.image && <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                {unavailable && (
                  <p className="text-xs text-red-600">No longer available — please remove it to continue</p>
                )}
              </div>
              <div className="shrink-0 text-right text-sm">
                <p>Wholesale: {item.costWholesale != null ? `$${item.costWholesale.toFixed(2)}` : "—"}</p>
                <p className="text-muted">Retail: {item.costRetail != null ? `$${item.costRetail.toFixed(2)}` : "—"}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="shrink-0 text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end gap-8 text-sm">
        <p>
          Wholesale total: <strong>${wholesaleTotal.toFixed(2)}</strong>
        </p>
        <p>
          Retail total: <strong>${retailTotal.toFixed(2)}</strong>
        </p>
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={hasUnavailable}
          className="mt-6 rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          Continue to shipping info
        </button>
      ) : (
        <form action={handleSubmit} className="mt-6 flex flex-col gap-3 rounded-md border border-border p-4">
          <h2 className="text-sm font-medium">Shipping &amp; contact info</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              name="customerName"
              value={fields.customerName}
              onChange={(e) => updateField("customerName", e.target.value)}
              placeholder="Full name"
              required
              className="rounded border border-border px-2 py-1.5 text-sm"
            />
            <input
              name="customerEmail"
              type="email"
              value={fields.customerEmail}
              onChange={(e) => updateField("customerEmail", e.target.value)}
              placeholder="Email"
              required
              className="rounded border border-border px-2 py-1.5 text-sm"
            />
          </div>
          <input
            name="customerPhone"
            value={fields.customerPhone}
            onChange={(e) => updateField("customerPhone", e.target.value)}
            placeholder="Phone (optional)"
            className="rounded border border-border px-2 py-1.5 text-sm"
          />
          <input
            name="shippingLine1"
            value={fields.shippingLine1}
            onChange={(e) => updateField("shippingLine1", e.target.value)}
            placeholder="Address line 1"
            required
            className="rounded border border-border px-2 py-1.5 text-sm"
          />
          <input
            name="shippingLine2"
            value={fields.shippingLine2}
            onChange={(e) => updateField("shippingLine2", e.target.value)}
            placeholder="Address line 2 (optional)"
            className="rounded border border-border px-2 py-1.5 text-sm"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              name="shippingCity"
              value={fields.shippingCity}
              onChange={(e) => updateField("shippingCity", e.target.value)}
              placeholder="City"
              required
              className="rounded border border-border px-2 py-1.5 text-sm"
            />
            <input
              name="shippingState"
              value={fields.shippingState}
              onChange={(e) => updateField("shippingState", e.target.value)}
              placeholder="State"
              required
              className="rounded border border-border px-2 py-1.5 text-sm"
            />
            <input
              name="shippingZip"
              value={fields.shippingZip}
              onChange={(e) => updateField("shippingZip", e.target.value)}
              placeholder="ZIP"
              required
              className="rounded border border-border px-2 py-1.5 text-sm"
            />
          </div>
          <input
            name="shippingCountry"
            value={fields.shippingCountry}
            onChange={(e) => updateField("shippingCountry", e.target.value)}
            placeholder="Country"
            className="rounded border border-border px-2 py-1.5 text-sm"
          />
          <textarea
            name="notes"
            value={fields.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Anything else I should know? (optional)"
            rows={2}
            className="rounded border border-border px-2 py-1.5 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
            >
              {isSubmitting ? "Submitting..." : "Submit request"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-border px-4 py-2 text-sm"
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
