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
        <div className="w-full overflow-auto max-h-[calc(100vh-200px)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur shadow-[0_1px_0_rgba(0,0,0,0.1)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-right whitespace-nowrap">Price</th>
                <th className="px-3 py-2 text-right">GST Rate</th>
                <th className="px-3 py-2 text-center whitespace-nowrap">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                    No services found.
                  </td>
                </tr>
              )}
              {services.map((service) => (
                <tr key={service.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{service.name}</td>
                  <td className="px-3 py-2 text-gray-600">{service.category}</td>
                  <td className="px-3 py-2 text-right text-gray-900 tabular-nums whitespace-nowrap">
                    ₹ {formatCurrency(service.price)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 tabular-nums">
                    {service.gst_rate}%
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
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
                  <td className="px-3 py-2">
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
