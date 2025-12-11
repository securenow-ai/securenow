# 🚀 Add Observability to Your Next.js App in 2 Minutes

**Send traces to SigNoz with just 1-2 steps. No webpack warnings!**

---

## Step 1: Install SecureNow

```bash
npm install securenow
```

**🎉 That's it!** The installer will automatically:
- Detect your Next.js project
- Offer to create `instrumentation.ts` (or `.js`)
- Create `.env.local` template
- **No webpack bundling warnings** (uses @vercel/otel)

Just answer **"Y"** when prompted!

---

## Step 2: Configure Environment Variables

The installer created `.env.local` for you. Just edit it:

```typescript
import { registerSecureNow } from 'securenow/nextjs';

export function register() {
  registerSecureNow();
}
```

**Using JavaScript?** Create `instrumentation.js` instead:

```javascript
const { registerSecureNow } = require('securenow/nextjs');

export function register() {
  registerSecureNow();
}
```

---

## Step 3: Add Environment Variables

Create or update `.env.local`:

```bash
# Just update these two values:
SECURENOW_APPID=my-nextjs-app              # Your app name
SECURENOW_INSTANCE=http://your-signoz:4318 # Your SigNoz URL
```

---

## That's It! 🎉

---

## Alternative Setup Methods

### If You Skipped Auto-Setup

**Option 1: Use the CLI (Recommended)**

```bash
npx securenow init
```

**Option 2: Create Manually**

Create `instrumentation.ts` at project root:

```typescript
import { registerSecureNow } from 'securenow/nextjs';
export function register() { registerSecureNow(); }
```

Then create `.env.local`:

```bash
SECURENOW_APPID=my-nextjs-app
SECURENOW_INSTANCE=http://your-signoz:4318
```

---

## Run Your App

Run your app:

```bash
npm run dev
```

You should see:

```
[securenow] Next.js integration loading
[securenow] 🚀 Next.js App → service.name=my-nextjs-app
[securenow] ✅ OpenTelemetry started for Next.js
```

Open your **SigNoz dashboard** and you'll see traces immediately!

---

## 📊 What You Get Automatically

### 🌐 User & Request Data (NEW!)
- **IP Addresses** - Automatically captured from all sources
- **User Agents** - Browser/device information
- **Referers** - Traffic sources
- **Geographic Data** - Country, region, city (on Vercel/Cloudflare)
- **Request Headers** - Host, scheme, request IDs
- **Response Codes** - 200, 404, 500, etc.

**Perfect for:**
- Debugging location-specific issues
- Tracking user journeys
- Bot detection
- Performance analysis by region
- Marketing attribution

### 📝 Request Body Capture (Optional - Enable It!)
- **JSON Payloads** - Capture API request bodies
- **GraphQL Queries** - See full queries in traces
- **Form Submissions** - Track form data
- **Auto-Redaction** - Passwords, tokens, cards automatically hidden
- **Size Limits** - Configurable max body size
- **GDPR-Friendly** - Built-in sensitive field protection

**Enable in 2 steps:**
1. Set `SECURENOW_CAPTURE_BODY=1` in `.env.local`
2. Create `middleware.ts`: `export { middleware } from 'securenow/nextjs-middleware';`

(The installer can create both files for you automatically!)

**Perfect for:**
- Debugging API issues with exact inputs
- Monitoring GraphQL query patterns
- Understanding user input behavior
- Validating request schemas
- Troubleshooting edge cases

See [REQUEST-BODY-CAPTURE.md](./REQUEST-BODY-CAPTURE.md)

### ✅ Next.js Built-in Spans
- HTTP requests
- API routes
- Page rendering
- Server-side props
- Metadata generation
- Time to First Byte (TTFB)

### ✅ Backend Instrumentation
- **Databases:** PostgreSQL, MySQL, MongoDB, Redis
- **HTTP Calls:** fetch, axios, http/https
- **GraphQL** queries
- **gRPC** calls
- **And 30+ more libraries**

No additional code needed!

---

## ⚙️ Optional: Add Authentication

If your SigNoz server requires an API key:

```bash
# Add to .env.local
OTEL_EXPORTER_OTLP_HEADERS="x-api-key=your-api-key-here"
```

---

## 🔧 Optional: Advanced Configuration

Want more control? You can pass options:

