/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", "api.dicebear.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
