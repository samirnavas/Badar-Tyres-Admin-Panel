import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const APP_NAME = "Badar Tyres";
const APP_DEFAULT_TITLE = "Badar Tyres — Workshop Admin";
const APP_TITLE_TEMPLATE = "%s — Badar Tyres";
const APP_DESCRIPTION =
  "Workshop operations, job cards and fleet management for Badar Tyres.";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/pwa/icon-512-v2.png", sizes: "512x512", type: "image/png" },
      { url: "/pwa/icon-192-v2.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/pwa/icon-512-v2.png", sizes: "512x512", type: "image/png" }],
    shortcut: "/pwa/icon-512-v2.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

import { Toaster } from "sonner";
import { TemporarilyUnavailable } from "@/components/TemporarilyUnavailable";

// ============================================================================
// MAINTENANCE / PAUSE SWITCH:
// Set to `true` to pause the site and show "Temporarily Unavailable" on all pages.
// Set to `false` (or remove) whenever you want to restore normal website access.
// ============================================================================
const IS_TEMPORARILY_UNAVAILABLE = true;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isUnavailable =
    IS_TEMPORARILY_UNAVAILABLE ||
    process.env.NEXT_PUBLIC_TEMPORARILY_UNAVAILABLE === "true";

  return (
    <html lang="en" className={`${hankenGrotesk.variable}`}>
      <body className="min-h-full bg-canvas text-gray-900 antialiased">
        {isUnavailable ? (
          <TemporarilyUnavailable />
        ) : (
          <>
            <Providers>{children}</Providers>
            <Toaster position="bottom-right" richColors />
          </>
        )}
      </body>
    </html>
  );
}
