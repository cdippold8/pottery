import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import PatternsManager from "./PatternsManager";

export default async function PatternsPage() {
  if (!(await isAdmin())) redirect("/admin/login?redirectTo=/admin/patterns");

  const patterns = await prisma.pattern.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold">Manage patterns</h1>
      <PatternsManager initialPatterns={patterns} />
    </div>
  );
}
