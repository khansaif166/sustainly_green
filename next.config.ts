import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "sustainlygreen.com" }],
        destination: "https://www.sustainlygreen.com/:path*",
        permanent: true,
      },
      {
        source: "/Green-lens",
        destination: "/green-lens",
        permanent: true,
      },
      {
        source: "/browse",
        has: [{ type: "query", key: "type", value: "Vendor" }],
        destination: "/browse?type=vendor",
        permanent: true,
      },
      {
        source: "/browse",
        has: [{ type: "query", key: "type", value: "Service" }],
        destination: "/browse?type=service",
        permanent: true,
      },
      {
        source: "/browse",
        has: [{ type: "query", key: "type", value: "Product" }],
        destination: "/browse?type=product",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
