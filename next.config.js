/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration for dynamic routes that can't be statically generated
  experimental: {
    serverComponentsExternalPackages: ['@node-rs/argon2'],
  },
  // Set output to export for compatibility with Vercel deployment
  output: 'standalone',
  // Route configuration for dynamic API routes
  async rewrites() {
    return {
      beforeFiles: [
        // Make all API routes dynamic to handle URL parameters
        {
          source: '/api/v1/:path*',
          destination: '/api/v1/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;
