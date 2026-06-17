import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout.trim() ||
  randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  additionalPrecacheEntries: [
    { url: "/~offline", revision },
    { url: "/login", revision },
    { url: "/dashboard", revision },
  ],
  globPublicPatterns: ["pwa/*.{png,svg,ico}"],
});

const nextConfig: NextConfig = {
  // Allow the dev server's client assets (HMR, JS chunks) to load when the
  // app is opened over the LAN IP. Without this, Next blocks cross-origin dev
  // resources, hydration fails, and forms fall back to native submission.
  allowedDevOrigins: ["10.25.163.209"],
  turbopack: {},
};

export default withSerwist(nextConfig);
