import BillingClient from "./client";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  return (
    <div className="min-h-full rounded-3xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200/80 p-1">
      <div className="rounded-[1.35rem] p-4 sm:p-6">
        <BillingClient />
      </div>
    </div>
  );
}
