import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isProd ? repoName : "",
  assetPrefix: isProd ? repoName : "",
  allowedDevOrigins: ["192.168.45.29"],
};

export default nextConfig;
