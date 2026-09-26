/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Never reuse a client-cached copy of a dynamic page: stock levels change
    // on every operation, so navigating to Inventory/History must always show
    // the current store rather than a copy from up to 30s earlier.
    staleTimes: { dynamic: 0 },
  },
};

module.exports = nextConfig;
