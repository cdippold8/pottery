import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js's default Server Action request body limit (1MB) is too small
  // for photo uploads — a single phone photo alone can exceed it, and the
  // "Add new product" flow submits several images in one request. Raised
  // to accommodate multiple full-resolution photos per submission.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
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
