/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@doce25/shared'],
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;

