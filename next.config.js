/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.offscreen = false;
    return config;
  },
};

module.exports = nextConfig;
