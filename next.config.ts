import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server's client assets (HMR, JS chunks) to load when the
  // app is opened over the LAN IP. Without this, Next blocks cross-origin dev
  // resources, hydration fails, and forms fall back to native submission.
  allowedDevOrigins: ["10.25.163.209"],
};

export default nextConfig;
