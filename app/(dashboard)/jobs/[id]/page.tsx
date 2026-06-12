"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Download,
  FileText,
  User,
  CarFront,
  Wrench,
  Plus,
} from "lucide-react";
import { useJob } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatCurrency } from "@/lib/format";

export default function JobPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: job, isLoading, isError, error } = useJob(id);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="rounded-md border border-theme-accent/30 bg-theme-accent-soft px-5 py-10 text-center text-sm font-medium text-theme-accent">
        {(error as Error)?.message ?? "Failed to load job card details."}
        <div className="mt-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-theme-accent hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    running: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    delayed: "bg-theme-accent-soft text-theme-accent",
    pending: "bg-indigo-100 text-indigo-700",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="mt-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Job Card Preview
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Review services and financial summary for this vehicle.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50">
            <Printer className="h-4 w-4" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Summary Card */}
        <div className="grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-md border border-theme-accent/20 bg-white md:grid-cols-4 md:divide-x md:divide-y-0">
          {/* Job Card Info */}
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-theme-accent-soft text-theme-accent">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Job Card
              </p>
              <p className="mt-1 font-bold text-theme-accent">
                {job.jobNumber}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-gray-500">
                <span>{job.date}</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    statusColors[job.status] || statusColors.pending,
                  )}
                >
                  {job.status}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Customer
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {job.customerName}
              </p>
              <p className="mt-1 text-xs text-gray-500">{job.mobile || "—"}</p>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <CarFront className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Vehicle
              </p>
              <p className="mt-1 font-semibold uppercase text-gray-900">
                {job.vehicleNumber}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {job.vehicleModel || "—"}
              </p>
            </div>
          </div>

          {/* Technician Info */}
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Technician
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {job.technician}
              </p>
            </div>
          </div>
        </div>

        {/* Services & Financials */}
        <div className="overflow-hidden rounded-md border border-theme-accent/20 bg-white">
          <div className="flex items-center justify-between border-b border-theme-accent/20 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-theme-accent-soft text-theme-accent">
                <Wrench className="h-4 w-4" />
              </div>
              <h2 className="font-bold text-gray-900">Services</h2>
            </div>
            <button className="flex items-center gap-1 text-xs font-bold tracking-wide text-theme-accent hover:underline">
              <Plus className="h-3.5 w-3.5" /> ADD NEW SERVICES
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50/50">
                  <th className="px-5 py-3 w-12">#</th>
                  <th className="px-5 py-3">Service / Part</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-right">Amt (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {job.services.length > 0 ? (
                  job.services.map((service, index) => (
                    <tr key={index} className="transition-colors hover:bg-gray-50">
                      <td className="px-5 py-4 text-gray-500">{index + 1}</td>
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {service.name}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {service.description || "-"}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-gray-900">
                        {service.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                      No services added to this job card yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 divide-y divide-gray-200 md:grid-cols-2 md:divide-x md:divide-y-0">
            {/* Notes & Signature */}
            <div className="flex flex-col justify-between p-5 md:min-h-[200px]">
              <div>
                <h3 className="text-xs font-bold text-gray-900">Notes:</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {job.remarks || "No remarks provided."}
                </p>
              </div>
              <div className="mt-12 w-48 border-t border-gray-300 pt-3 text-center">
                <p className="text-xs text-gray-500">Customer Signature</p>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50/30 p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Sub Total</span>
                  <span className="font-medium text-gray-900">
                    ₹ {job.subTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">GST (18%)</span>
                  <span className="font-medium text-gray-900">
                    ₹ {job.gst.toFixed(2)}
                  </span>
                </div>
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">GRAND TOTAL</span>
                    <span className="text-lg font-bold text-theme-accent">
                      ₹ {job.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
