import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product photos live on Vercel Blob in production (each store gets its
    // own random subdomain of blob.vercel-storage.com) — next/image refuses
    // to load from a host it doesn't know about, so it needs to be listed
    // explicitly here.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
