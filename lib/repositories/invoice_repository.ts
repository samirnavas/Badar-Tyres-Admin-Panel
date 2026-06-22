"use server";

import type {
  Invoice,
  InvoiceInput,
  RecordPaymentInput,
} from "../models/Invoice";
import { deriveInvoiceStatus } from "../models/Invoice";
import { assertNoError, firstOrNull } from "../database/helpers";
import {
  invoiceFromRow,
  invoiceToRow,
  jobFromRow,
  jobToRow,
  type InvoiceRow,
  type JobRow,
} from "../database/mappers";
import { generateId } from "../generateId";
import { supabase } from "../supabase";
import { simulateLatency } from "./delay";

class InvoiceRepository {
  async getInvoices(): Promise<Invoice[]> {
    await simulateLatency();
    const result = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
    const rows = assertNoError(result, "getInvoices") as InvoiceRow[];
    return (rows ?? []).map(invoiceFromRow);
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    await simulateLatency();
    const result = await supabase.from("invoices").select("*").eq("id", id).limit(1);
    const row = firstOrNull(assertNoError(result, "getInvoiceById") as InvoiceRow[]);
    return row ? invoiceFromRow(row) : null;
  }

  async getInvoicesByJobId(jobId: string): Promise<Invoice[]> {
    await simulateLatency();
    const result = await supabase
      .from("invoices")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });
    const rows = assertNoError(result, "getInvoicesByJobId") as InvoiceRow[];
    return (rows ?? []).map(invoiceFromRow);
  }

  async createInvoice(data: InvoiceInput): Promise<Invoice> {
    await simulateLatency();

    const now = new Date().toISOString();
    const invoice: Invoice = {
      ...data,
      status: deriveInvoiceStatus(data.amountPaid, data.total),
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const result = await supabase
      .from("invoices")
      .insert(invoiceToRow(invoice))
      .select("*")
      .single();
    const created = invoiceFromRow(assertNoError(result, "createInvoice") as InvoiceRow);

    if (created.status === "Paid") {
      await this.closeParentJob(created.jobId);
    }

    return created;
  }

  async updateInvoice(
    id: string,
    data: Partial<InvoiceInput>,
  ): Promise<Invoice> {
    await simulateLatency();

    const current = await this.getInvoiceById(id);
    if (!current) {
      throw new Error("Invoice not found");
    }

    const amountPaid = data.amountPaid ?? current.amountPaid;
    const total = data.total ?? current.total;

    const updatedInvoice: Invoice = {
      ...current,
      ...data,
      amountPaid,
      total,
      status: data.status ?? deriveInvoiceStatus(amountPaid, total),
      updatedAt: new Date().toISOString(),
    };

    const result = await supabase
      .from("invoices")
      .update(invoiceToRow(updatedInvoice))
      .eq("id", id)
      .select("*")
      .single();
    const saved = invoiceFromRow(assertNoError(result, "updateInvoice") as InvoiceRow);

    if (saved.status === "Paid") {
      await this.closeParentJob(saved.jobId);
    }

    return saved;
  }

  async recordPayment(
    id: string,
    payment: RecordPaymentInput,
  ): Promise<Invoice> {
    await simulateLatency();

    const current = await this.getInvoiceById(id);
    if (!current) {
      throw new Error("Invoice not found");
    }

    const updatedInvoice: Invoice = {
      ...current,
      amountPaid: payment.amountPaid,
      paymentMethod: payment.paymentMethod,
      status: deriveInvoiceStatus(payment.amountPaid, current.total),
      updatedAt: new Date().toISOString(),
    };

    const result = await supabase
      .from("invoices")
      .update(invoiceToRow(updatedInvoice))
      .eq("id", id)
      .select("*")
      .single();
    const saved = invoiceFromRow(assertNoError(result, "recordPayment") as InvoiceRow);

    if (saved.status === "Paid") {
      await this.closeParentJob(saved.jobId);
    }

    return saved;
  }

  async applyDiscount(
    id: string,
    discountAmount: number,
    discountType: "fixed" | "percentage",
  ): Promise<Invoice> {
    await simulateLatency();

    const current = await this.getInvoiceById(id);
    if (!current) {
      throw new Error("Invoice not found");
    }

    const jobResult = await supabase
      .from("jobs")
      .select("*")
      .eq("id", current.jobId)
      .limit(1)
      .single();
    const jobRow = assertNoError(jobResult, "applyDiscount") as JobRow;
    if (!jobRow) throw new Error("Job not found");

    const job = jobFromRow(jobRow);
    const originalTotal = job.total_amount;

    const discountValue =
      discountType === "percentage"
        ? originalTotal * (discountAmount / 100)
        : discountAmount;

    const newTotal = Math.max(0, originalTotal - discountValue);

    const updatedInvoice: Invoice = {
      ...current,
      discountAmount,
      discountType,
      tax: job.total_tax,
      total: newTotal,
      status: deriveInvoiceStatus(current.amountPaid, newTotal),
      updatedAt: new Date().toISOString(),
    };

    const result = await supabase
      .from("invoices")
      .update(invoiceToRow(updatedInvoice))
      .eq("id", id)
      .select("*")
      .single();
    const saved = invoiceFromRow(assertNoError(result, "applyDiscount") as InvoiceRow);

    if (saved.status === "Paid") {
      await this.closeParentJob(saved.jobId);
    }

    return saved;
  }

  async deleteInvoice(id: string): Promise<void> {
    await simulateLatency();
    const result = await supabase.from("invoices").delete().eq("id", id);
    assertNoError(result, "deleteInvoice");
  }

  async getOrCreateInvoiceForJob(jobId: string): Promise<Invoice | null> {
    const existing = await this.getInvoicesByJobId(jobId);
    if (existing.length > 0) {
      return existing[0];
    }

    const jobResult = await supabase.from("jobs").select("*").eq("id", jobId).limit(1).single();
    const jobRow = assertNoError(jobResult, "getOrCreateInvoiceForJob") as JobRow;
    if (!jobRow) return null;

    const job = jobFromRow(jobRow);

    return this.createInvoice({
      jobId: job.id,
      customerId: job.customer_id,
      subtotal: job.subtotal,
      tax: job.total_tax,
      total: job.total_amount,
      amountPaid: 0,
      status: "Unpaid",
      paymentMethod: null,
      discountAmount: 0,
      discountType: "fixed",
    });
  }

  private async closeParentJob(jobId: string): Promise<void> {
    const jobResult = await supabase.from("jobs").select("*").eq("id", jobId).limit(1).single();
    const jobRow = assertNoError(jobResult, "closeParentJob") as JobRow;
    if (!jobRow) return;

    const job = jobFromRow(jobRow);
    job.status = "Closed";
    job.updated_at = new Date().toISOString();

    const result = await supabase.from("jobs").update(jobToRow(job)).eq("id", jobId);
    assertNoError(result, "closeParentJob");
  }
}

