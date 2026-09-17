import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import ColorsManager from "./ColorsManager";

export default async function ColorsPage() {
  if (!(await isAdmin())) redirect("/admin/login?redirectTo=/admin/colors");

  const colors = await prisma.color.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold">Manage colors</h1>
      <ColorsManager initialColors={colors} />
    </div>
  );
}
