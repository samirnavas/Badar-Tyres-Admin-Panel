export type JobCardStatus =
  | "Estimate"
  | "Approved"
  | "In Progress"
  | "Completed"
  | "Closed"
  | "Cancelled";

export interface JobCardLineItem {
  serviceId?: string;
  partId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  gst_rate?: number;
}

/** @deprecated Legacy line-item shape — use JobCardLineItem instead. */
export interface JobCardServiceItem {
  service_id: string;
  name: string;
  qty: number;
  rate: number;
}

export interface JobCard {
  id: string;
  customer_id: string;
  vehicle_id: string;
  technicianId: string | null;
  bayId: string | null;
  status: JobCardStatus;
  line_items: JobCardLineItem[];
  /** @deprecated Legacy field — prefer technicianId. */
  assigned_technician_id?: string;
  /** @deprecated Legacy field — prefer line_items. */
  service_item_ids?: string[];
  /** @deprecated Legacy field — prefer line_items. */
  service_items?: JobCardServiceItem[];
  subtotal: number;
  total_tax: number;
  total_amount: number;
  queue_index?: number;
  /** ISO date string for when the warranty expires, or null if none. */
  warranty_end_date: string | null;
  /** Free-text warranty details (e.g. "6 months on wheel alignment"), or null. */
  warranty_notes: string | null;
  /**
   * References User.id of the admin/agent who created this record.
   * Required for verification and security audit trails.
   */
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Maps legacy persisted statuses to the current pipeline enum. */
export function normalizeJobStatus(status: string): JobCardStatus {
  switch (status) {
    case "Draft":
      return "Estimate";
    case "Invoiced":
      return "Completed";
    case "Estimate":
    case "Approved":
    case "In Progress":
    case "Completed":
    case "Closed":
    case "Cancelled":
      return status;
    default:
      return "Estimate";
  }
}

/** Returns line items from a job, falling back to legacy service_items data. */
export function getJobLineItems(job: JobCard): JobCardLineItem[] {
  if (job.line_items?.length) {
    return job.line_items;
  }

  if (job.service_items?.length) {
    return job.service_items.map((item) => ({
      serviceId: item.service_id,
      name: item.name,
      quantity: item.qty,
      unitPrice: item.rate,
      total: item.qty * item.rate,
    }));
  }

  if (job.service_item_ids?.length) {
    return job.service_item_ids.map((serviceId) => ({
      serviceId,
      name: "Service",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }));
  }

  return [];
}

export function getJobPrimaryLineLabel(job: JobCard): string {
  return getJobLineItems(job)[0]?.name ?? "—";
}

export function getJobTechnicianId(job: JobCard): string | null {
  return job.technicianId ?? job.assigned_technician_id ?? null;
}

export function getJobBayId(job: JobCard): string | null {
  return job.bayId ?? null;
}
