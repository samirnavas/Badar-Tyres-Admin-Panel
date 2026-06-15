"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  CarFront,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getJobCardById, getServices, updateJobStatus } from "@/lib/repositories";
import { cn, formatCurrency, formatDate } from "@/lib/format";

export default function JobPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: jobCard, isLoading, isError, error } = useQuery({
    queryKey: ["jobCard", id],
    queryFn: () => getJobCardById(id),
  });

  const { data: servicesList } = useQuery({
    queryKey: ["service-catalog"],
    queryFn: getServices,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => updateJobStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobCard", id] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      router.refresh();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !jobCard) {
    return (
      <div className="rounded-md border border-theme-accent/30 bg-theme-accent-soft px-5 py-10 text-center text-sm font-medium text-theme-accent">
        {(error as Error)?.message ?? "Job Not Found."}
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

  // Action Bar Logic
  let ActionBar = null;
  if (jobCard.status === "Draft" || jobCard.status === "In Progress") {
    ActionBar = (
      <button
        onClick={() => updateStatusMutation.mutate("Completed")}
        disabled={updateStatusMutation.isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark disabled:opacity-60"
      >
        <CheckCircle2 className="h-4 w-4" />
        {updateStatusMutation.isPending ? "Marking..." : "Mark as Completed"}
      </button>
    );
  } else if (jobCard.status === "Completed") {
    ActionBar = (
      <Link
        href={`/jobs/${jobCard.id}/invoice`}
        className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
      >
        <FileText className="h-4 w-4" />
        Generate Invoice
      </Link>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              #{jobCard.id.slice(0, 8).toUpperCase()}
              <StatusBadge status={jobCard.status} />
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Created on {formatDate(jobCard.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ActionBar}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-4">
              <h2 className="font-semibold text-gray-900">Service Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50">
                    <th className="px-5 py-3">Service / Part</th>
                    <th className="px-5 py-3 text-center">Qty</th>
                    <th className="px-5 py-3 text-right">Rate</th>
                    <th className="px-5 py-3 text-right">Tax</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobCard.service_item_ids.length > 0 ? (
                    jobCard.service_item_ids.map((serviceId, index) => {
                      const s = (servicesList || []).find((x) => x.id === serviceId);
                      const name = s ? s.name : "Unknown Service";
                      const rate = s ? s.price : 0;
                      const qty = 1; // JobCard does not store quantity currently
                      const gstRate = s ? s.gst_rate : 18;
                      const tax = (rate * qty * gstRate) / 100;
                      const total = (rate * qty) + tax;
                      return (
                        <tr key={index} className="transition-colors hover:bg-gray-50">
                          <td className="px-5 py-4 font-medium text-gray-900">{name}</td>
                          <td className="px-5 py-4 text-center text-gray-600">{qty}</td>
                          <td className="px-5 py-4 text-right text-gray-600">₹{formatCurrency(rate)}</td>
                          <td className="px-5 py-4 text-right text-gray-600">₹{formatCurrency(tax)}</td>
                          <td className="px-5 py-4 text-right font-medium text-gray-900">₹{formatCurrency(total)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                        No service items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Financial Summary */}
            <div className="border-t border-gray-200 bg-gray-50/30 p-5 flex justify-end">
              <div className="w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">₹{formatCurrency(jobCard.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Tax</span>
                  <span className="font-medium text-gray-900">₹{formatCurrency(jobCard.total_tax)}</span>
                </div>
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">Grand Total</span>
                    <span className="text-lg font-bold text-theme-accent">₹{formatCurrency(jobCard.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <User className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900">Customer Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-900">{jobCard.customer?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Phone</p>
                <p className="text-sm text-gray-600">{jobCard.customer?.phone || "—"}</p>
              </div>
              {jobCard.customer?.email && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Email</p>
                  <p className="text-sm text-gray-600">{jobCard.customer?.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <CarFront className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900">Vehicle Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Make & Model</p>
                <p className="text-sm font-medium text-gray-900">
                  {jobCard.vehicle ? `${jobCard.vehicle.manufacturer} ${jobCard.vehicle.model}` : "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Registration No</p>
                <span className="inline-block mt-1 rounded border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                  {jobCard.vehicle?.registration_number || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
