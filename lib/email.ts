import { Resend } from "resend";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ADMIN_NOTIFICATION_EMAIL);
}

type RequestNotification = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  notes: string | null;
  items: { name: string; costRetail: number | null }[];
  baseUrl: string;
};

/** Best-effort: a failed send should never block a request from being saved. */
export async function sendRequestNotificationEmail(request: RequestNotification): Promise<void> {
  if (!isEmailConfigured()) return;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const retailTotal = request.items.reduce((sum, item) => sum + (item.costRetail ?? 0), 0);

    const itemRows = request.items
      .map((item) => `<li>${escapeHtml(item.name)}${item.costRetail != null ? ` — $${item.costRetail.toFixed(2)}` : ""}</li>`)
      .join("");

    const html = `
      <h2>New request from ${escapeHtml(request.customerName)}</h2>
      <p><strong>${request.items.length}</strong> item${request.items.length === 1 ? "" : "s"} — retail total $${retailTotal.toFixed(2)}</p>
      <ul>${itemRows}</ul>
      <p>
        <strong>Contact:</strong><br />
        ${escapeHtml(request.customerEmail)}${request.customerPhone ? `<br />${escapeHtml(request.customerPhone)}` : ""}
      </p>
      <p>
        <strong>Ship to:</strong><br />
        ${escapeHtml(request.shippingLine1)}<br />
        ${request.shippingLine2 ? `${escapeHtml(request.shippingLine2)}<br />` : ""}
        ${escapeHtml(request.shippingCity)}, ${escapeHtml(request.shippingState)} ${escapeHtml(request.shippingZip)}<br />
        ${escapeHtml(request.shippingCountry)}
      </p>
      ${request.notes ? `<p><strong>Note:</strong> ${escapeHtml(request.notes)}</p>` : ""}
      <p><a href="${request.baseUrl}/admin/requests/${request.id}">View request &rarr;</a></p>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Studio Inventory <onboarding@resend.dev>",
      to: process.env.ADMIN_NOTIFICATION_EMAIL!,
      subject: `New request from ${request.customerName} (${request.items.length} item${request.items.length === 1 ? "" : "s"})`,
      html,
    });
  } catch (err) {
    console.error("Failed to send request notification email", err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
