/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "landthumb-phinf.pstatic.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
