/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@doce25/shared'],
  reactStrictMode: true,
  // Removed 'standalone' output for Amplify compatibility
};

module.exports = nextConfig;

