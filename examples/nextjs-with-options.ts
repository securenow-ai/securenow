/**
 * Next.js Instrumentation with SecureNow - Advanced Configuration
 * 
 * This example shows how to pass configuration options programmatically
 * instead of using environment variables.
 */

import { registerSecureNow } from 'securenow/nextjs';

export function register() {
  registerSecureNow({
    serviceName: 'my-nextjs-app',
    endpoint: 'http://your-signoz-server:4318',
    noUuid: false,
    disableInstrumentations: ['fs', 'dns'],
    headers: {
      'x-api-key': process.env.SECURENOW_API_KEY || '',
    },
  });
}

/**
 * You can still use environment variables alongside options.
 * Options take precedence over environment variables.
 * 
 * Mix and match as needed:
 *   - Use options for static config
 *   - Use env vars for secrets and per-environment config
 */




