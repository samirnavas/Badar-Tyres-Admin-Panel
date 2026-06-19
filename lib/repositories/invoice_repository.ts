"use server";

import type {
  Invoice,
  InvoiceInput,
  InvoiceStatus,
  RecordPaymentInput,
} from "../models/Invoice";
import { deriveInvoiceStatus } from "../models/Invoice";
import type { JobCard } from "../models/JobCard";
import { readData, writeData } from "../db";
import { generateId } from "../generateId";
import { simulateLatency } from "./delay";

const FILE_NAME = "invoices.json";
const JOBS_FILE = "jobs.json";

class InvoiceRepository {
  async getInvoices(): Promise<Invoice[]> {
    await simulateLatency();
    return readData<Invoice[]>(FILE_NAME);
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    await simulateLatency();
    const invoices = await readData<Invoice[]>(FILE_NAME);
    return invoices.find((invoice) => invoice.id === id) ?? null;
  }

  async getInvoicesByJobId(jobId: string): Promise<Invoice[]> {
    await simulateLatency();
    const invoices = await readData<Invoice[]>(FILE_NAME);
    return invoices
      .filter((invoice) => invoice.jobId === jobId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
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

    const invoices = await readData<Invoice[]>(FILE_NAME);
    invoices.unshift(invoice);
    await writeData(FILE_NAME, invoices);

    if (invoice.status === "Paid") {
      await this.closeParentJob(invoice.jobId);
    }

    return invoice;
  }

  async updateInvoice(
    id: string,
    data: Partial<InvoiceInput>,
  ): Promise<Invoice> {
    await simulateLatency();

    const invoices = await readData<Invoice[]>(FILE_NAME);
    const index = invoices.findIndex((invoice) => invoice.id === id);
    if (index === -1) {
      throw new Error("Invoice not found");
    }

    const current = invoices[index];
    const amountPaid = data.amountPaid ?? current.amountPaid;
    const total = data.total ?? current.total;

    const updatedInvoice: Invoice = {
      ...current,
      ...data,
      amountPaid,
      total,
      status:
        data.status ?? deriveInvoiceStatus(amountPaid, total),
      updatedAt: new Date().toISOString(),
    };

    invoices[index] = updatedInvoice;
    await writeData(FILE_NAME, invoices);

    if (updatedInvoice.status === "Paid") {
      await this.closeParentJob(updatedInvoice.jobId);
    }

    return updatedInvoice;
  }

  async recordPayment(
    id: string,
    payment: RecordPaymentInput,
  ): Promise<Invoice> {
    await simulateLatency();

    const invoices = await readData<Invoice[]>(FILE_NAME);
    const index = invoices.findIndex((invoice) => invoice.id === id);
    if (index === -1) {
      throw new Error("Invoice not found");
    }

    const current = invoices[index];

    const updatedInvoice: Invoice = {
      ...current,
      amountPaid: payment.amountPaid,
      paymentMethod: payment.paymentMethod,
      status: deriveInvoiceStatus(payment.amountPaid, current.total),
      updatedAt: new Date().toISOString(),
    };

    invoices[index] = updatedInvoice;
    await writeData(FILE_NAME, invoices);

    if (updatedInvoice.status === "Paid") {
      await this.closeParentJob(updatedInvoice.jobId);
    }

    return updatedInvoice;
  }

  async applyDiscount(
    id: string,
    discountAmount: number,
    discountType: "fixed" | "percentage",
  ): Promise<Invoice> {
    await simulateLatency();

    const invoices = await readData<Invoice[]>(FILE_NAME);
    const index = invoices.findIndex((invoice) => invoice.id === id);
    if (index === -1) {
      throw new Error("Invoice not found");
    }

    const current = invoices[index];

    const jobs = await readData<JobCard[]>(JOBS_FILE);
    const job = jobs.find((j) => j.id === current.jobId);
    if (!job) throw new Error("Job not found");

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

    invoices[index] = updatedInvoice;
    await writeData(FILE_NAME, invoices);

    if (updatedInvoice.status === "Paid") {
      await this.closeParentJob(updatedInvoice.jobId);
    }

    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await simulateLatency();
    const invoices = await readData<Invoice[]>(FILE_NAME);
    await writeData(
      FILE_NAME,
      invoices.filter((invoice) => invoice.id !== id),
    );
  }

  async getOrCreateInvoiceForJob(jobId: string): Promise<Invoice | null> {
    const existing = await this.getInvoicesByJobId(jobId);
    if (existing.length > 0) {
      return existing[0];
    }

    const jobs = await readData<JobCard[]>(JOBS_FILE);
    const job = jobs.find((entry) => entry.id === jobId);
    if (!job) return null;

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
    const jobs = await readData<JobCard[]>(JOBS_FILE);
    const index = jobs.findIndex((job) => job.id === jobId);
    if (index === -1) return;

    jobs[index] = {
      ...jobs[index],
      status: "Closed",
      updated_at: new Date().toISOString(),
    };
    await writeData(JOBS_FILE, jobs);
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
  const invoices = await readData<Invoice[]>(FILE_NAME);

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
