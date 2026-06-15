export type JobCardStatus = "Draft" | "In Progress" | "Completed" | "Invoiced";

export interface JobCard {
  id: string;
  customer_id: string;
  vehicle_id: string;
  assigned_technician_id: string;
  status: JobCardStatus;
  service_item_ids: string[];
  subtotal: number;
  total_tax: number;
  total_amount: number;
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
