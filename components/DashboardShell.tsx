"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { NotificationItem } from "@/lib/repositories/vehicle_repository";
import { cn } from "@/lib/format";

export function DashboardShell({ children, notifications = [] }: { children: React.ReactNode; notifications?: NotificationItem[] }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        unreadNotificationsCount={notifications.length}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div className={cn("print:pl-0 transition-[padding] duration-300 ease-in-out", isCollapsed ? "lg:pl-16" : "lg:pl-64")}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 print:p-0">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
