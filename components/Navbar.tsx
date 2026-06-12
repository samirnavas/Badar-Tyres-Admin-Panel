"use client";

import { Search, RefreshCw, Bell } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6">
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search orders, clients, or vehicles..."
          className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-theme-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-theme-accent"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          title="Sync status: synced"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </button>

        <button className="relative rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-theme-accent" />
        </button>

        <div className="mx-1 h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-semibold text-gray-900">Badar Tyres</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Workshop Manager
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-accent text-sm font-semibold text-white">
            BT
          </span>
        </div>
      </div>
    </header>
  );
}
