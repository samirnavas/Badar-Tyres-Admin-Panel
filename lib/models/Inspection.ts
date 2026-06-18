export const inspectionReportStatuses = [
  "Draft",
  "Submitted",
  "Reviewed",
] as const;
export type InspectionReportStatus = (typeof inspectionReportStatuses)[number];

export const inspectionConditions = ["Green", "Yellow", "Red"] as const;
export type InspectionCondition = (typeof inspectionConditions)[number];

export interface InspectionItem {
  system: string;
  condition: InspectionCondition;
  notes: string;
  photoUrl: string | null;
}

export interface InspectionReport {
  id: string;
  jobId: string;
  technicianId: string;
  vehicleId: string;
  createdAt: string;
  status: InspectionReportStatus;
  inspectionItems: InspectionItem[];
}

export type InspectionReportInput = Omit<InspectionReport, "id" | "createdAt">;
