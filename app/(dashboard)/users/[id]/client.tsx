"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront, CalendarDays, Edit, ClipboardList, MapPin, Mail, Phone, Tag, Building2, User } from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/format";
import type { Customer360 } from "@/lib/repositories";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Vehicle } from "@/lib/models/Vehicle";
import { VehicleFormModal } from "@/components/vehicles/VehicleFormModal";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function checkExpiry(dateString?: string | null): "expired" | "soon" | "ok" | null {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "soon";
  return "ok";
}

export default function CustomerProfileClient({ data }: { data: Customer360 }) {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "fleet" | "history">("overview");
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const { customer, vehicles, jobs, ltv } = data;

  const tags = customer.tags || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          href="/users"
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Customer Profile
        </h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-theme-accent/10 text-xl font-bold text-theme-accent">
              {initials(customer.name)}
            </span>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {customer.name}
                </h2>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
                    customer.customer_type === "Corporate"
                      ? "bg-blue-50 text-blue-700"
                      : customer.customer_type === "Fleet"
                      ? "bg-purple-50 text-purple-700"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  {customer.customer_type || "Retail"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Customer since {formatDate(customer.created_at)}
              </p>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-theme-accent/20 bg-theme-accent/5 px-2.5 py-0.5 text-xs font-medium text-theme-accent">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 sm:min-w-[160px]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Lifetime Value
              </p>
              <p className="mt-1 text-2xl font-bold text-theme-accent">
                ₹{formatCurrency(ltv)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
              Overview
            </TabButton>
            <TabButton active={tab === "fleet"} onClick={() => setTab("fleet")}>
              Fleet &amp; Compliance <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{vehicles.length}</span>
            </TabButton>
            <TabButton active={tab === "history"} onClick={() => setTab("history")}>
              Service History <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{jobs.length}</span>
            </TabButton>
          </nav>
        </div>

        <div className="p-6">
          {tab === "overview" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Contact Details</h3>
                  <dl className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-sm">
                    <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={customer.phone} />
                    <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={customer.email || "—"} />
                    <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={customer.address || "—"} />
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Business Details</h3>
                  <dl className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-sm">
                    <DetailRow icon={customer.customer_type === "Corporate" ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />} label="Type" value={customer.customer_type || "Retail"} />
                    <DetailRow icon={<ClipboardList className="h-4 w-4" />} label="GSTIN" value={customer.gst_number || "—"} />
                  </dl>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Manager Notes</h3>
                <div className="mt-3 min-h-[160px] rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
                  {customer.notes ? (
                    <span className="whitespace-pre-wrap leading-relaxed">{customer.notes}</span>
                  ) : (
                    <span className="italic text-amber-700/50">No notes available.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "fleet" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Registered Vehicles</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAddVehicleOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 shadow-sm"
                  >
                    <CarFront className="h-3.5 w-3.5" /> Add Vehicle
                  </button>
                  <Link
                    href={`/jobs/create?customer=${customer.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-theme-accent-dark shadow-sm"
                  >
                    <ClipboardList className="h-3.5 w-3.5" /> Create Job
                  </Link>
                </div>
              </div>
              {vehicles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500 bg-gray-50">
                  No vehicles registered for this customer.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} onEdit={() => setEditingVehicle(v)} />)}
                </div>
              )}
            </div>
          )}

          {tab === "history" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Past Job Cards</h3>
              </div>
              {jobs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500 bg-gray-50">
                  No service history found.
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200">
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Vehicle</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {jobs.map((job) => {
                        const v = vehicles.find((v) => v.id === job.vehicle_id);
                        return (
                          <tr
                            key={job.id}
                            onClick={() => router.push(`/jobs/${job.id}`)}
                            className="cursor-pointer transition-colors hover:bg-gray-50"
                          >
                            <td className="px-5 py-3 font-medium text-gray-900">
                              {formatDate(job.created_at)}
                            </td>
                            <td className="px-5 py-3 text-gray-600">
                              {v ? `${v.manufacturer} ${v.model} (${v.registration_number})` : "Unknown Vehicle"}
                            </td>
                            <td className="px-5 py-3">
                              <StatusBadge status={job.status} />
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-gray-900 tabular-nums">
                              ₹{formatCurrency(job.total_amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <VehicleFormModal
        open={addVehicleOpen || !!editingVehicle}
        onClose={() => {
          setAddVehicleOpen(false);
          setEditingVehicle(null);
        }}
        customerId={customer.id}
        vehicleToEdit={editingVehicle}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap border-b-2 py-4 px-2 text-sm font-semibold transition-colors",
        active
          ? "border-theme-accent text-theme-accent"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
      )}
    >
      {children}
    </button>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 border border-gray-100">{icon}</div>
      <dt className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900 truncate">{value}</dd>
    </div>
  );
}

function VehicleCard({ vehicle, onEdit }: { vehicle: Vehicle; onEdit: () => void }) {
  const insExpiry = checkExpiry(vehicle.insurance_expiry);
  const polExpiry = checkExpiry(vehicle.pollution_expiry);

  return (
    <div className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-theme-accent/30 relative">
      <button 
        onClick={onEdit} 
        className="absolute right-4 top-4 hidden items-center justify-center rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 group-hover:flex z-10"
        title="Edit Vehicle"
      >
        <Edit className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start justify-between gap-3 pr-8">
        <div>
          <h4 className="font-bold text-gray-900 text-base">
            {vehicle.manufacturer} {vehicle.model}
          </h4>
          <p className="mt-1 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
            {vehicle.chassis_number ? `VIN: ${vehicle.chassis_number}` : "VIN NOT RECORDED"}
          </p>
        </div>
        <span className="shrink-0 rounded border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-theme-accent shadow-sm">
          {vehicle.registration_number}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
        <ExpiryBadge label="Insurance" status={insExpiry} date={vehicle.insurance_expiry} />
        <ExpiryBadge label="Pollution" status={polExpiry} date={vehicle.pollution_expiry} />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="text-xs font-semibold uppercase tracking-widest text-theme-accent transition-colors hover:text-theme-accent-dark"
        >
          View Full Profile
        </Link>
      </div>
    </div>
  );
}

function ExpiryBadge({ label, status, date }: { label: string; status: "expired" | "soon" | "ok" | null; date?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="mt-1.5 flex flex-col items-start gap-1.5">
        <span className="text-sm font-semibold text-gray-900">
          {date ? formatDate(date) : "—"}
        </span>
        {status === "expired" && (
          <span className="inline-flex w-fit items-center rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-red-700">
            Expired
          </span>
        )}
        {status === "soon" && (
          <span className="inline-flex w-fit items-center rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-700">
            Expiring Soon
          </span>
        )}
        {status === "ok" && (
          <span className="inline-flex w-fit items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
            Valid
          </span>
        )}
      </div>
    </div>
  );
}
