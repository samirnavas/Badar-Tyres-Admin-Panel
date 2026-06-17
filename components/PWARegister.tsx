"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWARegister() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration can fail on unsupported origins (e.g. non-HTTPS).
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean }).standalone);

    if (standalone) {
      setInstalled(true);
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setInstallEvent(null);
  };

  if (installed || !visible || !installEvent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:left-auto sm:right-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-theme-accent-soft text-theme-accent">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Install Badar Tyres</p>
          <p className="mt-1 text-xs text-gray-500">
            Add the workshop admin app to your home screen for quick access and
            saved login.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-theme-accent-dark"
            >
              Install app
            </button>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
