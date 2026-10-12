import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Object photos are served directly from the British Museum media server (CC BY-NC-SA 4.0).
    remotePatterns: [{ protocol: "https", hostname: "media.britishmuseum.org", pathname: "/media/**" }],
  },
  poweredByHeader: false,
};

export default nextConfig;
