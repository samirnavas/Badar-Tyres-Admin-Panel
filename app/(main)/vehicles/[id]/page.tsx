import { notFound } from "next/navigation";
import { getVehicle360 } from "@/lib/repositories";
import VehicleProfileClient from "./client";

export const dynamic = "force-dynamic";

export default async function VehicleProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getVehicle360(id);

  if (!data) {
    notFound();
  }

  return <VehicleProfileClient data={data} />;
}
