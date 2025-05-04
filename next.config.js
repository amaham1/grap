/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

module.exports = {
  ...nextConfig,
  basePath: '/alljeju',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/alljeju'
  }
};
