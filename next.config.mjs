import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = withNextIntl({
  experimental: {
    reactCompiler: true,
  },
  async rewrites() {
    return [
      {
        source: "/:locale/:path*", // Matches dynamic locale and additional paths
        has: [
          {
            type: "host",
            value: "app.aistein.cz", // Matches only the app subdomain
          },
        ],
        destination: "/app/:locale/:path*", // Maps to the app folder dynamically
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "koreanconcept.cz",
        port: "",
      },
    ],
  },
});

export default nextConfig;
