import { notFound } from "next/navigation";
import { getCustomer360 } from "@/lib/repositories";
import CustomerProfileClient from "./client";

export const dynamic = 'force-dynamic';

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCustomer360(id);

  if (!data) {
    notFound();
  }

  return <CustomerProfileClient data={data} />;
}
