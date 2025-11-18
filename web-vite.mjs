// web-vite.ts — Browser OTel for Vite (ESM)
// Defaults & naming rules match your Node tracing.js

import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes as S } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';

// ---- helpers / env ----
const viteEnv: any = (import.meta as any).env || {};

function env(k: string): string | undefined {
  // Accept both Vite envs (VITE_*) and raw names for window.__SECURENOW__
  const direct =
    viteEnv[k] ??
    viteEnv[k.toUpperCase()] ??
    viteEnv[k.toLowerCase()];
  if (direct != null) return String(direct);

  // Optionally support runtime overrides via window.__SECURENOW__
  const w = (globalThis as any).window as any;
  if (w && w.__SECURENOW__ && k in w.__SECURENOW__) return String(w.__SECURENOW__[k]);
  return undefined;
}

function parseHeaders(str?: string) {
  const out: Record<string, string> = {};
  if (!str) return out;
  String(str).split(',').forEach(raw => {
    const s = raw.trim();
    if (!s) return;
    const i = s.indexOf('=');
    if (i === -1) return;
    out[s.slice(0, i).trim().toLowerCase()] = s.slice(i + 1).trim();
  });
  return out;
}

// ---- endpoints (same defaults as tracing.js) ----
const endpointBase =
  (env('SECURENOW_INSTANCE') || env('OTEL_EXPORTER_OTLP_ENDPOINT') || 'http://46.62.173.237:4318')
    .replace(/\/$/, '');
const tracesUrl =
  env('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT') || `${endpointBase}/v1/traces`;
const headers = parseHeaders(env('OTEL_EXPORTER_OTLP_HEADERS'));

// ---- naming rules (mirrors tracing.js) ----
const rawBase = (env('OTEL_SERVICE_NAME') || env('SECURENOW_APPID') || '').trim().replace(/^['"]|['"]$/g, '');
const baseName = rawBase || null;
const noUuid = String(env('SECURENOW_NO_UUID')) === '1' || String(env('SECURENOW_NO_UUID')).toLowerCase() === 'true';
const strict = String(env('SECURENOW_STRICT')) === '1' || String(env('SECURENOW_STRICT')).toLowerCase() === 'true';

// Simple UUID v4 (no crypto dependency needed)
function uuidv4(): string {
  const rnd = (n = 16) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${rnd(8)}-${rnd(4)}-4${rnd(3)}-${((8 + Math.random()*4)|0).toString(16)}${rnd(3)}-${rnd(12)}`;
}

let serviceName: string;
if (baseName) {
  serviceName = noUuid ? baseName : `${baseName}-${uuidv4()}`;
} else {
  if (strict) {
    console.error('[securenow/web-vite] FATAL: SECURENOW_APPID/OTEL_SERVICE_NAME missing and SECURENOW_STRICT=1. Tracing disabled.');
    // Do not start tracing
    // @ts-expect-error
    window.__SECURENOW_DISABLED__ = true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _noop = true;
    // early return by throwing a no-op error caught below:
    throw new Error('__SECURENOW_NO_START__');
  }
  serviceName = `securenow-free-${uuidv4()}`;
}

const instancePrefix = baseName || 'securenow';
const serviceInstanceId = `${instancePrefix}-${uuidv4()}`;

// Loud line
try {
  // eslint-disable-next-line no-console
  console.log(
    '[securenow] web preload loaded SECURENOW_APPID=%s OTEL_SERVICE_NAME=%s SECURENOW_NO_UUID=%s SECURENOW_STRICT=%s → service.name=%s instance.id=%s',
    JSON.stringify(env('SECURENOW_APPID')),
    JSON.stringify(env('OTEL_SERVICE_NAME')),
    JSON.stringify(env('SECURENOW_NO_UUID')),
    JSON.stringify(env('SECURENOW_STRICT')),
    serviceName,
    serviceInstanceId
  );
} catch {}

// ---- Provider / Exporter ----
let started = false;

export function startSecurenowWeb() {
  if (started) return;
  started = true;

  const exporter = new OTLPTraceExporter({
    url: tracesUrl,
    headers,
  });

  const provider = new WebTracerProvider({
    resource: new Resource({
      [S.SERVICE_NAME]: serviceName,
      [S.SERVICE_INSTANCE_ID]: serviceInstanceId,
      [S.DEPLOYMENT_ENVIRONMENT]: viteEnv.MODE || 'production',
      [S.SERVICE_VERSION]: viteEnv.VITE_APP_VERSION || undefined,
    }),
  });

  provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  provider.register();

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new UserInteractionInstrumentation(),
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [/.*/],
        ignoreUrls: [/\/vite\/hmr/, /^chrome-extension:\/\//, /sockjs/],
      }),
      new XMLHttpRequestInstrumentation({
        propagateTraceHeaderCorsUrls: [/.*/],
      }),
    ],
  });

  // Optional smoke span (same flag name)
  if (String(env('SECURENOW_TEST_SPAN')) === '1') {
    const api = await import('@opentelemetry/api');
    const tracer = api.trace.getTracer('securenow-smoke');
    const span = tracer.startSpan('securenow.startup.smoke.web'); span.end();
  }

  // eslint-disable-next-line no-console
  console.log('[securenow] Web OTel started → %s', tracesUrl);
}

// Auto-start
try {
  startSecurenowWeb();
} catch (e: any) {
  if (String(e?.message) !== '__SECURENOW_NO_START__') {
    console.error('[securenow/web-vite] failed to start:', e);
  }
}

export default startSecurenowWeb;
