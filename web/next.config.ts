import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "tw-animate-css": path.join(
        __dirname,
        "node_modules/tw-animate-css/dist/tw-animate.css"
      ),
    },
  },
};

export default nextConfig;
