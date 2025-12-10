# SecureNow

OpenTelemetry instrumentation for Node.js and Next.js applications - send traces to SigNoz or any OTLP-compatible backend.

**Official npm package:** [securenow](http://securenow.ai/)

---

## 🚀 Quick Start

### For Next.js Applications

**The easiest way to add observability to Next.js!**

```bash
# Just install - setup is automatic!
npm install securenow
```

**🎉 The installer will automatically:**
- Detect your Next.js project
- Create `instrumentation.ts` (or `.js`)
- Create `.env.local` template

**Just answer "Y" when prompted!**

Then configure your `.env.local`:

```bash
SECURENOW_APPID=my-nextjs-app
SECURENOW_INSTANCE=http://your-signoz-server:4318
```

**Alternative:** Use the CLI command
```bash
npx securenow init
```

**Done!** 🎉 See [Next.js Complete Guide](./NEXTJS-GUIDE.md) for details.

---

### For Node.js Applications (Express, Fastify, NestJS, etc.)

```bash
# 1. Install
npm install securenow

# 2. Set environment variables
export SECURENOW_APPID=my-app
export SECURENOW_INSTANCE=http://your-signoz-server:4318

# 3. Run with preload
NODE_OPTIONS="-r securenow/register" node app.js
# or
NODE_OPTIONS="-r securenow/register" npm start
```

---

## 📦 Installation

```bash
npm install securenow
# or
yarn add securenow
# or
pnpm add securenow
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Required: Your application identifier
SECURENOW_APPID=my-app-name

# Optional: Your SigNoz/OTLP collector endpoint
# Default: http://46.62.173.237:4318
SECURENOW_INSTANCE=http://your-signoz-server:4318

# Optional: Additional configuration
SECURENOW_NO_UUID=1                         # Don't append UUID to service name
OTEL_LOG_LEVEL=info                         # debug|info|warn|error
SECURENOW_DISABLE_INSTRUMENTATIONS=fs,dns   # Disable specific instrumentations
OTEL_EXPORTER_OTLP_HEADERS="x-api-key=..."  # Authentication headers
```

### Legacy Environment Variables (still supported)

```bash
export securenow=<API-KEY>
export securenow_instance='http://<dedicated_instance>:4318'
```

---

## 🎯 Supported Frameworks & Libraries

SecureNow automatically instruments:

### Web Frameworks
- ✅ Next.js (App Router & Pages Router)
- ✅ Express.js
- ✅ Fastify
- ✅ NestJS
- ✅ Koa
- ✅ Hapi

### Databases
- ✅ PostgreSQL
- ✅ MySQL / MySQL2
- ✅ MongoDB
- ✅ Redis

### Other
- ✅ HTTP/HTTPS requests
- ✅ GraphQL
- ✅ gRPC
- ✅ And many more via OpenTelemetry auto-instrumentation

---

## 📚 Documentation

- **[Next.js Quick Start](./NEXTJS-QUICKSTART.md)** - Get started in 30 seconds
- **[Next.js Complete Guide](./NEXTJS-GUIDE.md)** - Full Next.js integration guide
- **[Examples](./examples/)** - Code examples for different setups

---

## 🆘 Support

- **Website:** [securenow.ai](http://securenow.ai/)
- **Issues:** Report bugs and request features
- **Documentation:** Full documentation and guides

---

## 📄 License

ISC