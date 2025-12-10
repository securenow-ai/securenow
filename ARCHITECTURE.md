# SecureNow Architecture

## Overview

SecureNow provides seamless OpenTelemetry instrumentation for Node.js and Next.js applications with minimal configuration.

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SecureNow Package                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ register.js │  │  tracing.js  │  │  nextjs.js   │       │
│  │ (Node.js    │  │  (Manual     │  │  (Next.js    │       │
│  │  Preload)   │  │   Setup)     │  │  Integration)│       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                   │
│                           ▼                                   │
│         ┌──────────────────────────────────┐                 │
│         │  OpenTelemetry Node SDK          │                 │
│         │  + Auto-Instrumentations         │                 │
│         └──────────────────────────────────┘                 │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────┐
         │   OTLP/HTTP Trace Exporter       │
         └──────────────────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────┐
         │   SigNoz / OpenTelemetry         │
         │   Collector                      │
         └──────────────────────────────────┘
```

---

## Entry Points

### 1. `register.js` - Node.js Preload (General Apps)

**Use Case:** Express, Fastify, NestJS, any Node.js app

**Usage:**
```bash
NODE_OPTIONS="-r securenow/register" node app.js
```

**How it works:**
- Loads before your application code
- Imports `tracing.js` to initialize OpenTelemetry
- Works with any Node.js framework

---

### 2. `nextjs.js` - Next.js Integration

**Use Case:** Next.js applications (App Router & Pages Router)

**Usage:**
```typescript
// instrumentation.ts
import { registerSecureNow } from 'securenow/nextjs';
export function register() { registerSecureNow(); }
```

**How it works:**
- Exports `registerSecureNow()` function
- Called by Next.js instrumentation hook
- Initializes OpenTelemetry SDK for Node.js runtime only
- Skips Edge runtime (not yet supported)

**Special features:**
- Detects Next.js environment variables (`VERCEL_ENV`, `VERCEL_REGION`)
- Uses `service.instance.id` for multi-worker deployments
- Disables noisy instrumentations (like `fs`) by default

---

### 3. `tracing.js` - Core Instrumentation

**Use Case:** Manual setup, or imported by other entry points

**Usage:**
```javascript
require('securenow/tracing');
```

**How it works:**
- Core OpenTelemetry setup
- Configures OTLP exporter
- Initializes `getNodeAutoInstrumentations()`
- Handles graceful shutdown

---

## Configuration Flow

```
Environment Variables
         │
         ├─► SECURENOW_APPID / OTEL_SERVICE_NAME
         │       └─► service.name
         │
         ├─► SECURENOW_INSTANCE / OTEL_EXPORTER_OTLP_ENDPOINT
         │       └─► Traces endpoint URL
         │
         ├─► OTEL_EXPORTER_OTLP_HEADERS
         │       └─► Authentication headers
         │
         ├─► SECURENOW_NO_UUID
         │       └─► Disable UUID suffix
         │
         └─► SECURENOW_DISABLE_INSTRUMENTATIONS
                 └─► Disable specific instrumentations
```

---

## Auto-Instrumentation

SecureNow uses `@opentelemetry/auto-instrumentations-node` which includes:

### Web Frameworks
- `@opentelemetry/instrumentation-express`
- `@opentelemetry/instrumentation-fastify`
- `@opentelemetry/instrumentation-nestjs-core`
- `@opentelemetry/instrumentation-koa`
- `@opentelemetry/instrumentation-hapi`

### Databases
- `@opentelemetry/instrumentation-pg` (PostgreSQL)
- `@opentelemetry/instrumentation-mysql`
- `@opentelemetry/instrumentation-mysql2`
- `@opentelemetry/instrumentation-mongodb`
- `@opentelemetry/instrumentation-redis`

### HTTP & Network
- `@opentelemetry/instrumentation-http`
- `@opentelemetry/instrumentation-https`
- `@opentelemetry/instrumentation-fetch`
- `@opentelemetry/instrumentation-grpc`
- `@opentelemetry/instrumentation-graphql`

### Other
- `@opentelemetry/instrumentation-dns`
- `@opentelemetry/instrumentation-net`
- `@opentelemetry/instrumentation-fs`
- And many more...

---

## Data Flow

```
Your Application
      │
      ├─► HTTP Request
      ├─► Database Query
      ├─► External API Call
      └─► Custom Operations
            │
            ▼
   ┌─────────────────┐
   │  Auto           │
   │  Instrumentations│
   └─────────────────┘
            │
            ▼
   ┌─────────────────┐
   │  OpenTelemetry  │
   │  SDK            │
   │  - Create Spans │
   │  - Add Attributes│
   │  - Sampling     │
   └─────────────────┘
            │
            ▼
   ┌─────────────────┐
   │  Batch Span     │
   │  Processor      │
   └─────────────────┘
            │
            ▼
   ┌─────────────────┐
   │  OTLP Trace     │
   │  Exporter       │
   │  (HTTP)         │
   └─────────────────┘
            │
            ▼
   ┌─────────────────┐
   │  SigNoz /       │
   │  OTLP Collector │
   └─────────────────┘
