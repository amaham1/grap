/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

module.exports = {
  ...nextConfig,
  env: {
    NEXT_PUBLIC_BASE_PATH: ''
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'www.jeju.go.kr',
      },
      {
        protocol: 'https',
        hostname: 'www.jeju.go.kr',
      },
      {
        protocol: 'https',
        hostname: 'www.jejunolda.com',
      },
    ],
  },
};
