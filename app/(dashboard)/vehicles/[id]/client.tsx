"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront, FileText, Calendar, Edit, Building2, User, Phone, MapPin } from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/format";
import type { Vehicle360 } from "@/lib/repositories";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getJobPrimaryLineLabel } from "@/lib/models/JobCard";
import { useState } from "react";
import { VehicleFormModal } from "@/components/vehicles/VehicleFormModal";

function checkExpiry(dateString?: string | null): "expired" | "soon" | "ok" | null {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "soon";
  return "ok";
}

export default function VehicleProfileClient({ data }: { data: Vehicle360 }) {
  const router = useRouter();
  const [editingVehicle, setEditingVehicle] = useState(false);
  const { vehicle, customer, jobs } = data;

  const insExpiry = checkExpiry(vehicle.insurance_expiry);
  const polExpiry = checkExpiry(vehicle.pollution_expiry);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {vehicle.registration_number}
          </h1>
        </div>
        <button
          onClick={() => setEditingVehicle(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 shadow-sm"
        >
          <Edit className="h-4 w-4" /> Edit Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Technical Details Card */}
        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CarFront className="h-4 w-4 text-gray-400" /> Technical Details
            </h3>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Make" value={vehicle.manufacturer} />
                <DetailItem label="Model" value={vehicle.model} />
                <DetailItem label="Type" value={vehicle.type} />
                <DetailItem label="Color" value={vehicle.color || "—"} />
              </div>
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <DetailItem label="Chassis No. (VIN)" value={vehicle.chassis_number || "—"} fullWidth />
                <DetailItem label="Engine No." value={vehicle.engine_number || "—"} fullWidth />
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Card */}
        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" /> Compliance & Expiry
            </h3>
            <div className="mt-5 space-y-4">
              <ExpiryRow label="Insurance" status={insExpiry} date={vehicle.insurance_expiry} />
              <ExpiryRow label="Pollution" status={polExpiry} date={vehicle.pollution_expiry} />
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Next Service</span>
                <span className="text-sm font-semibold text-gray-900">{vehicle.next_service_date ? formatDate(vehicle.next_service_date) : "Not Set"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ownership Context Card */}
        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" /> Ownership Context
            </h3>
            {customer ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-theme-accent/10 text-theme-accent font-bold">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.phone}</p>
                  </div>
                </div>
                {customer.customer_type && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {customer.customer_type === "Corporate" ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {customer.customer_type}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 text-sm text-gray-500 italic">No owner data available.</div>
            )}
          </div>
          {customer && (
            <Link
              href={`/users/${customer.id}`}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark shadow-sm"
            >
              View Owner CRM
            </Link>
          )}
        </div>
      </div>

      {/* Service History Section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" /> Service History
          </h3>
          <Link
            href={`/jobs/create?customer=${vehicle.customer_id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 shadow-sm"
          >
            New Job Card
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No service history found for this vehicle.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-3">Job</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 text-right whitespace-nowrap">Total</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="transition-colors hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {getJobPrimaryLineLabel(job)}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatDate(job.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900 tabular-nums whitespace-nowrap">
                    ₹{formatCurrency(job.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <VehicleFormModal
        open={editingVehicle}
        onClose={() => setEditingVehicle(false)}
        customerId={vehicle.customer_id}
        vehicleToEdit={vehicle}
      />
    </div>
  );
}

function DetailItem({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1", fullWidth ? "col-span-2" : "")}>
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function ExpiryRow({ label, status, date }: { label: string; status: "expired" | "soon" | "ok" | null; date?: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-gray-900">
          {date ? formatDate(date) : "—"}
        </span>
      </div>
      {status === "expired" && (
        <span className="inline-flex items-center rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-red-700">
          Expired
        </span>
      )}
      {status === "soon" && (
        <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-700">
          Expiring Soon
        </span>
      )}
      {status === "ok" && (
        <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
          Valid
        </span>
      )}
    </div>
  );
}
