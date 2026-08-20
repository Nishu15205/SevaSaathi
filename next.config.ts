import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "https://preview-chat-52d7afce-a3e7-46cf-b0dc-d357e8bd9c4b.space-z.ai",
  ],
};

export default nextConfig;
