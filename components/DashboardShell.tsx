"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import type { NotificationItem } from "@/lib/repositories/vehicle_repository";

export function DashboardShell({ children, notifications = [] }: { children: React.ReactNode; notifications?: NotificationItem[] }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-canvas print:bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} unreadNotificationsCount={notifications.length} />
      <div className="lg:pl-64 print:pl-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
