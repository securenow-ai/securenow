'use strict';

/**
 * SecureNow Next.js Integration using @vercel/otel
 * 
 * Usage in Next.js app:
 * 
 * 1. Create instrumentation.ts (or .js) in your project root:
 * 
 *    import { registerSecureNow } from 'securenow/nextjs';
 *    export function register() {
 *      registerSecureNow();
 *    }
 * 
 * 2. Set environment variables:
 *    SECURENOW_APPID=my-nextjs-app
 *    SECURENOW_INSTANCE=http://your-signoz-host:4318
 * 
 * That's it! 🎉 No webpack warnings!
 */

const { v4: uuidv4 } = require('uuid');

const env = k => process.env[k] ?? process.env[k.toUpperCase()] ?? process.env[k.toLowerCase()];

let isRegistered = false;

// Default sensitive fields to redact from request bodies
const DEFAULT_SENSITIVE_FIELDS = [
  'password', 'passwd', 'pwd', 'secret', 'token', 'api_key', 'apikey',
  'access_token', 'auth', 'credentials', 'mysql_pwd', 'stripeToken',
  'card', 'cardnumber', 'ccv', 'cvc', 'cvv', 'ssn', 'pin',
];

/**
 * Redact sensitive fields from an object
 */
function redactSensitiveData(obj, sensitiveFields = DEFAULT_SENSITIVE_FIELDS) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    
    // Check if field is sensitive
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      // Recursively redact nested objects
      redacted[key] = redactSensitiveData(redacted[key], sensitiveFields);
    }
  }
  
  return redacted;
}

/**
 * Redact sensitive data from GraphQL query strings
 */
function redactGraphQLQuery(query, sensitiveFields = DEFAULT_SENSITIVE_FIELDS) {
  if (!query || typeof query !== 'string') return query;
  
  let redacted = query;
  
  // Redact sensitive fields in GraphQL arguments and variables
  // Matches patterns like: password: "value" or password:"value" or password:'value'
  sensitiveFields.forEach(field => {
    // Match field: "value" or field: 'value' or field:"value" (with optional spaces)
    const patterns = [
      new RegExp(`(${field}\\s*:\\s*["'])([^"']+)(["'])`, 'gi'),
      new RegExp(`(${field}\\s*:\\s*)([^\\s,})\n]+)`, 'gi'),
    ];
    
    patterns.forEach(pattern => {
      redacted = redacted.replace(pattern, (match, prefix, value, suffix) => {
        if (suffix) {
          return `${prefix}[REDACTED]${suffix}`;
        } else {
          return `${prefix}[REDACTED]`;
        }
      });
    });
  });
  
  return redacted;
}

/**
 * Parse and capture request body safely
 */
async function captureRequestBody(request, maxSize = 10240) {
  try {
    const contentType = request.headers['content-type'] || '';
    let body = '';
    
    // Collect body chunks
    const chunks = [];
    let size = 0;
    
    return new Promise((resolve) => {
      request.on('data', (chunk) => {
        size += chunk.length;
        if (size <= maxSize) {
          chunks.push(chunk);
        }
      });
      
      request.on('end', () => {
        if (size > maxSize) {
          resolve({ 
            captured: false, 
            reason: `Body too large (${size} bytes > ${maxSize} bytes)`,
            size 
          });
          return;
        }
        
        body = Buffer.concat(chunks).toString('utf8');
        
        // Parse based on content type
        if (contentType.includes('application/json')) {
          try {
            const parsed = JSON.parse(body);
            resolve({ 
              captured: true, 
              type: 'json', 
              body: parsed,
              size 
            });
          } catch (e) {
            resolve({ 
              captured: true, 
              type: 'json', 
              body: body.substring(0, 1000),
              parseError: true,
              size 
            });
          }
        } else if (contentType.includes('application/graphql')) {
          // GraphQL queries need redaction too!
          resolve({ 
            captured: true, 
            type: 'graphql', 
            body: body,  // Will be redacted later
            size 
          });
        } else if (contentType.includes('multipart/form-data')) {
          // Multipart is NOT captured (files can be huge)
          resolve({ 
            captured: false, 
            type: 'multipart', 
            reason: 'Multipart data not captured (file uploads)',
            size 
          });
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          try {
            const params = new URLSearchParams(body);
            const parsed = Object.fromEntries(params);
            resolve({ 
              captured: true, 
              type: 'form', 
              body: parsed,
              size 
            });
          } catch (e) {
            resolve({ 
              captured: true, 
              type: 'form', 
              body: body.substring(0, 1000),
              size 
            });
          }
        } else {
          resolve({ 
            captured: true, 
            type: 'text', 
            body: body.substring(0, 1000),
            size 
          });
        }
      });
      
      request.on('error', () => {
        resolve({ captured: false, reason: 'Stream error' });
      });
      
      // Timeout after 100ms
      setTimeout(() => {
        resolve({ captured: false, reason: 'Timeout' });
      }, 100);
    });
  } catch (error) {
    return { captured: false, reason: error.message };
  }
}

