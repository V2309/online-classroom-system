/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  transpilePackages: ["nextstepjs"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  images: {
    remotePatterns: [
      { hostname: "images.pexels.com" },
      { hostname: "ik.imagekit.io" },
      { hostname: "img.youtube.com" },
      { hostname: "i.ytimg.com" },
      { hostname: "www.google.com" },
      { hostname: "google.com" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "images.unsplash.com" },
      { hostname: "source.unsplash.com" },
      // Thêm pattern để hỗ trợ nhiều subdomain
      {
        protocol: "https",
        hostname: "**",
        pathname: "**",
      },
    ],
    domains: [
      "source.unsplash.com",
      "ik.imagekit.io",
      "img.youtube.com",
      "i.ytimg.com",
      "www.google.com",
      "google.com",
      "lh3.googleusercontent.com",
      "images.unsplash.com",
      // thêm các domain khác nếu cần
    ],
  },
  // Thêm config cho iframe YouTube embed
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
