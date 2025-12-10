/**
 * Next.js Instrumentation with SecureNow (JavaScript version)
 * 
 * Place this file at the root of your Next.js project as: instrumentation.js
 * (or in the src/ folder if you're using it)
 * 
 * For Next.js 14 and below, also add to next.config.js:
 *   experimental: { instrumentationHook: true }
 */

const { registerSecureNow } = require('securenow/nextjs');

export function register() {
  registerSecureNow();
}

/**
 * Configuration via Environment Variables (.env.local):
 * 
 * Required:
 *   SECURENOW_APPID=my-nextjs-app
 * 
 * Optional:
 *   SECURENOW_INSTANCE=http://your-signoz-server:4318
 *   SECURENOW_NO_UUID=1                    # Don't append UUID to service name
 *   OTEL_LOG_LEVEL=info                    # debug|info|warn|error
 *   SECURENOW_DISABLE_INSTRUMENTATIONS=fs  # Comma-separated list
 *   SECURENOW_TEST_SPAN=1                  # Create test span on startup
 */




