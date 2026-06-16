import { getExpiringNotifications } from "@/lib/repositories/vehicle_repository";
import Link from "next/link";
import { Bell } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const notifications = await getExpiringNotifications();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-theme-accent-soft text-theme-accent">
          <Bell className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-lg font-medium text-gray-900">No new notifications</p>
            <p className="mt-1 text-sm text-gray-500">You are all caught up!</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li key={notification.id} className="transition-colors hover:bg-gray-50">
                <Link
                  href={`/vehicles/${notification.vehicleId}`}
                  className="flex items-start justify-between gap-4 px-6 py-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-gray-900">
                        {notification.regNo}
                      </p>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {notification.type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {notification.customerName}
                      {notification.customerPhone && notification.customerPhone !== "N/A" 
                        ? ` • ${notification.customerPhone}` 
                        : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        notification.isExpired ? "text-red-600" : "text-amber-600"
                      }`}
                    >
                      {notification.isExpired ? "Expired" : "Expiring"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Due: {new Date(notification.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