const invoiceRepository = new InvoiceRepository();

export async function getInvoices(): Promise<Invoice[]> {
  return invoiceRepository.getInvoices();
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  return invoiceRepository.getInvoiceById(id);
}

export async function getInvoicesByJobId(jobId: string): Promise<Invoice[]> {
  return invoiceRepository.getInvoicesByJobId(jobId);
}

export async function createInvoice(data: InvoiceInput): Promise<Invoice> {
  return invoiceRepository.createInvoice(data);
}

export async function updateInvoice(
  id: string,
  data: Partial<InvoiceInput>,
): Promise<Invoice> {
  return invoiceRepository.updateInvoice(id, data);
}

export async function recordPayment(
  id: string,
  payment: RecordPaymentInput,
): Promise<Invoice> {
  return invoiceRepository.recordPayment(id, payment);
}

export async function deleteInvoice(id: string): Promise<void> {
  return invoiceRepository.deleteInvoice(id);
}

export async function getOrCreateInvoiceForJob(
  jobId: string,
): Promise<Invoice | null> {
  return invoiceRepository.getOrCreateInvoiceForJob(jobId);
}

export async function applyDiscount(
  id: string,
  discountAmount: number,
  discountType: "fixed" | "percentage",
): Promise<Invoice> {
  return invoiceRepository.applyDiscount(id, discountAmount, discountType);
}

export interface BillingMetrics {
  totalUnpaid: number;
  revenueToday: number;
  paidCount: number;
  partialCount: number;
}

export async function getBillingMetrics(): Promise<BillingMetrics> {
  await simulateLatency();
  const invoices = await invoiceRepository.getInvoices();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalUnpaid = 0;
  let revenueToday = 0;
  let paidCount = 0;
  let partialCount = 0;

  for (const invoice of invoices) {
    const outstanding = Math.max(0, invoice.total - invoice.amountPaid);
    if (invoice.status !== "Paid") {
      totalUnpaid += outstanding;
    }
    if (invoice.status === "Paid") paidCount += 1;
    if (invoice.status === "Partial") partialCount += 1;

    const updated = new Date(invoice.updatedAt);
    updated.setHours(0, 0, 0, 0);
    if (updated.getTime() === today.getTime() && invoice.amountPaid > 0) {
      revenueToday += invoice.amountPaid;
    }
  }

  return { totalUnpaid, revenueToday, paidCount, partialCount };
}
