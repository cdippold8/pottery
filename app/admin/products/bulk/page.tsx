import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { isAiConfigured } from "@/lib/ai";
import BulkUploadForm from "./BulkUploadForm";

// Creating a whole batch of products is one Server Action request that
// uploads every photo to Blob storage — raise the execution limit above
// Vercel's default (10s) so a real-sized batch has room to finish instead
// of the function getting killed mid-request.
export const maxDuration = 60;

export default async function BulkUploadPage() {
  if (!(await isAdmin())) redirect("/admin/login?redirectTo=/admin/products/bulk");

  const [patterns, colors] = await Promise.all([
    prisma.pattern.findMany({ orderBy: { name: "asc" } }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-2xl font-semibold">Bulk upload</h1>
      <p className="mb-6 text-sm text-muted">
        Upload several photos at once — each one becomes its own new product.
      </p>
      <BulkUploadForm patterns={patterns} colors={colors} aiEnabled={isAiConfigured()} />
    </div>
  );
}
