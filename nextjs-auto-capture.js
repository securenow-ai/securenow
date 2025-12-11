/**
 * SecureNow Next.js Automatic Body Capture
 * 
 * This module automatically patches Next.js request handling to capture bodies
 * WITHOUT requiring customers to wrap their handlers or change their code.
 * 
 * Usage in instrumentation.ts:
 * 
 * import { registerSecureNow } from 'securenow/nextjs';
 * import 'securenow/nextjs-auto-capture'; // Just import this line!
 * 
 * export function register() {
 *   registerSecureNow();
 * }
 * 
 * That's it! Bodies are now captured automatically.
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
 * Safe body capture that doesn't interfere with Next.js
 */
async function safeBodyCapture(request, span) {
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
    
    // Try to read from cache if available (Next.js may have already read it)
    let bodyText;
    
    // Attempt 1: Check if body was already cached by Next.js
    if (request._bodyText) {
      bodyText = request._bodyText;
    } else {
      // Attempt 2: Try to clone and read
      try {
        const cloned = request.clone();
        bodyText = await cloned.text();
        // Cache it for Next.js
        request._bodyText = bodyText;
      } catch (e) {
        // If clone fails, body was already consumed - skip silently
        return;
      }
    }
    
    if (bodyText.length > maxBodySize) {
      span.setAttribute('http.request.body', `[TOO LARGE: ${bodyText.length} bytes]`);
      return;
    }
    
    // Parse and redact
    if (contentType.includes('application/json') || contentType.includes('application/graphql')) {
      try {
        const parsed = JSON.parse(bodyText);
        const redacted = redactSensitiveData(parsed, allSensitiveFields);
        span.setAttributes({
          'http.request.body': JSON.stringify(redacted).substring(0, maxBodySize),
          'http.request.body.type': contentType.includes('graphql') ? 'graphql' : 'json',
          'http.request.body.size': bodyText.length,
        });
      } catch (e) {
        // Parse error - skip
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const params = new URLSearchParams(bodyText);
        const parsed = Object.fromEntries(params);
        const redacted = redactSensitiveData(parsed, allSensitiveFields);
        span.setAttributes({
          'http.request.body': JSON.stringify(redacted).substring(0, maxBodySize),
          'http.request.body.type': 'form',
          'http.request.body.size': bodyText.length,
        });
      } catch (e) {
        // Parse error - skip
      }
    }
  } catch (error) {
    // Silently fail - never break the request
  }
}

/**
 * Check if body capture is enabled
 */
function isBodyCaptureEnabled() {
  const enabled = String(process.env.SECURENOW_CAPTURE_BODY) === '1' || 
                  String(process.env.SECURENOW_CAPTURE_BODY).toLowerCase() === 'true';
  return enabled;
}

/**
 * Patch Next.js Request to cache body text
 * This allows us to read the body without consuming it
 */
function patchNextRequest() {
  if (typeof Request === 'undefined') return;
  
  const originalText = Request.prototype.text;
  const originalJson = Request.prototype.json;
  const originalFormData = Request.prototype.formData;
  
  // Patch text() to cache result
  Request.prototype.text = async function() {
    if (this._bodyText !== undefined) {
      return this._bodyText;
    }
    const text = await originalText.call(this);
    this._bodyText = text;
    
    // Capture for tracing if enabled
    if (isBodyCaptureEnabled() && ['POST', 'PUT', 'PATCH'].includes(this.method)) {
      const span = trace.getActiveSpan();
      if (span) {
        // Schedule capture after this call (non-blocking)
        setImmediate(() => {
          safeBodyCapture(this, span).catch(() => {});
        });
      }
    }
    
    return text;
  };
  
  // Patch json() to cache and capture
  Request.prototype.json = async function() {
    // First get text
    const text = await this.text();
    // Then parse
    return JSON.parse(text);
  };
  
  // Patch formData() to cache and capture  
  Request.prototype.formData = async function() {
    const text = await this.text();
    const params = new URLSearchParams(text);
    return params;
  };
  
  console.log('[securenow] ✅ Auto-capture: Patched Next.js Request for automatic body capture');
}

// Auto-patch when module is imported
if (isBodyCaptureEnabled()) {
  try {
    patchNextRequest();
    console.log('[securenow] 📝 Automatic body capture: ENABLED');
    console.log('[securenow] 💡 No code changes needed - bodies captured automatically!');
  } catch (error) {
    console.warn('[securenow] ⚠️  Auto-capture patch failed:', error.message);
    console.warn('[securenow] 💡 Body capture disabled. Use manual approach if needed.');
  }
} else {
  console.log('[securenow] 📝 Automatic body capture: DISABLED (set SECURENOW_CAPTURE_BODY=1 to enable)');
}

module.exports = {
  patchNextRequest,
  safeBodyCapture,
  redactSensitiveData,
  isBodyCaptureEnabled,
};

