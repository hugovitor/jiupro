import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/schema": ["./supabase/schema.sql"],
    "/api/supabase/bootstrap": ["./supabase/schema.sql"],
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.localhost",
    "*.agent.cvm.dev",
    "*.cvm.dev",
  ],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
