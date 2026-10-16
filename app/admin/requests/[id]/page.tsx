import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { requestWithRelations } from "@/lib/types";
import RequestDetail from "./RequestDetail";

export default async function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login?redirectTo=/admin/requests");
  const { id } = await params;

  const request = await prisma.request.findUnique({ where: { id }, ...requestWithRelations });
  if (!request) notFound();

  return <RequestDetail request={request} />;
}