/**
 * Register SecureNow OpenTelemetry for Next.js using @vercel/otel
 * @param {Object} options - Optional configuration
 * @param {string} options.serviceName - Service name (defaults to SECURENOW_APPID or OTEL_SERVICE_NAME)
 * @param {string} options.endpoint - Traces endpoint (defaults to SECURENOW_INSTANCE)
 * @param {boolean} options.noUuid - Don't append UUID to service name
 */
function registerSecureNow(options = {}) {
  // Only register once
  if (isRegistered) {
    console.log('[securenow] Already registered, skipping...');
    return;
  }

  // Skip for Edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('[securenow] Skipping Edge runtime (Node.js only)');
    return;
  }

  try {
    console.log('[securenow] Next.js integration loading (pid=%d)', process.pid);

    // -------- Configuration --------
    const rawBase = (
      options.serviceName || 
      env('OTEL_SERVICE_NAME') || 
      env('SECURENOW_APPID') || 
      ''
    ).trim().replace(/^['"]|['"]$/g, '');
    
    const baseName = rawBase || null;
    const noUuid = options.noUuid ?? (String(env('SECURENOW_NO_UUID')) === '1' || String(env('SECURENOW_NO_UUID')).toLowerCase() === 'true');

    // service.name
    let serviceName;
    if (baseName) {
      serviceName = noUuid ? baseName : `${baseName}-${uuidv4()}`;
    } else {
      serviceName = `nextjs-app-${uuidv4()}`;
      console.warn('[securenow] ⚠️  No SECURENOW_APPID or OTEL_SERVICE_NAME provided. Using fallback: %s', serviceName);
      console.warn('[securenow] 💡 Set SECURENOW_APPID=your-app-name in .env.local for better tracking');
    }

    // -------- Endpoint Configuration --------
    const endpointBase = (
      options.endpoint || 
      env('SECURENOW_INSTANCE') || 
      env('OTEL_EXPORTER_OTLP_ENDPOINT') || 
      'http://46.62.173.237:4318'
    ).replace(/\/$/, '');
    
    const tracesUrl = env('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT') || `${endpointBase}/v1/traces`;

    // Set environment variables for @vercel/otel to pick up
    process.env.OTEL_SERVICE_NAME = serviceName;
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = endpointBase;
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = tracesUrl;

    console.log('[securenow] 🚀 Next.js App → service.name=%s', serviceName);

    // -------- Body Capture Configuration --------
    const captureBody = String(env('SECURENOW_CAPTURE_BODY')) === '1' || 
                       String(env('SECURENOW_CAPTURE_BODY')).toLowerCase() === 'true' ||
                       options.captureBody === true;
    const maxBodySize = parseInt(env('SECURENOW_MAX_BODY_SIZE') || '10240'); // 10KB default
    const customSensitiveFields = (env('SECURENOW_SENSITIVE_FIELDS') || '').split(',').map(s => s.trim()).filter(Boolean);
    const allSensitiveFields = [...DEFAULT_SENSITIVE_FIELDS, ...customSensitiveFields];

    // -------- Use @vercel/otel with enhanced configuration --------
    const { registerOTel } = require('@vercel/otel');
    const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
    
    registerOTel({
      serviceName: serviceName,
      attributes: {
        'deployment.environment': env('NODE_ENV') || env('VERCEL_ENV') || 'development',
        'service.version': process.env.npm_package_version || process.env.VERCEL_GIT_COMMIT_SHA || undefined,
        'vercel.region': process.env.VERCEL_REGION || undefined,
      },
      instrumentations: [
        // Add HTTP instrumentation with request hooks to capture IP, headers
        // NOTE: Body capture is DISABLED at this level for Next.js to prevent conflicts
        new HttpInstrumentation({
          requireParentforOutgoingSpans: false,
          requireParentforIncomingSpans: false,
          // Ignore request/response bodies to prevent Next.js conflicts
          ignoreIncomingRequestHook: (request) => {
            // Never ignore - we want to trace all requests
            return false;
          },
          requestHook: (span, request) => {
            // SYNCHRONOUS ONLY - no async operations to avoid timing issues
            try {
              // Capture client IP from various headers
              const headers = request.headers || {};
              
              // Try different header sources for IP
              const clientIp = 
                headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                headers['x-real-ip'] ||
                headers['cf-connecting-ip'] || // Cloudflare
                headers['x-client-ip'] ||
                request.socket?.remoteAddress ||
                'unknown';
              
              // Add IP and request metadata to span (synchronously)
              span.setAttributes({
                'http.client_ip': clientIp,
                'http.user_agent': headers['user-agent'] || 'unknown',
                'http.referer': headers['referer'] || headers['referrer'] || '',
                'http.host': headers['host'] || '',
                'http.scheme': request.socket?.encrypted ? 'https' : 'http',
                'http.forwarded_for': headers['x-forwarded-for'] || '',
                'http.real_ip': headers['x-real-ip'] || '',
                'http.request_id': headers['x-request-id'] || headers['x-trace-id'] || '',
              });

              // Add geographic headers if available (Vercel/Cloudflare)
              if (headers['x-vercel-ip-country']) {
                span.setAttributes({
                  'http.geo.country': headers['x-vercel-ip-country'],
                  'http.geo.region': headers['x-vercel-ip-country-region'] || '',
                  'http.geo.city': headers['x-vercel-ip-city'] || '',
                });
              }
              
              if (headers['cf-ipcountry']) {
                span.setAttribute('http.geo.country', headers['cf-ipcountry']);
              }

              // -------- Request Body NOT captured at HTTP instrumentation level --------
              // IMPORTANT: Do NOT attempt to read request.body or listen to 'data' events
              // Next.js manages request streams internally and reading them here causes:
              // - "Response body object should not be disturbed or locked" errors
              // - Hanging requests that never complete
              // - Body data unavailable to Next.js route handlers
              //
              // Body capture must be done in Next.js middleware using request.clone()
              
            } catch (error) {
              // Silently fail to not break the request
              // Do not log in production to avoid noise
            }
          }
        }),
      ],
      instrumentationConfig: {
        fetch: {
          // Propagate context to your backend APIs
          propagateContextUrls: [
            /^https?:\/\/localhost/,
            /^https?:\/\/.*\.vercel\.app/,
            // Add your backend domains here
          ],
          // Optionally ignore certain URLs
          ignoreUrls: [
            /_next\/static/,
            /_next\/image/,
            /\.map$/,
          ],
          // Add resource name template for better span naming
          resourceNameTemplate: '{http.method} {http.target}',
        },
      },
    });

    isRegistered = true;
    console.log('[securenow] ✅ OpenTelemetry started for Next.js → %s', tracesUrl);
    console.log('[securenow] 📊 Auto-capturing: IP, User-Agent, Headers, Geographic data');
    console.log('[securenow] ⚠️  Body capture DISABLED at HTTP instrumentation level (prevents Next.js conflicts)');
    if (captureBody) {
      console.log('[securenow] 💡 SECURENOW_CAPTURE_BODY is set but has no effect in Next.js HTTP instrumentation');
      console.log('[securenow] 💡 Body capture must be implemented differently for Next.js (coming soon)');
    }

    // Optional test span
    if (String(env('SECURENOW_TEST_SPAN')) === '1') {
      const api = require('@opentelemetry/api');
      const tracer = api.trace.getTracer('securenow-nextjs');
      const span = tracer.startSpan('securenow.nextjs.startup');
      span.setAttribute('next.runtime', process.env.NEXT_RUNTIME || 'nodejs');
      span.end();
      console.log('[securenow] 🧪 Test span created');
    }

  } catch (error) {
    console.error('[securenow] Failed to initialize OpenTelemetry:', error);
    console.error('[securenow] Make sure you have @vercel/otel installed: npm install @vercel/otel');
  }
}

module.exports = {
  registerSecureNow,
};

