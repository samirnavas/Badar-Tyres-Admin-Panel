"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  CarFront,
  CheckCircle2,
  FileText,
  ExternalLink,
  ClipboardCheck,
  Warehouse,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import {
  getJobCardById,
  updateJobStatus,
  updateJobAssignments,
  getBays,
  getJobCards,
} from "@/lib/repositories";
import { getTechnicians } from "@/lib/repositories/technician_repository";
import {
  getJobLineItems,
  getJobTechnicianId,
  getJobBayId,
  normalizeJobStatus,
} from "@/lib/models/JobCard";
import type { JobCardStatus } from "@/lib/models/JobCard";
import { formatCurrency, formatDate } from "@/lib/format";
import { InspectionReportPanel } from "@/components/inspections/InspectionReportPanel";

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

  const techniciansQuery = useQuery({
    queryKey: ["technicians"],
    queryFn: getTechnicians,
  });

  const baysQuery = useQuery({
    queryKey: ["bays"],
    queryFn: getBays,
  });

  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [selectedBayId, setSelectedBayId] = useState("");

  useEffect(() => {
    if (!jobCard) return;
    setSelectedTechnicianId(getJobTechnicianId(jobCard) ?? "");
    setSelectedBayId(getJobBayId(jobCard) ?? "");
  }, [jobCard]);

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: JobCardStatus) => updateJobStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobCard", id] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-cards"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["bays"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      router.refresh();
    },
  });

  const assignmentMutation = useMutation({
    mutationFn: (input: { technicianId?: string | null; bayId?: string | null }) =>
      updateJobAssignments(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobCard", id] });
      queryClient.invalidateQueries({ queryKey: ["job-cards"] });
      queryClient.invalidateQueries({ queryKey: ["bays"] });
      router.refresh();
    },
  });

  const technicianOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...(techniciansQuery.data ?? []).map((tech) => ({
        value: tech.id,
        label: tech.name,
      })),
    ],
    [techniciansQuery.data],
  );

  const jobsQuery = useQuery({
    queryKey: ["job-cards"],
    queryFn: getJobCards,
  });

  const bayOptions: ComboboxOption[] = useMemo(() => {
    const activeBays = (baysQuery.data ?? []).filter((b) => b.status !== "Maintenance");
    const jobs = jobsQuery.data ?? [];

    return [
      { value: "", label: "No bay assigned" },
      ...activeBays.map((bay) => {
        const queuedJobs = jobs.filter(
          (j) =>
            getJobBayId(j) === bay.id &&
            (normalizeJobStatus(j.status) === "In Progress" ||
              normalizeJobStatus(j.status) === "Approved")
        );
        const queueCount = queuedJobs.length;
        
        let hint: string = bay.status;
        if (queueCount > 0) {
          hint = `${queueCount} in queue`;
        }

        return {
          value: bay.id,
          label: bay.name,
          hint,
        };
      }),
    ];
  }, [baysQuery.data, jobsQuery.data]);

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

  const normalizedStatus = normalizeJobStatus(jobCard.status);
  const hasAssignmentChanges =
    selectedTechnicianId !== (getJobTechnicianId(jobCard) ?? "") ||
    selectedBayId !== (getJobBayId(jobCard) ?? "");

  let ActionBar = null;
  if (normalizedStatus === "Estimate") {
    ActionBar = (
      <button
        onClick={() => updateStatusMutation.mutate("Approved")}
        disabled={updateStatusMutation.isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark disabled:opacity-60"
      >
        <CheckCircle2 className="h-4 w-4" />
        {updateStatusMutation.isPending ? "Approving..." : "Approve Job"}
      </button>
    );
  } else if (normalizedStatus === "Approved") {
    ActionBar = (
      <button
        onClick={() => updateStatusMutation.mutate("In Progress")}
        disabled={updateStatusMutation.isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark disabled:opacity-60"
      >
        <CheckCircle2 className="h-4 w-4" />
        {updateStatusMutation.isPending ? "Starting..." : "Start Work"}
      </button>
    );
  } else if (normalizedStatus === "In Progress") {
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
  } else if (normalizedStatus === "Completed" || normalizedStatus === "Closed") {
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
          {updateStatusMutation.isError && (
            <p className="text-sm font-medium text-theme-accent">
              {(updateStatusMutation.error as Error)?.message ??
                "Failed to update job status."}
            </p>
          )}
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
                  {getJobLineItems(jobCard).length > 0 ? (
                    getJobLineItems(jobCard).map((item, index) => {
                      const gstRate = item.gst_rate ?? 18;
                      const tax = (item.total * gstRate) / 100;
                      const total = item.total + tax;
                      return (
                        <tr key={index} className="transition-colors hover:bg-gray-50">
                          <td className="px-5 py-4 font-medium text-gray-900">
                            {item.name}
                            {item.partId && (
                              <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                                Part
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="px-5 py-4 text-right text-gray-600">
                            ₹{formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-5 py-4 text-right text-gray-600">
                            ₹{formatCurrency(tax)}
                          </td>
                          <td className="px-5 py-4 text-right font-medium text-gray-900">
                            ₹{formatCurrency(total)}
                          </td>
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

          <InspectionReportPanel jobId={jobCard.id} />
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Assignment Panel */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Assignment Panel</h3>
                <p className="text-xs text-gray-500">
                  Assign a technician and bay before starting work.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Technician
                </label>
                <Combobox
                  options={technicianOptions}
                  value={selectedTechnicianId}
                  onChange={setSelectedTechnicianId}
                  placeholder={
                    techniciansQuery.isLoading
                      ? "Loading technicians..."
                      : "Select technician..."
                  }
                  disabled={techniciansQuery.isLoading}
                  emptyMessage="No technicians found"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Service Bay
                </label>
                <Combobox
                  options={bayOptions}
                  value={selectedBayId}
                  onChange={setSelectedBayId}
                  placeholder={
                    baysQuery.isLoading
                      ? "Loading bays..."
                      : "Select open bay..."
                  }
                  disabled={baysQuery.isLoading}
                  emptyMessage="No open bays available"
                />
              </div>

              {normalizedStatus === "Approved" && !selectedBayId && (
                <p className="text-xs font-medium text-amber-700">
                  Assign a bay before clicking Start Work.
                </p>
              )}

              {assignmentMutation.isError && (
                <p className="text-xs font-medium text-theme-accent">
                  {(assignmentMutation.error as Error)?.message ??
                    "Failed to save assignments."}
                </p>
              )}

              <button
                type="button"
                disabled={assignmentMutation.isPending || !hasAssignmentChanges}
                onClick={() =>
                  assignmentMutation.mutate({
                    technicianId: selectedTechnicianId || null,
                    bayId: selectedBayId || null,
                  })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark disabled:opacity-60"
              >
                {assignmentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Warehouse className="h-4 w-4" />
                    Save Assignments
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Customer Details */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900">Customer Details</h3>
              </div>
              {jobCard.customer_id && (
                <Link href={`/users/${jobCard.customer_id}`} className="flex items-center gap-1 text-xs font-semibold text-theme-accent hover:text-theme-accent-dark hover:underline">
                  Profile <ExternalLink className="h-3 w-3" />
                </Link>
              )}
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <CarFront className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900">Vehicle Details</h3>
              </div>
              {jobCard.vehicle_id && (
                <Link href={`/vehicles/${jobCard.vehicle_id}`} className="flex items-center gap-1 text-xs font-semibold text-theme-accent hover:text-theme-accent-dark hover:underline">
                  Profile <ExternalLink className="h-3 w-3" />
                </Link>
              )}
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
