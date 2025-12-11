/**
 * SecureNow Next.js API Route Wrapper for Body Capture
 * 
 * This approach is NON-INVASIVE and runs INSIDE your handler,
 * so it never blocks or interferes with middleware or routing.
 * 
 * Usage:
 * 
 * import { withSecureNow } from 'securenow/nextjs-wrapper';
 * 
 * export const POST = withSecureNow(async (request) => {
 *   // Your handler code - request.body is available as parsed JSON
 *   const data = await request.json();
 *   return Response.json({ success: true });
 * });
 */

const { trace } = require('@opentelemetry/api');

// Default sensitive fields to redact
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
    
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key], sensitiveFields);
    }
  }
  
  return redacted;
}

/**
 * Capture body from Request object (clone to avoid consuming)
 */
async function captureRequestBody(request) {
  const captureBody = String(process.env.SECURENOW_CAPTURE_BODY) === '1' || 
                      String(process.env.SECURENOW_CAPTURE_BODY).toLowerCase() === 'true';
  
  if (!captureBody) return;
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) return;
  
  const span = trace.getActiveSpan();
  if (!span) return;
  
  try {
    const contentType = request.headers.get('content-type') || '';
    const maxBodySize = parseInt(process.env.SECURENOW_MAX_BODY_SIZE || '10240');
    const customSensitiveFields = (process.env.SECURENOW_SENSITIVE_FIELDS || '').split(',').map(s => s.trim()).filter(Boolean);
    const allSensitiveFields = [...DEFAULT_SENSITIVE_FIELDS, ...customSensitiveFields];
    
    // Only for supported types
    if (!contentType.includes('application/json') && 
        !contentType.includes('application/graphql') &&
        !contentType.includes('application/x-www-form-urlencoded')) {
      return;
    }
    
    // Clone to avoid consuming the original
    const cloned = request.clone();
    const bodyText = await cloned.text();
    
    if (bodyText.length > maxBodySize) {
      span.setAttribute('http.request.body', `[TOO LARGE: ${bodyText.length} bytes]`);
      span.setAttribute('http.request.body.size', bodyText.length);
      return;
    }
    
    // Parse and redact based on type
    let redacted;
    if (contentType.includes('application/json') || contentType.includes('application/graphql')) {
      try {
        const parsed = JSON.parse(bodyText);
        redacted = redactSensitiveData(parsed, allSensitiveFields);
        span.setAttributes({
          'http.request.body': JSON.stringify(redacted).substring(0, maxBodySize),
          'http.request.body.type': contentType.includes('graphql') ? 'graphql' : 'json',
          'http.request.body.size': bodyText.length,
        });
      } catch (e) {
        span.setAttribute('http.request.body', '[INVALID JSON]');
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(bodyText);
      const parsed = Object.fromEntries(params);
      redacted = redactSensitiveData(parsed, allSensitiveFields);
      span.setAttributes({
        'http.request.body': JSON.stringify(redacted).substring(0, maxBodySize),
        'http.request.body.type': 'form',
        'http.request.body.size': bodyText.length,
      });
    }
  } catch (error) {
    // Silently fail - never block the request
  }
}

/**
 * Wrap a Next.js API route handler to capture body
 * This is OPTIONAL and NON-INVASIVE - only use on routes where you want body capture
 */
function withSecureNow(handler) {
  return async function wrappedHandler(request, context) {
    // Capture body asynchronously (doesn't block handler)
    captureRequestBody(request).catch(() => {
      // Ignore errors silently
    });
    
    // Call original handler immediately - no blocking!
    return handler(request, context);
  };
}

/**
 * Alternative: Auto-capture wrapper that tries to capture AFTER handler runs
 * This is even safer as it never interferes with the handler logic
 */
function withSecureNowAsync(handler) {
  return async function wrappedHandler(request, context) {
    // Try to capture body in background (non-blocking)
    const capturePromise = captureRequestBody(request);
    
    // Run handler
    const response = await handler(request, context);
    
    // Wait for capture to finish (but don't fail if it doesn't)
    await capturePromise.catch(() => {});
    
    return response;
  };
}

module.exports = {
  withSecureNow,
  withSecureNowAsync,
  captureRequestBody,
  redactSensitiveData,
  DEFAULT_SENSITIVE_FIELDS,
};

