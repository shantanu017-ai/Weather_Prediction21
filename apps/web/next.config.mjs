/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // For Leaflet dynamic map re-renders
  transpilePackages: ["@gp01/shared"],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  }
};

export default nextConfig;
