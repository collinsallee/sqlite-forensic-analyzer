/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: '.next',
  reactStrictMode: true,
  // Disable image optimization (not needed for desktop app)
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig; 