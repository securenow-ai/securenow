/**
 * Example Next.js configuration for SecureNow
 * 
 * This configuration suppresses OpenTelemetry instrumentation warnings
 */

const { getSecureNowWebpackConfig } = require('securenow/nextjs-webpack-config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15+ doesn't need this
  // For Next.js 14 and below, uncomment:
  // experimental: {
  //   instrumentationHook: true,
  // },
  
  // Suppress OpenTelemetry bundling warnings
  webpack: (config, options) => {
    return getSecureNowWebpackConfig(config, options);
  },
  
  // Optional: Tell Next.js not to bundle OpenTelemetry packages
  serverExternalPackages: [
    '@opentelemetry/sdk-node',
    '@opentelemetry/auto-instrumentations-node',
    '@opentelemetry/instrumentation',
  ],
};

module.exports = nextConfig;




