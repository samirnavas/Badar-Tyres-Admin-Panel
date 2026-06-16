"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  CarFront,
  Plus,
  ArrowLeft,
  AlertTriangle,
  ChevronRight,
  Users as UsersIcon,
} from "lucide-react";
import {
  getCustomers,
  getVehiclesByCustomerId,
  getJobCardsByCustomerId,
} from "@/lib/repositories";
import type { Customer } from "@/lib/models/Customer";
import type { Vehicle } from "@/lib/models/Vehicle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CustomerFormModal } from "@/components/customers/CustomerFormModal";
import {
  cn,
  formatCurrency,
  formatDate,
  isDueSoon,
  daysUntil,
} from "@/lib/format";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CustomersPage() {
  return (
    <Suspense fallback={null}>
      <CustomersView />
    </Suspense>
  );
}

function CustomersView() {
  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Deep-link support: pre-select a customer when arriving with ?customer=<id>
  // (e.g. from the dashboard "Upcoming Services" widget).
  const customerParam = searchParams.get("customer");
  useEffect(() => {
    if (customerParam) setSelectedId(customerParam);
  }, [customerParam]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = customersQuery.data ?? [];
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [customersQuery.data, search]);

  const selectedCustomer =
    (customersQuery.data ?? []).find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Customers
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse customer profiles, fleets, and service history.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
        >
          <Plus className="h-4 w-4" /> Add New Customer
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        {/* Master list */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
              />
            </div>
          </div>

          <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">
            {customersQuery.isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}

            {customersQuery.isError && (
              <p className="p-6 text-center text-sm text-theme-accent">
                Failed to load customers.
              </p>
            )}

            {!customersQuery.isLoading &&
              !customersQuery.isError &&
              filtered.map((customer) => {
                const active = customer.id === selectedId;
                return (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedId(customer.id)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-gray-50 px-3 py-3 text-left transition-colors",
                      active ? "bg-gray-50" : "hover:bg-gray-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        active
                          ? "bg-theme-accent text-white"
                          : "bg-gray-100 text-gray-600",
                      )}
                    >
                      {initials(customer.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {customer.name}
                      </span>
                      <span className="block truncate text-xs text-gray-400">
                        {customer.phone}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </button>
                );
              })}

            {!customersQuery.isLoading &&
              !customersQuery.isError &&
              filtered.length === 0 && (
                <p className="p-6 text-center text-sm text-gray-500">
                  No customers found.
                </p>
              )}
          </div>
        </div>

        {/* Detail (desktop) */}
        <div className="hidden lg:block">
          {selectedCustomer ? (
            <CustomerProfile key={selectedCustomer.id} customer={selectedCustomer} />
          ) : (
            <div className="flex h-full min-h-[24rem] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <UsersIcon className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-900">
                Select a customer
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Choose a customer from the list to view their full profile.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail (mobile full-screen overlay) */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-50 p-4 lg:hidden">
          <CustomerProfile
            key={selectedCustomer.id}
            customer={selectedCustomer}
            onBack={() => setSelectedId(null)}
          />
        </div>
      )}

      <CustomerFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(customer) => setSelectedId(customer.id)}
      />
    </div>
  );
}

function CustomerProfile({
  customer,
  onBack,
}: {
  customer: Customer;
  onBack?: () => void;
}) {
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles-by-customer", customer.id],
    queryFn: () => getVehiclesByCustomerId(customer.id),
  });
  const jobsQuery = useQuery({
    queryKey: ["jobcards-by-customer", customer.id],
    queryFn: () => getJobCardsByCustomerId(customer.id),
  });
  const router = useRouter();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to list
          </button>
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-theme-accent text-sm font-semibold text-white">
              {initials(customer.name)}
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                {customer.name}
              </h2>
              <p className="text-sm text-gray-400">
                Customer since {formatDate(customer.created_at)}
              </p>
            </div>
          </div>
          <Link
            href={`/jobs/create?customer=${customer.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
          >
            <Plus className="h-4 w-4" /> Create New Job
          </Link>
        </div>

        {/* Contact info */}
        <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
          <ContactItem icon={<Phone className="h-4 w-4" />} label="Phone" value={customer.phone} />
          <ContactItem icon={<Mail className="h-4 w-4" />} label="Email" value={customer.email} />
          <ContactItem
            icon={<MapPin className="h-4 w-4" />}
            label="Address"
            value={customer.address}
          />
        </dl>
      </div>

      {/* Vehicle fleet */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5">
          <CarFront className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Vehicle Fleet</h3>
        </div>
        <div className="p-5">
          {vehiclesQuery.isLoading && <Skeleton className="h-24 w-full" />}

          {!vehiclesQuery.isLoading && (vehiclesQuery.data ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">
              No vehicles registered for this customer.
            </p>
          )}

          {!vehiclesQuery.isLoading && (vehiclesQuery.data ?? []).length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(vehiclesQuery.data ?? []).map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Service history */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5">
          <CalendarDays className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">
            Service History
          </h3>
        </div>
        <div className="p-2">
          {jobsQuery.isLoading && (
            <div className="p-3">
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {!jobsQuery.isLoading && (jobsQuery.data ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">
              No service history yet.
            </p>
          )}

          {!jobsQuery.isLoading && (jobsQuery.data ?? []).length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(jobsQuery.data ?? []).map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-3 py-3 text-gray-600">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-900 tabular-nums">
                      ₹ {formatCurrency(job.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function ContactItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </dt>
        <dd className="truncate text-sm font-medium text-gray-900">{value}</dd>
      </div>
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const dueSoon = isDueSoon(vehicle.next_service_date, 30);
  const days = daysUntil(vehicle.next_service_date);
  const dueLabel =
    days === null
      ? "—"
      : days < 0
        ? `Overdue by ${Math.abs(days)}d`
        : `Due in ${days}d`;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        dueSoon ? "border-amber-300 bg-amber-50/50" : "border-gray-200 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {vehicle.manufacturer} {vehicle.model}
          </p>
          <p className="text-xs text-gray-400">{vehicle.type}</p>
        </div>
        <span className="shrink-0 rounded border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-gray-700">
          {vehicle.registration_number}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
        <span className="text-gray-400">Next service</span>
        {!vehicle.next_service_date ? (
          <span className="text-gray-400">— Not Scheduled</span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              dueSoon ? "text-amber-700" : "text-gray-700",
            )}
          >
            {dueSoon && <AlertTriangle className="h-3.5 w-3.5" />}
            {formatDate(vehicle.next_service_date)}
            <span className="text-gray-400">({dueLabel})</span>
          </span>
        )}
      </div>
    </div>
  );
}
