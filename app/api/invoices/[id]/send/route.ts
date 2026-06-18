import { NextResponse } from "next/server";
import { getInvoiceById } from "@/lib/repositories/invoice_repository";
import { getJobCardById } from "@/lib/repositories";

interface SendReceiptResponse {
  success: boolean;
  message: string;
  recipient: string | null;
}

/**
 * POST /api/invoices/[id]/send
 *
 * Queues a receipt email for the given invoice. Currently mocked; structured
 * for future Supabase persistence + SMTP/transactional email provider wiring.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse<SendReceiptResponse | { error: string }>> {
  const { id } = await context.params;

  const invoice = await getInvoiceById(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const job = await getJobCardById(invoice.jobId);
  const recipient = job?.customer?.email?.trim() || null;

  // ---------------------------------------------------------------------------
  // Future Supabase + email provider integration (placeholder)
  // ---------------------------------------------------------------------------
  // const supabase = createServerClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // );
  //
  // await supabase.from("email_receipts").insert({
  //   invoice_id: invoice.id,
  //   job_id: invoice.jobId,
  //   customer_id: invoice.customerId,
  //   recipient_email: recipient,
  //   status: "queued",
  //   payload: { total: invoice.total, amountPaid: invoice.amountPaid },
  // });
  //
  // await emailProvider.send({
  //   to: recipient,
  //   subject: `Receipt — Invoice #${invoice.id.slice(0, 8).toUpperCase()}`,
  //   template: "invoice-receipt",
  //   data: { invoice, job, customer: job?.customer },
  // });
  // ---------------------------------------------------------------------------

  console.info("[email-receipt:mock]", {
    invoiceId: invoice.id,
    jobId: invoice.jobId,
    recipient,
    total: invoice.total,
    amountPaid: invoice.amountPaid,
    status: invoice.status,
  });

  return NextResponse.json({
    success: true,
    message: recipient
      ? `Receipt email queued for ${recipient}.`
      : "Receipt email queued (no customer email on file).",
    recipient,
  });
}
