/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  experimental: {
    serverComponentsExternalPackages: ["@huggingface/transformers"],
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
