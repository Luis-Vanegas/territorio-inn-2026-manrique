/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Las fotos de los portafolios viven en Vercel Blob, en un subdominio que
    // depende del store. Sin esta entrada, next/image rechaza la URL en runtime.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        pathname: '/portafolios/**',
      },
    ],
  },
};

export default nextConfig;
