import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [{ key: "Cache-Control", value: "no-cache" }],
            },
        ];
    },
};

export default nextConfig;
