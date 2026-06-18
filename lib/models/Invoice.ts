export const invoiceStatuses = ["Unpaid", "Partial", "Paid"] as const;
export type InvoiceStatus = (typeof invoiceStatuses)[number];

export const paymentMethods = ["Cash", "Card", "Bank Transfer"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export interface Invoice {
  id: string;
  jobId: string;
  customerId: string;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod | null;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceInput = Omit<Invoice, "id" | "createdAt" | "updatedAt">;

export type RecordPaymentInput = {
  amountPaid: number;
  paymentMethod: PaymentMethod;
};

export function deriveInvoiceStatus(
  amountPaid: number,
  total: number,
): InvoiceStatus {
  if (amountPaid <= 0) return "Unpaid";
  if (amountPaid >= total) return "Paid";
  return "Partial";
}
