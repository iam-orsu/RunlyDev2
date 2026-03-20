/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for Docker (minimal node_modules copied)
  output: 'standalone',

  // Disable telemetry
  telemetry: false,

  // Allow API calls to backend service during SSR
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://api:4000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
