# SecureNow Next.js Examples

This folder contains example files to help you integrate SecureNow with your Next.js application.

---

## 📁 Files

### 1. `nextjs-instrumentation.ts`
**TypeScript setup (recommended for TS projects)**

Basic Next.js instrumentation setup using TypeScript.

**Usage:**
1. Copy this file to your project root as `instrumentation.ts`
2. Set environment variables in `.env.local`
3. Run your Next.js app

---

### 2. `nextjs-instrumentation.js`
**JavaScript setup (for JS projects)**

Basic Next.js instrumentation setup using JavaScript.

**Usage:**
1. Copy this file to your project root as `instrumentation.js`
2. Set environment variables in `.env.local`
3. Run your Next.js app

---

### 3. `nextjs-with-options.ts`
**Advanced configuration with programmatic options**

Shows how to pass configuration options directly to `registerSecureNow()` instead of using only environment variables.

**Usage:**
1. Copy to project root as `instrumentation.ts`
2. Customize the options object
3. Set sensitive values (API keys) via environment variables

**Good for:**
- Complex configurations
- Multiple environments
- Custom headers
- Selective instrumentation

---

### 4. `nextjs-env-example.txt`
**Complete environment variables reference**

Lists all available environment variables with explanations.

**Usage:**
1. Copy contents to your `.env.local` file
2. Uncomment and set the variables you need
3. Remove or comment out unused variables

---

### 5. `test-nextjs-setup.js`
**Test script to verify your setup**

A standalone script to test SecureNow configuration before integrating with Next.js.

**Usage:**
```bash
# Test with environment variables
SECURENOW_APPID=test-app \
SECURENOW_INSTANCE=http://localhost:4318 \
node examples/test-nextjs-setup.js

# Or set them in .env first
node examples/test-nextjs-setup.js
```

**What it tests:**
- ✅ Package installation
- ✅ SDK registration
- ✅ Span creation
- ✅ Configuration loading
- ✅ Export functionality

---

## 🚀 Quick Start Guide

### Step 1: Choose Your Setup

**TypeScript project?** → Use `nextjs-instrumentation.ts`  
**JavaScript project?** → Use `nextjs-instrumentation.js`  
**Need advanced config?** → Use `nextjs-with-options.ts`

### Step 2: Copy File

```bash
# From your project root
cp node_modules/securenow/examples/nextjs-instrumentation.ts instrumentation.ts
# or
cp node_modules/securenow/examples/nextjs-instrumentation.js instrumentation.js
```

### Step 3: Configure Environment

```bash
# Copy environment variables template
cp node_modules/securenow/examples/nextjs-env-example.txt .env.local
# Edit .env.local with your values
```

### Step 4: Test (Optional)

```bash
# Verify setup works
node node_modules/securenow/examples/test-nextjs-setup.js
```

### Step 5: Run Your App

```bash
npm run dev
```

---

## 📚 Documentation

- **[Quick Start](../NEXTJS-QUICKSTART.md)** - 30-second setup
- **[Complete Guide](../NEXTJS-GUIDE.md)** - Full documentation
- **[Customer Guide](../CUSTOMER-GUIDE.md)** - User-friendly guide
- **[Architecture](../ARCHITECTURE.md)** - Technical details

---

## 💡 Tips

### For Development
```bash
# Use simpler service names
SECURENOW_NO_UUID=1
SECURENOW_APPID=my-app-dev

# Enable debug logging
OTEL_LOG_LEVEL=debug
```

### For Production
```bash
# Use descriptive names with UUID
SECURENOW_APPID=my-app-prod
# UUID is auto-appended

# Use info or warn level
OTEL_LOG_LEVEL=info
```

### For Vercel
```bash
# Set in Vercel dashboard:
SECURENOW_APPID=my-app
SECURENOW_INSTANCE=http://your-signoz:4318
OTEL_EXPORTER_OTLP_HEADERS="x-api-key=your-key"
```

---

## 🆘 Troubleshooting

### "Cannot find module 'securenow/nextjs'"

Make sure you're on the latest version:
```bash
npm install securenow@latest
```

### Traces not appearing

1. Check console for `[securenow] ✅ OpenTelemetry started`
2. Enable debug mode: `OTEL_LOG_LEVEL=debug`
3. Run test script: `node examples/test-nextjs-setup.js`
4. Verify SigNoz accessibility: `curl http://your-signoz:4318/v1/traces`

### Too many spans

Disable noisy instrumentations:
```bash
SECURENOW_DISABLE_INSTRUMENTATIONS=fs,dns
```

---

## 📝 Customization

### Disable Specific Instrumentations

```typescript
registerSecureNow({
  disableInstrumentations: ['fs', 'dns', 'net'],
});
```

### Add Custom Headers

```typescript
registerSecureNow({
  headers: {
    'x-api-key': process.env.SIGNOZ_API_KEY,
    'x-environment': process.env.NODE_ENV,
  },
});
```

### Use Different Service Name

```typescript
registerSecureNow({
  serviceName: 'my-custom-app-name',
  noUuid: false, // Still append UUID
});
```

---

## 🎯 Next Steps

After setting up:

1. **Run your app** and verify traces appear
2. **Test key user flows** to see end-to-end tracing
3. **Check SigNoz dashboard** for service map and traces
4. **Adjust configuration** based on your needs
5. **Deploy to production** with proper environment variables

---

## 🌟 Success Looks Like

```bash
$ npm run dev

[securenow] Next.js integration loading (pid=12345)
[securenow] 🚀 Next.js App → service.name=my-app-abc123
[securenow] ✅ OpenTelemetry started for Next.js → http://signoz:4318/v1/traces

✓ Ready in 1.2s
```

Then in SigNoz:
- ✅ See your service in service map
- ✅ View traces for requests
- ✅ Analyze performance metrics
- ✅ Debug issues with distributed tracing

---

**Happy tracing! 🎉**




