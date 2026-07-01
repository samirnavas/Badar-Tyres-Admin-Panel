export const dynamic = 'force-dynamic';

import { getServices } from "@/lib/repositories/service_repository";
import { ServicesHeader } from "./ServicesHeader";
import { ServicesTable } from "./ServicesTable";

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <ServicesHeader />
      <ServicesTable services={services} />
    </div>
  );
}
