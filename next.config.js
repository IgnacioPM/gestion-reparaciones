/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'akwlewopqltxcgrmyfvu.supabase.co', // ❌ sin "https://"
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
