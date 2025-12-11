/**
 * SecureNow Next.js Middleware for Body Capture
 * 
 * OPTIONAL: Import this in your Next.js app to enable automatic body capture
 * 
 * Usage:
 * 
 * Create middleware.ts in your Next.js app root:
 * 
 * export { middleware } from 'securenow/nextjs-middleware';
 * export const config = {
 *   matcher: '/api/:path*',  // Apply to API routes only
 * };
 * 
 * That's it! Bodies are now captured with sensitive data redacted.
 */

const { trace, context, SpanStatusCode } = require('@opentelemetry/api');

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
 * Redact sensitive data from GraphQL query strings
 */
function redactGraphQLQuery(query, sensitiveFields = DEFAULT_SENSITIVE_FIELDS) {
  if (!query || typeof query !== 'string') return query;
  
  let redacted = query;
  
  sensitiveFields.forEach(field => {
    const patterns = [
      new RegExp(`(${field}\\s*:\\s*["'])([^"']+)(["'])`, 'gi'),
      new RegExp(`(${field}\\s*:\\s*)([^\\s,})\n]+)`, 'gi'),
    ];
    
    patterns.forEach(pattern => {
      redacted = redacted.replace(pattern, (match, prefix, value, suffix) => {
        return suffix ? `${prefix}[REDACTED]${suffix}` : `${prefix}[REDACTED]`;
      });
    });
  });
  
  return redacted;
}

/**
 * Next.js Middleware for Body Capture
 */
async function middleware(request) {
  const { NextResponse } = require('next/server');
  
  // Only capture for POST/PUT/PATCH
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
    return NextResponse.next();
  }
  
  // Get or create a tracer
  const tracer = trace.getTracer('securenow-middleware');
  let span = trace.getActiveSpan();
  let createdSpan = false;
  
  // If no active span, create one for this middleware
  if (!span) {
    const url = new URL(request.url);
    span = tracer.startSpan(`middleware ${request.method} ${url.pathname}`);
    createdSpan = true;
  }
  
  try {
    const contentType = request.headers.get('content-type') || '';
    const maxBodySize = parseInt(process.env.SECURENOW_MAX_BODY_SIZE || '10240');
    const customSensitiveFields = (process.env.SECURENOW_SENSITIVE_FIELDS || '').split(',').map(s => s.trim()).filter(Boolean);
    const allSensitiveFields = [...DEFAULT_SENSITIVE_FIELDS, ...customSensitiveFields];
    
    // Only capture supported types
    if (contentType.includes('application/json') || 
        contentType.includes('application/graphql')) {
      
      // Clone the request to read body without consuming the original
      const clonedRequest = request.clone();
      const bodyText = await clonedRequest.text();
      
      if (bodyText.length <= maxBodySize) {
        let redactedBody;
        
        if (contentType.includes('application/graphql')) {
          // GraphQL: redact query string
          redactedBody = redactGraphQLQuery(bodyText, allSensitiveFields);
        } else {
          // JSON: parse and redact
          try {
            const parsed = JSON.parse(bodyText);
            const redacted = redactSensitiveData(parsed, allSensitiveFields);
            redactedBody = JSON.stringify(redacted);
          } catch (e) {
            redactedBody = bodyText; // Keep as-is if parse fails
          }
        }
        
        span.setAttributes({
          'http.request.body': redactedBody.substring(0, maxBodySize),
          'http.request.body.type': contentType.includes('graphql') ? 'graphql' : 'json',
          'http.request.body.size': bodyText.length,
        });
      } else {
        span.setAttribute('http.request.body', `[TOO LARGE: ${bodyText.length} bytes]`);
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const clonedRequest = request.clone();
      const formData = await clonedRequest.formData();
      const parsed = Object.fromEntries(formData);
      const redacted = redactSensitiveData(parsed, allSensitiveFields);
      
      span.setAttributes({
        'http.request.body': JSON.stringify(redacted).substring(0, maxBodySize),
        'http.request.body.type': 'form',
        'http.request.body.size': JSON.stringify(parsed).length,
      });
    } else if (contentType.includes('multipart/form-data')) {
      span.setAttribute('http.request.body', '[MULTIPART - NOT CAPTURED]');
      span.setAttribute('http.request.body.type', 'multipart');
    }
    
    // End span if we created it
    if (createdSpan) {
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    }
  } catch (error) {
    // Silently fail - don't break the request
    console.debug('[securenow] Body capture failed:', error.message);
    
    // End span with error if we created it
    if (createdSpan && span) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: error.message 
      });
      span.end();
    }
  }
  
  return NextResponse.next();
}

module.exports = {
  middleware,
  redactSensitiveData,
  redactGraphQLQuery,
  DEFAULT_SENSITIVE_FIELDS,
};

