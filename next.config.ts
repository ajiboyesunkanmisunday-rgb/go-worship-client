import type { NextConfig } from 'next';

/**
 * The events/attendance portal (Figma board 239:15681, role "Ministry Admin")
 * used to live at /group-leader/*. It moved to /ministry-admin/* so that
 * /group-leader could host the real Group Leader portal (board 396:31326).
 * These redirects keep the old links working.
 *
 * NOTE: only the paths that actually moved are redirected — dashboard,
 * profile, login and the index still exist under /group-leader.
 */
const MOVED_TO_MINISTRY_ADMIN = [
  'events',
  'events/create',
  'check-in',
  'attendance',
  'registrations',
];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Emit a self-contained server bundle (.next/standalone) for Docker/DigitalOcean.
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
  async redirects() {
    return [
      ...MOVED_TO_MINISTRY_ADMIN.map((path) => ({
        source: `/group-leader/${path}`,
        destination: `/ministry-admin/${path}`,
        permanent: false,
      })),
      // The design's System sidebar has no "Subscriptions" item — plan and
      // subscription management lives under Plans & Billing. The nav entry was
      // removed; this keeps any old /system/subscriptions link working.
      {
        source: '/system/subscriptions',
        destination: '/system/plans',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
