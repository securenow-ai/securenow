'use strict';

/**
 * Preload with: NODE_OPTIONS="-r securenow/register"
 *
 * Env:
 *   SECURENOW_APPID=logical-name              # or OTEL_SERVICE_NAME=logical-name
 *   SECURENOW_NO_UUID=1                       # one service.name across all workers
 *   SECURENOW_INSTANCE=http://host:4318       # OTLP/HTTP base (default http://46.62.173.237:4318)
 *   OTEL_EXPORTER_OTLP_ENDPOINT=...           # alternative base
 *   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=...    # full traces URL
 *   OTEL_EXPORTER_OTLP_HEADERS="k=v,k2=v2"
 *   SECURENOW_DISABLE_INSTRUMENTATIONS="pkg1,pkg2"
 *   OTEL_LOG_LEVEL=info|debug
 *   SECURENOW_TEST_SPAN=1
 *
 * Safety:
 *   SECURENOW_STRICT=1  -> if no appid/name is provided in cluster, exit(1) so PM2 restarts the worker
 */

const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { v4: uuidv4 } = require('uuid');

const env = k => process.env[k] ?? process.env[k.toUpperCase()] ?? process.env[k.toLowerCase()];
const parseHeaders = str => {
  const out = {}; if (!str) return out;
  for (const raw of String(str).split(',')) {
    const s = raw.trim(); if (!s) continue;
    const i = s.indexOf('='); if (i === -1) continue;
    out[s.slice(0, i).trim().toLowerCase()] = s.slice(i + 1).trim();
  }
  return out;
};

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
  
  // Redact sensitive fields in GraphQL arguments and variables
  sensitiveFields.forEach(field => {
    // Match patterns: field: "value" or field: 'value' or field:"value"
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

// -------- diagnostics --------
(() => {
  const L = (env('OTEL_LOG_LEVEL') || '').toLowerCase();
  const level = L === 'debug' ? DiagLogLevel.DEBUG :
                L === 'info'  ? DiagLogLevel.INFO  :
                L === 'warn'  ? DiagLogLevel.WARN  :
                L === 'error' ? DiagLogLevel.ERROR : DiagLogLevel.NONE;
  diag.setLogger(new DiagConsoleLogger(), level);
  console.log('[securenow] preload loaded pid=%d', process.pid);
})();

// -------- endpoints --------
const endpointBase = (env('SECURENOW_INSTANCE') || env('OTEL_EXPORTER_OTLP_ENDPOINT') || 'http://46.62.173.237:4318').replace(/\/$/, '');
const tracesUrl = env('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT') || `${endpointBase}/v1/traces`;
const headers = parseHeaders(env('OTEL_EXPORTER_OTLP_HEADERS'));

// -------- naming rules --------
const rawBase = (env('OTEL_SERVICE_NAME') || env('SECURENOW_APPID') || '').trim().replace(/^['"]|['"]$/g, '');
const baseName = rawBase || null;
const noUuid   = String(env('SECURENOW_NO_UUID')) === '1' || String(env('SECURENOW_NO_UUID')).toLowerCase() === 'true';
const strict   = String(env('SECURENOW_STRICT')) === '1' || String(env('SECURENOW_STRICT')).toLowerCase() === 'true';
const inPm2Cluster = !!(process.env.NODE_APP_INSTANCE || process.env.pm_id);

// Fail fast in cluster if base is missing (no more "free" names)
if (!baseName && inPm2Cluster && strict) {
  console.error('[securenow] FATAL: SECURENOW_APPID/OTEL_SERVICE_NAME missing in cluster (pid=%d). Exiting due to SECURENOW_STRICT=1.', process.pid);
  // small delay so the log flushes
  setTimeout(() => process.exit(1), 10);
}

// service.name
let serviceName;
if (baseName) {
  serviceName = noUuid ? baseName : `${baseName}-${uuidv4()}`;
} else {
  // last-resort fallback (only if STRlCT is off). You can rename this to make it obvious in monitoring.
  serviceName = `securenow-free-${uuidv4()}`;
}

// service.instance.id = <appid-or-fallback>-<uuid> (unique per worker)
const instancePrefix   = baseName || 'securenow';
const serviceInstanceId = `${instancePrefix}-${uuidv4()}`;

// Loud line per worker to prove what was used
console.log('[securenow] pid=%d SECURENOW_APPID=%s OTEL_SERVICE_NAME=%s SECURENOW_NO_UUID=%s SECURENOW_STRICT=%s → service.name=%s instance.id=%s',
  process.pid,
  JSON.stringify(env('SECURENOW_APPID')),
  JSON.stringify(env('OTEL_SERVICE_NAME')),
  JSON.stringify(env('SECURENOW_NO_UUID')),
  JSON.stringify(env('SECURENOW_STRICT')),
  serviceName,
  serviceInstanceId
);

// -------- instrumentations --------
const disabledMap = {};
for (const n of (env('SECURENOW_DISABLE_INSTRUMENTATIONS') || '').split(',').map(s => s.trim()).filter(Boolean)) {
  disabledMap[n] = { enabled: false };
}

// -------- Body Capture Configuration --------
const captureBody = String(env('SECURENOW_CAPTURE_BODY')) === '1' || String(env('SECURENOW_CAPTURE_BODY')).toLowerCase() === 'true';
const maxBodySize = parseInt(env('SECURENOW_MAX_BODY_SIZE') || '10240'); // 10KB default
const customSensitiveFields = (env('SECURENOW_SENSITIVE_FIELDS') || '').split(',').map(s => s.trim()).filter(Boolean);
const allSensitiveFields = [...DEFAULT_SENSITIVE_FIELDS, ...customSensitiveFields];

// Configure HTTP instrumentation with body capture
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const httpInstrumentation = new HttpInstrumentation({
  requestHook: (span, request) => {
    try {
      if (captureBody && request.method && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers['content-type'] || '';
        
        if (contentType.includes('application/json') || 
            contentType.includes('application/graphql') ||
            contentType.includes('application/x-www-form-urlencoded')) {
          
          let body = '';
          const chunks = [];
          let size = 0;
          
          request.on('data', (chunk) => {
            size += chunk.length;
            if (size <= maxBodySize) {
              chunks.push(chunk);
            }
          });
          
          request.on('end', () => {
            if (size <= maxBodySize && chunks.length > 0) {
              body = Buffer.concat(chunks).toString('utf8');
              
              try {
                let redacted;
                
                if (contentType.includes('application/graphql')) {
                  // GraphQL: redact query string
                  redacted = redactGraphQLQuery(body, allSensitiveFields);
                  span.setAttributes({
                    'http.request.body': redacted.substring(0, maxBodySize),
                    'http.request.body.type': 'graphql',
                    'http.request.body.size': size,
                  });
                } else if (contentType.includes('application/json')) {
                  // JSON: parse and redact object
                  const parsed = JSON.parse(body);
                  redacted = redactSensitiveData(parsed, allSensitiveFields);
                  span.setAttributes({
                    'http.request.body': JSON.stringify(redacted).substring(0, maxBodySize),
                    'http.request.body.type': 'json',
                    'http.request.body.size': size,
                  });
                } else if (contentType.includes('application/x-www-form-urlencoded')) {
                  // Form: parse and redact
                  const parsed = Object.fromEntries(new URLSearchParams(body));
                  redacted = redactSensitiveData(parsed, allSensitiveFields);
                  span.setAttributes({
                    'http.request.body': JSON.stringify(redacted).substring(0, maxBodySize),
                    'http.request.body.type': 'form',
                    'http.request.body.size': size,
                  });
                }
              } catch (e) {
                // Parse error: capture as-is (truncated)
                span.setAttribute('http.request.body', body.substring(0, 1000));
                span.setAttribute('http.request.body.parse_error', true);
              }
            } else if (size > maxBodySize) {
              span.setAttribute('http.request.body', `[TOO LARGE: ${size} bytes]`);
              span.setAttribute('http.request.body.size', size);
            }
          });
        } else if (contentType.includes('multipart/form-data')) {
          // Multipart is NOT captured
          span.setAttribute('http.request.body', '[MULTIPART - NOT CAPTURED]');
          span.setAttribute('http.request.body.type', 'multipart');
          span.setAttribute('http.request.body.note', 'File uploads not captured by design');
        }
      }
    } catch (error) {
      // Silently fail
    }
  },
});

// -------- SDK --------
const traceExporter = new OTLPTraceExporter({ url: tracesUrl, headers });
const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [
    httpInstrumentation,
    ...getNodeAutoInstrumentations({ 
      ...disabledMap,
      '@opentelemetry/instrumentation-http': { enabled: false }, // We use our custom one above
    }),
  ],
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: serviceInstanceId,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: env('NODE_ENV') || 'production',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || undefined,
  }),
});

// -------- start / shutdown (sync/async safe) --------
(async () => {
  try {
    await Promise.resolve(sdk.start?.());
    console.log('[securenow] OTel SDK started → %s', tracesUrl);
    if (captureBody) {
      console.log('[securenow] 📝 Request body capture: ENABLED (max: %d bytes, redacting %d sensitive fields)', maxBodySize, allSensitiveFields.length);
    }
    if (String(env('SECURENOW_TEST_SPAN')) === '1') {
      const api = require('@opentelemetry/api');
      const tracer = api.trace.getTracer('securenow-smoke');
      const span = tracer.startSpan('securenow.startup.smoke'); span.end();
    }
  } catch (e) {
    console.error('[securenow] OTel start failed:', e && e.stack || e);
  }
})();

async function safeShutdown(sig) {
  try { await Promise.resolve(sdk.shutdown?.()); console.log(`[securenow] Tracing terminated on ${sig}`); }
  catch (e) { console.error('[securenow] Tracing shutdown error:', e); }
  finally { process.exit(0); }
}
process.on('SIGINT',  () => safeShutdown('SIGINT'));
process.on('SIGTERM', () => safeShutdown('SIGTERM'));
