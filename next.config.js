/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration for dynamic routes that can't be statically generated
  experimental: {
    serverComponentsExternalPackages: ['@node-rs/argon2'],
  },
  // Basic configuration for Vercel compatibility
  distDir: '.next',
};

module.exports = nextConfig;
