"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Warehouse,
  Wrench,
  CarFront,
  User,
  AlertTriangle,
  Edit2,
  Plus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { getBays, getJobCards } from "@/lib/repositories";
import { getTechnicians } from "@/lib/repositories/technician_repository";
import { getVehicles } from "@/lib/repositories";
import { normalizeJobStatus, getJobBayId, getJobTechnicianId } from "@/lib/models/JobCard";
import type { Bay } from "@/lib/models/Bay";
import { cn } from "@/lib/format";
import { BayFormModal } from "@/components/bays/BayFormModal";
import { toast } from "sonner";

const statusStyles: Record<
  Bay["status"],
  { card: string; badge: string; dot: string }
> = {
  Open: {
    card: "border-emerald-200 bg-emerald-50/80",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  Occupied: {
    card: "border-amber-200 bg-amber-50/80",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  Maintenance: {
    card: "border-gray-200 bg-gray-50",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
};

export default function BaysClient() {
  const baysQuery = useQuery({ queryKey: ["bays"], queryFn: getBays });
  const jobsQuery = useQuery({ queryKey: ["job-cards"], queryFn: getJobCards });
  const techniciansQuery = useQuery({
    queryKey: ["technicians"],
    queryFn: getTechnicians,
  });
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBay, setEditingBay] = useState<Bay | null>(null);

  const isLoading =
    baysQuery.isLoading ||
    jobsQuery.isLoading ||
    techniciansQuery.isLoading ||
    vehiclesQuery.isLoading;

  const bayCards = useMemo(() => {
    const technicianMap = new Map(
      (techniciansQuery.data ?? []).map((tech) => [tech.id, tech.name]),
    );
    const vehicleMap = new Map(
      (vehiclesQuery.data ?? []).map((vehicle) => [vehicle.id, vehicle]),
    );

    return (baysQuery.data ?? []).map((bay) => {
      const bayJobs = (jobsQuery.data ?? []).filter((job) => {
        return (
          getJobBayId(job) === bay.id &&
          (normalizeJobStatus(job.status) === "In Progress" ||
           normalizeJobStatus(job.status) === "Approved")
        );
      });

      // Active job is the one "In Progress", or the first in the sorted queue if none
      const activeJob =
        bayJobs.find((j) => normalizeJobStatus(j.status) === "In Progress") ||
        bayJobs.sort((a, b) => (a.queue_index ?? 0) - (b.queue_index ?? 0))[0];

      // Queued jobs are the remaining ones, sorted by queue_index
      const queuedJobs = bayJobs
        .filter((j) => j.id !== activeJob?.id)
        .sort((a, b) => (a.queue_index ?? 0) - (b.queue_index ?? 0))
        .map((job) => {
          const vehicle = vehicleMap.get(job.vehicle_id);
          const technicianName = technicianMap.get(getJobTechnicianId(job) ?? "") ?? "Unassigned";
          return {
            job,
            vehiclePlate: vehicle?.registration_number ?? null,
            technicianName,
          };
        });

      const vehicle = activeJob
        ? vehicleMap.get(activeJob.vehicle_id)
        : undefined;
      const technicianName = activeJob
        ? technicianMap.get(getJobTechnicianId(activeJob) ?? "") ?? "Unassigned"
        : null;

      return {
        bay,
        activeJob,
        queuedJobs,
        vehiclePlate: vehicle?.registration_number ?? null,
        technicianName,
      };
    });
  }, [baysQuery.data, jobsQuery.data, techniciansQuery.data, vehiclesQuery.data]);

  const openCount = bayCards.filter((item) => item.bay.status === "Open").length;
  const occupiedCount = bayCards.filter(
    (item) => item.bay.status === "Occupied",
  ).length;

  const openModal = (bay?: Bay) => {
    setEditingBay(bay ?? null);
    setModalOpen(true);
  };

  const queryClient = useQueryClient();

  const reorderMutation = useMutation({
    mutationFn: async (jobIds: string[]) => {
      const response = await fetch("/api/jobs/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds }),
      });
      if (!response.ok) throw new Error("Failed to reorder jobs");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-cards"] });
      toast.success("Job queue reordered successfully");
    },
    onError: (error) => toast.error(error.message || "Failed to reorder jobs"),
  });

  const handleReorder = (bayId: string, index: number, direction: "up" | "down") => {
    const bayData = bayCards.find((b) => b.bay.id === bayId);
    if (!bayData) return;

    const newQueue = [...bayData.queuedJobs];
    if (direction === "up" && index > 0) {
      const temp = newQueue[index - 1];
      newQueue[index - 1] = newQueue[index];
      newQueue[index] = temp;
    } else if (direction === "down" && index < newQueue.length - 1) {
      const temp = newQueue[index + 1];
      newQueue[index + 1] = newQueue[index];
      newQueue[index] = temp;
    } else {
      return;
    }

    // Extract just the job IDs in the new order
    const jobIds = newQueue.map((item) => item.job.id);
    
    // We optionally include the activeJob at the start if it exists?
    // Wait, the active job is always index 0 conceptually, but we can just update the queued ones.
    // However, if we just update the queued jobs' queue_index, that's fine. 
    // They will just get index 0, 1, 2... and activeJob will keep whatever or ignore it because it's always placed first.
    
    reorderMutation.mutate(jobIds);

    // Optimistically update the UI locally for snappy feel
    queryClient.setQueryData(["job-cards"], (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.map((job: any) => {
        const queueIndex = jobIds.indexOf(job.id);
        if (queueIndex !== -1) {
          return { ...job, queue_index: queueIndex };
        }
        return job;
      });
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Shop Floor
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Live bay availability and active workshop assignments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {openCount} Open
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-800">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {occupiedCount} Occupied
              </span>
            </div>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent-dark"
            >
              <Plus className="h-4 w-4" /> Add Bay
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-2xl border border-gray-200 bg-gray-100"
              />
            ))}
          </div>
        )}

        {!isLoading && baysQuery.isError && (
          <div className="rounded-xl border border-theme-accent/30 bg-theme-accent-soft px-5 py-8 text-center text-sm font-medium text-theme-accent">
            Failed to load shop floor data.
          </div>
        )}

        {!isLoading && !baysQuery.isError && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {bayCards.map(({ bay, activeJob, queuedJobs, vehiclePlate, technicianName }) => {
              const styles = statusStyles[bay.status];

              return (
                <div
                  key={bay.id}
                  className={cn(
                    "rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md flex flex-col",
                    styles.card,
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-gray-700 shadow-sm">
                        <Warehouse className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="font-semibold text-gray-900">{bay.name}</h2>
                        <span
                          className={cn(
                            "mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                            styles.badge,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
                          {bay.status}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openModal(bay)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/80 hover:text-gray-900"
                      aria-label={`Edit ${bay.name}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1">
                    {bay.status === "Open" && (
                      <div className="mt-5 rounded-xl border border-emerald-200/70 bg-white/70 px-4 py-3 text-sm text-emerald-700">
                        Ready for the next vehicle.
                      </div>
                    )}

                    {bay.status === "Maintenance" && (
                      <div className="mt-5 flex items-start gap-2 rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-600">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        Bay is temporarily unavailable for service.
                      </div>
                    )}

                    {bay.status === "Occupied" && (
                      <div className="mt-5 space-y-3 rounded-xl border border-amber-200/70 bg-white/80 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <CarFront className="h-4 w-4 text-amber-700" />
                          <span className="font-semibold uppercase tracking-wide text-gray-900">
                            {vehiclePlate ?? "Unknown plate"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4 text-amber-700" />
                          <span>{technicianName ?? "No technician assigned"}</span>
                        </div>
                        {activeJob ? (
                          <Link
                            href={`/jobs/${activeJob.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-theme-accent hover:text-theme-accent-dark hover:underline"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                            View active job #{activeJob.id.slice(0, 8).toUpperCase()}
                          </Link>
                        ) : (
                          <p className="text-xs text-amber-700">
                            Bay marked occupied but no in-progress job was found.
                          </p>
                        )}
                        
                        {queuedJobs.length > 0 && (
                          <div className="mt-4 border-t border-amber-200/50 pt-3">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                              Waiting in Queue ({queuedJobs.length})
                            </p>
                            <div className="space-y-2">
                              {queuedJobs.map((qJob, idx) => (
                                <div key={qJob.job.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 p-2 text-xs">
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-900">
                                      {qJob.vehiclePlate ?? "Unknown"} <span className="text-gray-500 font-normal">#{qJob.job.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div className="text-gray-600">{qJob.technicianName}</div>
                                  </div>
                                  <div className="flex flex-col items-center ml-2 border-l border-amber-200/50 pl-2">
                                    <button
                                      type="button"
                                      disabled={idx === 0 || reorderMutation.isPending}
                                      onClick={() => handleReorder(bay.id, idx, "up")}
                                      className="p-1 text-amber-700 hover:bg-amber-100 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    >
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === queuedJobs.length - 1 || reorderMutation.isPending}
                                      onClick={() => handleReorder(bay.id, idx, "down")}
                                      className="p-1 text-amber-700 hover:bg-amber-100 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    >
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BayFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        bay={editingBay}
      />
    </>
  );
}
