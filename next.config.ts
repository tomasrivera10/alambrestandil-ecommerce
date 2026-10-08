import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@napi-rs/canvas", "tesseract.js", "pdfjs-dist", "exceljs", "mammoth"],
  // Prisma uses a custom generated client; include its native engine in Functions.
  outputFileTracingIncludes: {
    "/*": ["./src/generated/prisma/libquery_engine-*.so.node"],
    "/api/admin/supplier-lists": ["./node_modules/@tesseract.js-data/spa/4.0.0/spa.traineddata.gz"],
    "/api/admin/supplier-lists/chunks": ["./node_modules/@tesseract.js-data/spa/4.0.0/spa.traineddata.gz"],
  },
  async redirects() {
    return [{ source: "/soluciones/:path*", destination: "/instalaciones", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
          },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
            : []),
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
