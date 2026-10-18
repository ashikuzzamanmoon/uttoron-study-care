import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      { source: '/dashboard/students/:path*', destination: '/students/:path*' },
      { source: '/dashboard/students', destination: '/students' },
      { source: '/dashboard/teachers/:path*', destination: '/teachers/:path*' },
      { source: '/dashboard/teachers', destination: '/teachers' },
      { source: '/dashboard/batches/:path*', destination: '/batches/:path*' },
      { source: '/dashboard/batches', destination: '/batches' },
      { source: '/dashboard/routine/:path*', destination: '/routine/:path*' },
      { source: '/dashboard/routine', destination: '/routine' },
      { source: '/dashboard/attendance/:path*', destination: '/attendance/:path*' },
      { source: '/dashboard/attendance', destination: '/attendance' },
      { source: '/dashboard/exams/:path*', destination: '/exams/:path*' },
      { source: '/dashboard/exams', destination: '/exams' },
      { source: '/dashboard/results/:path*', destination: '/results/:path*' },
      { source: '/dashboard/results', destination: '/results' },
      { source: '/dashboard/accounts/:path*', destination: '/accounts/:path*' },
      { source: '/dashboard/accounts', destination: '/accounts' },
      { source: '/dashboard/sms/:path*', destination: '/sms/:path*' },
      { source: '/dashboard/sms', destination: '/sms' },
      { source: '/dashboard/notices/:path*', destination: '/notices/:path*' },
      { source: '/dashboard/notices', destination: '/notices' },
      { source: '/dashboard/reports/:path*', destination: '/reports/:path*' },
      { source: '/dashboard/reports', destination: '/reports' },
      { source: '/dashboard/settings/:path*', destination: '/settings/:path*' },
      { source: '/dashboard/settings', destination: '/settings' },
    ];
  },
};

export default nextConfig;
