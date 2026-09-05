import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/schema": ["./supabase/schema.sql"],
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.localhost",
    "*.agent.cvm.dev",
    "*.cvm.dev",
  ],
};

export default nextConfig;
