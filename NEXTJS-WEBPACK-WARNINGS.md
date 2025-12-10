# Next.js Webpack Warnings - Fix Guide

## The Problem

When using SecureNow with Next.js, you might see webpack warnings like:

```
⚠ Critical dependency: the request of a dependency is an expression
⚠ Module not found: Can't resolve '@opentelemetry/winston-transport'
⚠ Module not found: Can't resolve '@opentelemetry/exporter-jaeger'
```

**Good news:** Your app still works! These are just webpack bundling warnings.

**Why it happens:** OpenTelemetry instrumentations use dynamic `require()` statements that webpack can't analyze at build time. This is normal for Node.js server code but Next.js's bundler complains about it.

---

## ✅ Solution 1: Suppress Warnings (Recommended)

Add webpack configuration to suppress these warnings.

### Step 1: Update your `next.config.js`

```javascript
const { getSecureNowWebpackConfig } = require('securenow/nextjs-webpack-config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, options) => {
    return getSecureNowWebpackConfig(config, options);
  },
  
  // Optional: Tell Next.js not to bundle OpenTelemetry packages
  serverExternalPackages: [
    '@opentelemetry/sdk-node',
    '@opentelemetry/auto-instrumentations-node',
  ],
};

module.exports = nextConfig;
```

### Step 2: Restart your dev server

```bash
npm run dev
```

**Done!** No more warnings. ✨

---

## ✅ Solution 2: Manual Webpack Config

If you already have custom webpack config:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, options) => {
    if (options.isServer) {
      // Suppress OpenTelemetry warnings
      config.ignoreWarnings = config.ignoreWarnings || [];
      config.ignoreWarnings.push(
        {
          module: /@opentelemetry\/instrumentation/,
          message: /Critical dependency/,
        },
        {
          module: /@opentelemetry/,
          message: /Module not found.*winston-transport/,
        },
        {
          module: /@opentelemetry/,
          message: /Module not found.*exporter-jaeger/,
        }
      );
    }
    
    // Your other webpack config
    return config;
  },
};

module.exports = nextConfig;
```

---

## ✅ Solution 3: Disable Problematic Instrumentations

If you don't need certain instrumentations, disable them:

```typescript
// instrumentation.ts
import { registerSecureNow } from 'securenow/nextjs';

export function register() {
  registerSecureNow({
    disableInstrumentations: [
      'winston',      // Winston logger (optional)
      'bunyan',       // Bunyan logger (optional)
      'pino',         // Pino logger (optional)
      'fs',           // File system (too noisy)
    ],
  });
}
```

---

## 📋 Understanding the Warnings

### "Critical dependency" warnings

**What it means:** OpenTelemetry uses `require(moduleName)` where `moduleName` is a variable. Webpack can't analyze this statically.

**Is it a problem?** No! These modules are only loaded at runtime on the server, not in the browser.

**Solution:** Suppress the warnings using webpack config.

### "Module not found" warnings

**What it means:** Some instrumentations have optional peer dependencies that aren't installed.

**Is it a problem?** No! These are optional. If you're not using Winston logging or Jaeger exporter, you don't need them.

**Solution:** Either:
1. Suppress the warnings (recommended)
2. Disable those instrumentations
3. Install the missing packages (only if you use them)

---

## 🔧 Advanced: serverExternalPackages

For Next.js 13+, you can tell Next.js not to bundle certain packages:

```javascript
const nextConfig = {
  serverExternalPackages: [
    '@opentelemetry/sdk-node',
    '@opentelemetry/auto-instrumentations-node',
    '@opentelemetry/instrumentation',
  ],
};
```

This tells Next.js to leave these packages as `require()` statements instead of bundling them.

---

## 📦 Complete Example

Here's a complete `next.config.js` that handles everything:

```javascript
const { getSecureNowWebpackConfig } = require('securenow/nextjs-webpack-config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress warnings
  webpack: (config, options) => {
    return getSecureNowWebpackConfig(config, options);
  },
  
  // Don't bundle OpenTelemetry
  serverExternalPackages: [
    '@opentelemetry/sdk-node',
    '@opentelemetry/auto-instrumentations-node',
  ],
};

module.exports = nextConfig;
```

---

## ❓ FAQ

### Q: Will these warnings affect my production build?

**A:** No. Your production build will work fine. These are just webpack warnings, not errors.

### Q: Should I be concerned about these warnings?

**A:** No. They're expected when using Node.js instrumentation in Next.js. Just suppress them using the webpack config.

### Q: Do I need to install the missing packages?

**A:** Only if you're actually using them. For example:
- `@opentelemetry/winston-transport` - only if you use Winston logger
- `@opentelemetry/exporter-jaeger` - only if you want to export to Jaeger

### Q: Why doesn't SecureNow bundle these packages?

**A:** OpenTelemetry instrumentations are designed for Node.js server environments and use features that don't work in bundled code (like dynamic requires and module patching).

### Q: Can I use SecureNow without these warnings?

**A:** Yes! Use the webpack config provided above to suppress them.

---

## 🎯 Quick Fix (Copy-Paste)

**Just add this to your `next.config.js`:**

```javascript
const { getSecureNowWebpackConfig } = require('securenow/nextjs-webpack-config');

module.exports = {
  webpack: getSecureNowWebpackConfig,
};
```

**That's it!** ✅

---

## 🆘 Still Having Issues?

If you're still seeing warnings after applying the fix:

1. **Restart your dev server completely**
   ```bash
   # Stop the server (Ctrl+C)
   # Clear Next.js cache
   rm -rf .next
   # Start again
   npm run dev
   ```

2. **Check your Next.js version**
   ```bash
   npm list next
   ```
   - Next.js 15+ works best
   - Next.js 14 and below need `experimentalInstrumentationHook: true`

3. **Verify webpack config is loading**
   - Check that `next.config.js` is in your project root
   - Make sure it's a `.js` file (not `.mjs` or `.ts`)

4. **Check for conflicting webpack config**
   - If you have other webpack plugins, they might conflict
   - Try the SecureNow config alone first

---

## 📚 More Help

- [Next.js Webpack Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/webpack)
- [OpenTelemetry Next.js Guide](./NEXTJS-GUIDE.md)
- [SecureNow Documentation](./README.md)

---

**TL;DR:** Add webpack config to suppress warnings. Your app works fine, the warnings are just noise from webpack trying to analyze Node.js server code.