```typescript
import { registerSecureNow } from 'securenow/nextjs';

export function register() {
  registerSecureNow({
    serviceName: 'my-app',
    endpoint: 'http://signoz:4318',
    headers: {
      'x-api-key': process.env.SIGNOZ_API_KEY || '',
    },
    disableInstrumentations: ['fs'],  // Optional: disable specific instrumentations
  });
}
```

---

## 🚨 Troubleshooting

### Not seeing traces?

**1. Check the console output**
```bash
npm run dev
# Look for: [securenow] ✅ OpenTelemetry started
```

**2. Enable debug mode**
```bash
# Add to .env.local
OTEL_LOG_LEVEL=debug
```

**3. Create a test span**
```bash
# Add to .env.local
SECURENOW_TEST_SPAN=1
```

**4. Verify SigNoz is accessible**
```bash
curl http://your-signoz-server:4318/v1/traces
```

---

## 🎯 Next.js Version Requirements

| Next.js Version | Setup Required |
|----------------|----------------|
| **Next.js 15+** | ✅ Just create `instrumentation.ts` |
| **Next.js 14 and below** | ⚠️ Also add to `next.config.js`: |

For Next.js 14 and below, update `next.config.js`:

```javascript
const nextConfig = {
  experimental: {
    instrumentationHook: true,  // Required for Next.js 14 and below
  },
};

module.exports = nextConfig;
```

---

## ☁️ Deployment

### Vercel

1. Go to your Vercel project settings
2. Add environment variables:
   - `SECURENOW_APPID=my-nextjs-app`
   - `SECURENOW_INSTANCE=http://your-signoz:4318`
3. Redeploy

**Done!** Traces will appear in SigNoz.

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

```bash
export SECURENOW_APPID=my-nextjs-app
export SECURENOW_INSTANCE=http://your-signoz:4318
npm start
```

---

## 🎓 Environment Variables Reference

```bash
# ===== REQUIRED =====
SECURENOW_APPID=my-app-name           # Your app identifier
SECURENOW_INSTANCE=http://host:4318   # SigNoz endpoint

# ===== OPTIONAL =====
OTEL_EXPORTER_OTLP_HEADERS="key=val"  # API keys/headers
SECURENOW_NO_UUID=1                   # Don't append UUID
OTEL_LOG_LEVEL=info                   # debug|info|warn|error
SECURENOW_DISABLE_INSTRUMENTATIONS=fs # Comma-separated
SECURENOW_TEST_SPAN=1                 # Test span on startup
```

---

## 💡 Best Practices

### ✅ DO
- Use descriptive app names: `checkout-service`, `user-api`
- Set `SECURENOW_APPID` in production
- Keep UUID enabled in production (unique per deployment)
- Use `OTEL_LOG_LEVEL=info` or `warn` in production

### ❌ DON'T
- Use generic names: `app`, `test`, `api`
- Hardcode API keys in code
- Disable important instrumentations without reason
- Use `OTEL_LOG_LEVEL=debug` in production (too verbose)

---

## 📚 More Resources

- **[Complete Guide](./NEXTJS-GUIDE.md)** - In-depth documentation
- **[Quick Start](./NEXTJS-QUICKSTART.md)** - Condensed version
- **[Examples](./examples/)** - Code examples
- **[Architecture](./ARCHITECTURE.md)** - How it works

---

## 🆘 Need Help?

- **Documentation:** [Full guides](./NEXTJS-GUIDE.md)
- **Examples:** See `examples/` folder
- **SigNoz Docs:** [signoz.io/docs](https://signoz.io/docs/)

---

## ✨ Why SecureNow?

| Feature | SecureNow | Manual Setup | @vercel/otel |
|---------|-----------|--------------|--------------|
| Lines of code | 3 | 100+ | 20+ |
| Setup time | 2 min | 1-2 hours | 30 min |
| Auto-instrumentation | 30+ libs | Manual | Limited |
| Configuration | Env vars | Complex | Medium |
| Production ready | ✅ Yes | Depends | ✅ Yes |

**Choose SecureNow for the easiest setup!**

---

<div align="center">

**Made with ❤️ for Next.js and SigNoz**

[Website](http://securenow.ai/) • [NPM](https://www.npmjs.com/package/securenow) • [Documentation](./NEXTJS-GUIDE.md)

</div>

