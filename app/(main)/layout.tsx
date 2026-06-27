import { DashboardShell } from "@/components/DashboardShell";
import { AuthGuard } from "@/components/AuthGuard";
import { getExpiringNotifications } from "@/lib/repositories/vehicle_repository";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const notifications = await getExpiringNotifications();

  return (
    <AuthGuard>
      <DashboardShell notifications={notifications}>{children}</DashboardShell>
    </AuthGuard>
  );
}