```

---

## Resource Attributes

Every span includes these resource attributes:

```javascript
{
  "service.name": "my-app-uuid",           // From SECURENOW_APPID
  "service.instance.id": "my-app-uuid",    // Unique per worker
  "deployment.environment": "production",   // From NODE_ENV
  "service.version": "1.0.0",              // From package.json
  
  // Next.js specific
  "next.runtime": "nodejs",                // Next.js runtime type
  "vercel.region": "iad1"                  // Vercel deployment region
}
```

---

## Span Lifecycle

```
1. Request arrives
         │
         ▼
2. Auto-instrumentation creates root span
         │
         ▼
3. Application code executes
   - Child spans created automatically
   - Database queries → spans
   - HTTP calls → spans
   - Framework operations → spans
         │
         ▼
4. Request completes
         │
         ▼
5. Spans end and are batched
         │
         ▼
6. Batch sent to collector via HTTP
         │
         ▼
7. Visible in SigNoz UI
```

---

## Shutdown Process

```
Signal (SIGTERM/SIGINT)
         │
         ▼
Shutdown handler triggered
         │
         ├─► Flush pending spans
         │
         ├─► Close exporter
         │
         └─► Exit process
```

---

## Next.js Specific Behavior

### Instrumentation Hook Flow

```
1. Next.js starts
         │
         ▼
2. Reads instrumentation.ts/js
         │
         ▼
3. Calls register() function
         │
         ▼
4. registerSecureNow() initializes
   - Checks runtime (skip if Edge)
   - Configures SDK
   - Starts instrumentation
         │
         ▼
5. Application code runs with tracing
```

### Runtime Detection

```javascript
if (process.env.NEXT_RUNTIME === 'edge') {
  // Skip Edge runtime (not supported)
  return;
}

// Continue with Node.js runtime
```

---

## Performance Considerations

### Sampling
- Default: All spans sampled (100%)
- Configurable via OpenTelemetry SDK

### Batching
- Spans batched before export
- Reduces network calls
- Configurable batch size

### Overhead
- Typical overhead: 1-5% CPU
- Memory: ~10-50MB depending on traffic
- Negligible latency impact

---

## Security

### API Key Handling
```bash
# Passed via headers
OTEL_EXPORTER_OTLP_HEADERS="x-api-key=secret"

# Never logged or exposed
# Sent directly to collector
```

### Network
- OTLP/HTTP uses standard HTTP(S)
- Supports TLS encryption
- Authentication via headers

---

## Troubleshooting

### Debug Mode

Enable verbose logging:
```bash
OTEL_LOG_LEVEL=debug
```

Output includes:
- SDK initialization
- Span creation
- Export attempts
- Errors

### Test Span

Create a test span on startup:
```bash
SECURENOW_TEST_SPAN=1
```

Verifies:
- SDK is initialized
- Tracer is working
- Configuration is correct

---

## Comparison Matrix

| Feature | register.js | nextjs.js | tracing.js |
|---------|-------------|-----------|------------|
| Node.js Apps | ✅ | ❌ | ✅ |
| Next.js | ❌ | ✅ | ❌ |
| Auto-preload | ✅ | ❌ | ❌ |
| Manual import | ❌ | ✅ | ✅ |
| Edge Runtime | ❌ | ⚠️ (skipped) | ❌ |
| PM2/Cluster | ✅ | ✅ | ✅ |

---

## Future Enhancements

- [ ] Edge Runtime support
- [ ] Browser instrumentation integration
- [ ] Metrics support (in addition to traces)
- [ ] Logs correlation
- [ ] Custom span decorators
- [ ] Configuration presets (development, production)

---

**For more details, see:**
- [NEXTJS-GUIDE.md](./NEXTJS-GUIDE.md) - Complete Next.js guide
- [README.md](./README.md) - General documentation




