export const dynamic = 'force-dynamic';

import { getServices } from "@/lib/repositories/service_repository";
import { formatCurrency, cn } from "@/lib/format";
import { PackageCheck, PackageX } from "lucide-react";
import { ServicesHeader } from "./ServicesHeader";
import { ServiceActions } from "@/components/services/ServiceActions";

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="space-y-6">
      <ServicesHeader />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-right">Price</th>
                <th className="px-6 py-3.5 text-right">GST Rate</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No services found.
                  </td>
                </tr>
              )}
              {services.map((service) => (
                <tr key={service.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{service.name}</td>
                  <td className="px-6 py-4 text-gray-600">{service.category}</td>
                  <td className="px-6 py-4 text-right text-gray-900 tabular-nums">
                    ₹ {formatCurrency(service.price)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 tabular-nums">
                    {service.gst_rate}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        service.in_stock
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      {service.in_stock ? (
                        <>
                          <PackageCheck className="h-3.5 w-3.5" /> In Stock
                        </>
                      ) : (
                        <>
                          <PackageX className="h-3.5 w-3.5" /> Out of Stock
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <ServiceActions service={service} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
