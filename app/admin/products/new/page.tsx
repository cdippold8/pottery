import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { isAiConfigured } from "@/lib/ai";
import NewProductForm from "./NewProductForm";

export default async function NewProductPage() {
  if (!(await isAdmin())) redirect("/admin/login?redirectTo=/admin/products/new");

  const [patterns, colors] = await Promise.all([
    prisma.pattern.findMany({ orderBy: { name: "asc" } }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold">Add new product</h1>
      <NewProductForm patterns={patterns} colors={colors} aiEnabled={isAiConfigured()} />
    </div>
  );
}
