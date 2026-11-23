import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  // sharp product photos up to 4K screens: modern formats, and a high-quality setting for the product shots
  images: { formats: ['image/avif', 'image/webp'], qualities: [75, 90] },
};

export default nextConfig;
