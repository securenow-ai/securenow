/**
 * Next.js webpack configuration for SecureNow
 * 
 * Add this to your next.config.js to suppress OpenTelemetry instrumentation warnings
 * 
 * Usage:
 * const { getSecureNowWebpackConfig } = require('securenow/nextjs-webpack-config');
 * 
 * module.exports = {
 *   webpack: (config, options) => {
 *     return getSecureNowWebpackConfig(config, options);
 *   }
 * };
 */

function getSecureNowWebpackConfig(config, options) {
  const { isServer } = options;
  
  // Only apply to server-side builds
  if (isServer) {
    // Suppress warnings for OpenTelemetry instrumentations
    config.ignoreWarnings = config.ignoreWarnings || [];
    
    config.ignoreWarnings.push(
      // Ignore "Critical dependency" warnings from instrumentations
      {
        module: /@opentelemetry\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      // Ignore missing optional peer dependencies
      {
        module: /@opentelemetry/,
        message: /Module not found.*@opentelemetry\/winston-transport/,
      },
      {
        module: /@opentelemetry/,
        message: /Module not found.*@opentelemetry\/exporter-jaeger/,
      }
    );
    
    // Externalize problematic packages (don't bundle them)
    config.externals = config.externals || [];
    
    // Add OpenTelemetry packages as externals
    if (typeof config.externals === 'function') {
      const originalExternals = config.externals;
      config.externals = async (...args) => {
        const result = await originalExternals(...args);
        if (result) return result;
        
        const [context, request] = args;
        
        // Externalize OpenTelemetry instrumentation packages
        if (request.startsWith('@opentelemetry/')) {
          return `commonjs ${request}`;
        }
        
        return undefined;
      };
    } else if (Array.isArray(config.externals)) {
      config.externals.push(/@opentelemetry\//);
    } else {
      config.externals = [/@opentelemetry\//];
    }
  }
  
  return config;
}

module.exports = { getSecureNowWebpackConfig };




