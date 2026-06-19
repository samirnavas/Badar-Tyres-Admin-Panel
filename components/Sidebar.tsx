"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  Truck,
  Users,
  Settings,
  X,
  Wrench,
  Package,
  Warehouse,
  Receipt,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/format";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Services", href: "/services", icon: Wrench },
  // { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Job Cards", href: "/jobs", icon: FileText },
  { label: "Billing", href: "/billing", icon: Receipt },
  { label: "CRM", href: "/users", icon: Users },
  { label: "Vehicle Fleet Logs", href: "/vehicles", icon: Truck },
  { label: "Service Bay", href: "/bays", icon: Warehouse },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  open = false,
  onClose,
  unreadNotificationsCount = 0,
  isCollapsed = false,
  setIsCollapsed,
}: {
  open?: boolean;
  onClose?: () => void;
  unreadNotificationsCount?: number;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  const visibleNavItems = navItems.filter((item) => hasPermission(item.href));

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-gray-900/50 transition-opacity duration-300 ease-in-out lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-[transform,width] duration-300 ease-in-out lg:translate-x-0 print:hidden",
          open ? "translate-x-0" : "-translate-x-full",
          isCollapsed && "lg:w-16"
        )}
      >
        <div className={cn("flex items-center border-b border-gray-200 py-5", isCollapsed ? "px-6 lg:px-0 lg:justify-center" : "px-6")}>
          <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isCollapsed ? "lg:w-0 lg:opacity-0" : "lg:w-[150px] lg:opacity-100")}>
            <img src="/badar_logo_black.svg" alt="Badar Tyres Logo" className="h-8 w-auto shrink-0" />
          </div>
          
          {setIsCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "hidden lg:flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors",
                !isCollapsed && "ml-auto"
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {visibleNavItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isCollapsed && "lg:justify-center lg:px-0",
                  isActive
                    ? "bg-theme-accent-soft text-theme-accent"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                {isActive && (
                  <span className={cn("absolute right-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-theme-accent", isCollapsed && "lg:left-0 lg:right-auto")} />
                )}
                <Icon
                  className={cn("shrink-0", isCollapsed ? "h-5 w-5 lg:h-6 lg:w-6" : "h-5 w-5")}
                  strokeWidth={isActive ? 2.2 : 1.9}
                />
                <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out", isCollapsed ? "lg:max-w-0 lg:opacity-0" : "lg:max-w-[200px] lg:opacity-100")}>{label}</span>
                {label === "Notifications" && unreadNotificationsCount > 0 && (
                  <>
                    <span className={cn("ml-auto inline-flex items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out", isCollapsed ? "lg:max-w-0 lg:opacity-0 lg:px-0 lg:ml-0" : "lg:max-w-[40px] lg:opacity-100")}>
                      {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                    </span>
                    {isCollapsed && (
                      <span className="hidden lg:block absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>


      </aside>
    </>
  );
}
