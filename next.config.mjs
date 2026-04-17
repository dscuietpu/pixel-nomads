/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude heavy Prisma engine binaries that aren't needed at runtime
  // (Vercel auto-selects the correct one for its platform)
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@prisma/engines/**',
      'node_modules/prisma/build/**',
    ],
  },
};

export default nextConfig;
