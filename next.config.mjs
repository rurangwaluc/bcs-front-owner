/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://sgs-api-prod.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;
