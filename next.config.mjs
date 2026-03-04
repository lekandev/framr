/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  turbopack: {
    resolveExtensions: ['.js', '.jsx', '.ts', '.tsx', '.wasm'],
  },
  experimental: {
    esmExternals: 'loose',
  },
};

export default nextConfig;
