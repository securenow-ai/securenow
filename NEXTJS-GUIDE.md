# SecureNow for Next.js - Complete Integration Guide

Send traces and logs from your Next.js app to SigNoz (or any OpenTelemetry-compatible backend) in under 2 minutes.

## 🚀 Quick Start (2 Simple Steps!)

### Step 1: Install SecureNow

```bash
npm install securenow
# or
yarn add securenow
# or
pnpm add securenow
```

**🎉 The installer will automatically:**
- Detect your Next.js project
- Offer to create `instrumentation.ts` (or `.js`)
- Create `.env.local` template
- **Zero webpack warnings** (uses @vercel/otel under the hood)

**Just answer "Y" when prompted!**

### Step 2: Configure Environment Variables

Edit the `.env.local` file that was created:

```bash
# Required: Your app name (shows up in SigNoz)
SECURENOW_APPID=my-nextjs-app

# Required: Your SigNoz server endpoint
SECURENOW_INSTANCE=http://your-signoz-server:4318

# Optional: API key for authentication
OTEL_EXPORTER_OTLP_HEADERS="x-api-key=your-api-key-here"
```

### That's It! 🎉

**No webpack warnings!** SecureNow uses `@vercel/otel` under the hood, which is specifically designed for Next.js and handles all the bundling correctly.

---

## 🔧 Alternative Setup Methods

### If You Skipped Auto-Setup

**Option 1: Use the CLI (Recommended)**

```bash
npx securenow init
```

**Option 2: Create Manually**

Create `instrumentation.ts` at the **root** of your Next.js project (or inside `src/`):

```typescript
// instrumentation.ts
import { registerSecureNow } from 'securenow/nextjs';

export function register() {
  registerSecureNow();
}
```

**JavaScript version:**
```javascript
// instrumentation.js
const { registerSecureNow } = require('securenow/nextjs');

export function register() {
  registerSecureNow();
}
```

See [AUTO-SETUP.md](./AUTO-SETUP.md) for detailed setup options.

---

## ▶️ Run Your App

Run your Next.js app:

```bash
npm run dev
# or
npm run build && npm start
```

You should see:
```
[securenow] Next.js integration loading
[securenow] 🚀 Next.js App → service.name=my-nextjs-app-xxx
[securenow] ✅ OpenTelemetry started for Next.js → http://...
```

---

## 📊 What Gets Automatically Captured?

SecureNow automatically captures comprehensive request data:

### 🌐 User Information (Automatic!)
- **IP Address** - From x-forwarded-for, x-real-ip, etc.
- **User Agent** - Browser and device info
- **Referer** - Where users came from
- **Geographic Data** - Country, region, city (Vercel/Cloudflare)
- **Request Metadata** - Headers, host, scheme
- **Response Data** - Status codes, timing

See [AUTOMATIC-IP-CAPTURE.md](./AUTOMATIC-IP-CAPTURE.md) for full details.

### 📝 Request Body Capture (Optional!)
- **JSON Bodies** - API payloads with sensitive fields redacted
- **GraphQL Queries** - Full query capture
- **Form Data** - Form submissions
- **Auto-Redaction** - Passwords, tokens, cards automatically hidden

Enable with: `SECURENOW_CAPTURE_BODY=1`

See [REQUEST-BODY-CAPTURE.md](./REQUEST-BODY-CAPTURE.md) for full details.

### Next.js Built-in Spans
- ✅ HTTP requests (`[http.method] [next.route]`)
- ✅ API routes execution
- ✅ Page rendering (App Router & Pages Router)
- ✅ `getServerSideProps` / `getStaticProps`
- ✅ Metadata generation
- ✅ Server component loading
- ✅ TTFB (Time to First Byte)

### Backend Calls
- ✅ HTTP/HTTPS requests (via `fetch`, `axios`, `node-fetch`, etc.)
- ✅ Database queries:
  - PostgreSQL
  - MySQL / MySQL2
  - MongoDB
  - Redis
- ✅ GraphQL queries
- ✅ Other Node.js libraries

---

## ⚙️ Advanced Configuration

### Option 1: Environment Variables (Recommended)

```bash
# .env.local

# Required
SECURENOW_APPID=my-nextjs-app

# Optional Configuration
SECURENOW_INSTANCE=http://your-signoz-server:4318
SECURENOW_NO_UUID=1                         # Don't append UUID (useful for dev)
OTEL_LOG_LEVEL=info                         # debug|info|warn|error
SECURENOW_DISABLE_INSTRUMENTATIONS=fs,dns   # Disable specific instrumentations
SECURENOW_TEST_SPAN=1                       # Create test span on startup

# Authentication
OTEL_EXPORTER_OTLP_HEADERS="x-api-key=your-key,authorization=Bearer token"

# Alternative endpoint configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://...      # Base endpoint
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://...  # Full traces URL
```

