import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  fulfilled: "bg-green-100 text-green-800",
  cancelled: "bg-neutral-100 text-neutral-500",
};

export default async function AdminRequestsPage() {
  if (!(await isAdmin())) redirect("/admin/login?redirectTo=/admin/requests");

  const requests = await prisma.request.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold">Requests</h1>
      <div className="flex flex-col divide-y divide-border">
        {requests.map((r) => {
          const retailTotal = r.items.reduce((sum, i) => sum + (i.costRetail ?? 0), 0);
          return (
            <Link
              key={r.id}
              href={`/admin/requests/${r.id}`}
              className="flex items-center justify-between gap-4 py-3 hover:bg-neutral-50"
            >
              <div>
                <p className="text-sm font-medium">{r.customerName}</p>
                <p className="text-xs text-muted">
                  {r.items.length} item{r.items.length === 1 ? "" : "s"} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm">${retailTotal.toFixed(2)}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? ""}`}>
                  {r.status}
                </span>
              </div>
            </Link>
          );
        })}
        {requests.length === 0 && <p className="py-3 text-sm text-muted">No requests yet.</p>}
      </div>
    </div>
  );
}
