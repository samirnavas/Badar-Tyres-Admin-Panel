"use client";

import React from "react";
import Image from "next/image";
import { AlertTriangle, Clock, RefreshCw, ShieldAlert, Wrench } from "lucide-react";

export function TemporarilyUnavailable() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Brand Bar */}
      <header className="flex items-center justify-between max-w-4xl mx-auto w-full pt-4">
        <div className="flex items-center space-x-3">
          <div className="relative h-11 w-11 rounded-xl overflow-hidden  flex items-center justify-center p-1">
            <Image
              src="/pwa/icon-512-v2.png"
              alt="Badar Tyres Logo"
              width={44}
              height={44}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="font-black tracking-tight text-xl text-gray-900 leading-tight">
              BADAR <span className="text-red-600">TYRES</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">Workshop Operations & Fleet Admin</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          Maintenance Mode
        </span>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center my-10">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sm:p-10 text-center relative overflow-hidden">
          {/* Subtle decorative background accent */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-red-50 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-50 rounded-full blur-2xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="relative mx-auto w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-inner mb-6">
            <AlertTriangle className="h-10 w-10 text-amber-600" />
            <div className="absolute -bottom-1 -right-1 bg-red-600 text-white p-1 rounded-full shadow">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>

          {/* Title & Message */}
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3">
            Temporarily Unavailable
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8">
            The Badar Tyres Admin Portal is temporarily paused for scheduled updates or maintenance.
            All services and operational panels will be restored shortly.
          </p>

          {/* Status Details Box */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 text-left space-y-2.5 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                <strong className="text-gray-700">Status:</strong> System temporarily paused
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                <strong className="text-gray-700">Scope:</strong> Admin Panel & Management Services
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRefresh}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors duration-200 shadow-lg shadow-red-600/25 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Check Status / Refresh
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4 max-w-4xl mx-auto w-full border-t border-gray-200/60">
        &copy; {new Date().getFullYear()} Badar Tyres. All rights reserved. Workshop Management System.
      </footer>
    </div>
  );
}
