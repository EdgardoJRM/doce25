/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@doce25/shared'],
  output: 'standalone',
  reactStrictMode: true,
};

module.exports = nextConfig;

