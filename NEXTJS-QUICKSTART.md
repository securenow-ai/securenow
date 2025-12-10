# Next.js + SecureNow Quick Start

## Installation (30 seconds)

```bash
npm install securenow
```

**🎉 The installer will automatically offer to create the instrumentation file!**

Just answer "Y" when prompted, and it's done!

---

## Alternative: Manual Setup

If you skipped auto-setup or want to do it manually:

### Option 1: Use CLI (Recommended)

```bash
npx securenow init
```

### Option 2: Create File Manually

Create `instrumentation.ts` at project root:

```typescript
import { registerSecureNow } from 'securenow/nextjs';
export function register() { registerSecureNow(); }
```

### 2. Create `.env.local`:

```bash
SECURENOW_APPID=my-nextjs-app
SECURENOW_INSTANCE=http://your-securenow:4318
```

### 3. (Next.js 14 only) Update `next.config.js`:

```javascript
module.exports = {
  experimental: { instrumentationHook: true }
}
```

## Run

```bash
npm run dev
```

## Verify

Look for:
```
[securenow] ✅ OpenTelemetry started for Next.js
```

Open SigNoz → check for traces from `my-nextjs-app`

---

**That's it!** See [NEXTJS-GUIDE.md](./NEXTJS-GUIDE.md) for advanced configuration.