### Option 2: Programmatic Configuration

```typescript
// instrumentation.ts
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
```

**Options:**
- `serviceName` (string): Service name (overrides `SECURENOW_APPID`)
- `endpoint` (string): Base URL for OTLP collector (overrides `SECURENOW_INSTANCE`)
- `noUuid` (boolean): Don't append UUID to service name
- `disableInstrumentations` (string[]): List of instrumentations to disable
- `headers` (object): Additional headers for authentication

---

## 🔧 Next.js Version Compatibility

### Next.js 15+ (Recommended)
✅ Works out of the box. Just create `instrumentation.ts`.

### Next.js 14 and Below
⚠️ You need to enable the instrumentation hook in `next.config.js`:

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    instrumentationHook: true,  // Required for Next.js 14 and below
  },
};

module.exports = nextConfig;
```

---

## 🎯 Deployment

### Vercel

SecureNow works seamlessly on Vercel:

1. Add environment variables in Vercel dashboard
2. Deploy normally

The instrumentation runs during both build and runtime.

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

ENV SECURENOW_APPID=my-nextjs-app
ENV SECURENOW_INSTANCE=http://signoz:4318

EXPOSE 3000
CMD ["npm", "start"]
```

### Self-Hosted / VPS

Just set environment variables and run:

```bash
export SECURENOW_APPID=my-nextjs-app
export SECURENOW_INSTANCE=http://your-signoz-server:4318
npm start
```

---

## 🐛 Troubleshooting

### Not seeing traces?

**Check 1: Is instrumentation loading?**
```bash
npm run dev
# Look for: [securenow] Next.js integration loading
```

**Check 2: Enable debug logging**
```bash
OTEL_LOG_LEVEL=debug npm run dev
```

**Check 3: Create a test span**
```bash
SECURENOW_TEST_SPAN=1 npm run dev
```

### `Cannot find module 'securenow/nextjs'`

Make sure you're on the latest version:
```bash
npm install securenow@latest
```

### Traces not appearing in SigNoz

1. **Check endpoint:**
   ```bash
   curl http://your-signoz-server:4318/v1/traces
   ```

2. **Verify connectivity:** Make sure your app can reach SigNoz

3. **Check authentication:** If using API keys, verify headers

### Too many spans / noisy logs

Disable specific instrumentations:
```bash
SECURENOW_DISABLE_INSTRUMENTATIONS=fs,dns,net
```

---

## 📖 Comparison with Other Solutions

### vs. `@vercel/otel`
- ✅ **SecureNow**: Pre-configured for SigNoz, includes auto-instrumentations
- ⚠️ **@vercel/otel**: Requires manual instrumentation setup

### vs. Manual OpenTelemetry Setup
- ✅ **SecureNow**: 3 lines of code, works immediately
- ⚠️ **Manual**: 50+ lines, complex configuration

### vs. Other APM Solutions (DataDog, New Relic)
- ✅ **SecureNow**: Open-source, self-hosted, vendor-neutral
- ⚠️ **Commercial APM**: Expensive, vendor lock-in

---

## 🔥 Best Practices

### 1. Use Meaningful Service Names
```bash
# Good ✅
SECURENOW_APPID=checkout-service
SECURENOW_APPID=user-dashboard

# Bad ❌
SECURENOW_APPID=app
SECURENOW_APPID=test
```

### 2. Set Deployment Environment
```bash
# Vercel automatically sets VERCEL_ENV
# For other platforms:
NODE_ENV=production
```

### 3. Use Service Instance IDs in Production
```bash
# Default behavior (recommended for production)
# Each worker gets a unique instance ID

# For development (easier to filter)
SECURENOW_NO_UUID=1
```

### 4. Disable Noisy Instrumentations
```bash
# File system operations can be too verbose
SECURENOW_DISABLE_INSTRUMENTATIONS=fs
```

---

## 🎓 Examples

Check the `examples/` folder for:
- `nextjs-instrumentation.ts` - Basic TypeScript setup
- `nextjs-instrumentation.js` - Basic JavaScript setup
- `nextjs-with-options.ts` - Advanced configuration
- `nextjs-env-example.txt` - Complete environment variables reference

---

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/your-repo/securenow/issues)
- **Documentation:** [Full Documentation](https://your-docs-site.com)
- **SigNoz Docs:** [SigNoz OpenTelemetry Docs](https://signoz.io/docs/)

---

## 📝 License

ISC

---

**Made with ❤️ for the Next.js and SigNoz community**

