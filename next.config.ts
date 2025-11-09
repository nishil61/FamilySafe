import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Security: Do not ignore build errors - they must be fixed
  typescript: {
    // ignoreBuildErrors: false (default), must fix TypeScript errors
  },
  eslint: {
    // ignoreDuringBuilds: false (default), must fix linting errors
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  turbopack: {
    resolveExtensions: [
      '.mdx',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
  },
};

export default nextConfig;
