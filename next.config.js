/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // 在構建時忽略 ESLint 錯誤（Vercel 構建時可能沒有 ESLint）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在構建時忽略 TypeScript 錯誤（可選）
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig

