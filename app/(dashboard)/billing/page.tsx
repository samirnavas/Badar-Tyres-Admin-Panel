import { Construction } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-theme-accent-soft text-theme-accent">
        <Construction className="h-10 w-10" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
        Billing Module Under Construction
      </h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        This page has not been built yet. The billing and invoicing system will be implemented in a future update.
      </p>
    </div>
  );
}
