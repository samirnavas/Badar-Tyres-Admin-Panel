"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus, ImageIcon } from "lucide-react";
import { getInspectionsByJobId } from "@/lib/repositories/inspection_repository";
import { getTechnicianById } from "@/lib/repositories/technician_repository";
import type { InspectionCondition, InspectionItem } from "@/lib/models/Inspection";
import { AddToEstimateModal } from "@/components/inspections/AddToEstimateModal";
import { cn, formatDate } from "@/lib/format";

const conditionStyles: Record<
  InspectionCondition,
  { badge: string; border: string }
> = {
  Green: {
    badge: "bg-green-100 text-green-700",
    border: "border-green-200",
  },
  Yellow: {
    badge: "bg-yellow-100 text-yellow-700",
    border: "border-yellow-200",
  },
  Red: {
    badge: "bg-red-100 text-red-700",
    border: "border-red-200",
  },
};

const reportStatusStyles: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Submitted: "bg-blue-50 text-blue-700",
  Reviewed: "bg-emerald-50 text-emerald-700",
};

function InspectionItemCard({
  item,
  onAddToEstimate,
}: {
  item: InspectionItem;
  onAddToEstimate: (item: InspectionItem) => void;
}) {
  const styles = conditionStyles[item.condition as InspectionCondition] || {
    badge: "bg-gray-100 text-gray-700",
    border: "border-gray-200",
  };
  const showUpsell =
    item.condition === "Yellow" || item.condition === "Red";

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm [color-scheme:light]",
        styles.border,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900">{item.system}</h4>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                styles.badge,
              )}
            >
              {item.condition}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            {item.notes}
          </p>
        </div>

        {showUpsell && (
          <button
            type="button"
            onClick={() => onAddToEstimate(item)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 transition-colors hover:border-theme-accent hover:text-theme-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            Add to Estimate
          </button>
        )}
      </div>

      {item.photoUrl && (
        <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
          <img
            src={item.photoUrl}
            alt={`${item.system} inspection photo`}
            className="h-40 w-full object-cover"
          />
        </div>
      )}

      {!item.photoUrl && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <ImageIcon className="h-3.5 w-3.5" />
          No photo attached
        </div>
      )}
    </div>
  );
}

export function InspectionReportPanel({ jobId }: { jobId: string }) {
  const [upsellItem, setUpsellItem] = useState<InspectionItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const inspectionsQuery = useQuery({
    queryKey: ["inspections", jobId],
    queryFn: () => getInspectionsByJobId(jobId),
  });

  const report = inspectionsQuery.data?.[0] ?? null;

  const technicianQuery = useQuery({
    queryKey: ["technician", report?.technicianId],
    queryFn: () => getTechnicianById(report!.technicianId),
    enabled: !!report?.technicianId,
  });

  const summary = useMemo(() => {
    if (!report) return null;
    return report.inspectionItems.reduce(
      (acc, item) => {
        acc[item.condition] += 1;
        return acc;
      },
      { Green: 0, Yellow: 0, Red: 0 },
    );
  }, [report]);

  const openUpsellModal = (item: InspectionItem) => {
    setUpsellItem(item);
    setModalOpen(true);
  };

  const closeUpsellModal = () => {
    setModalOpen(false);
    setUpsellItem(null);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm [color-scheme:light]">
        <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-theme-accent/10 text-theme-accent">
              <ClipboardList className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-semibold text-gray-900">Inspection Report</h2>
              <p className="text-xs text-gray-500">
                Digital vehicle inspection submitted by the technician
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {inspectionsQuery.isLoading && (
            <p className="text-sm text-gray-500">Loading inspection report...</p>
          )}

          {inspectionsQuery.isError && (
            <p className="text-sm font-medium text-theme-accent">
              Failed to load inspection report.
            </p>
          )}

          {!inspectionsQuery.isLoading &&
            !inspectionsQuery.isError &&
            !report && (
              <p className="text-sm text-gray-500">
                No inspection report has been submitted for this job yet.
              </p>
            )}

          {report && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Submitted {formatDate(report.createdAt)}
                  </p>
                  <p className="text-sm text-gray-700">
                    Technician:{" "}
                    <span className="font-medium text-gray-900">
                      {technicianQuery.data?.name ?? "Unknown"}
                    </span>
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    reportStatusStyles[report.status] ?? reportStatusStyles.Draft,
                  )}
                >
                  {report.status}
                </span>
              </div>

              {summary && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-center">
                    <p className="text-lg font-bold text-green-700">
                      {summary.Green}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700">
                      Green
                    </p>
                  </div>
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-center">
                    <p className="text-lg font-bold text-yellow-700">
                      {summary.Yellow}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-yellow-700">
                      Yellow
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center">
                    <p className="text-lg font-bold text-red-700">
                      {summary.Red}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">
                      Red
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {report.inspectionItems.map((item) => (
                  <InspectionItemCard
                    key={`${report.id}-${item.system}`}
                    item={item}
                    onAddToEstimate={openUpsellModal}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AddToEstimateModal
        open={modalOpen}
        onClose={closeUpsellModal}
        jobId={jobId}
        inspectionItem={upsellItem}
      />
    </>
  );
}
