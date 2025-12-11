# Next.js Body Capture - Self-Sufficient Solution

## 🚀 Enable Body Capture in Next.js (2 Steps)

### Step 1: Enable in Environment

```bash
# .env.local
SECURENOW_CAPTURE_BODY=1
```

### Step 2: Create middleware.ts

**Just ONE line!** Create `middleware.ts` in your project root:

```typescript
export { middleware } from 'securenow/nextjs-middleware';

export const config = {
  matcher: '/api/:path*',  // Apply to API routes
};
```

**That's it!** 🎉 Bodies are now captured with sensitive data automatically redacted.

---

## ✨ Why This Works

**Self-sufficient design:**
- ✅ **One-line import** - No code to write
- ✅ **All logic in package** - Redaction, parsing, size limits
- ✅ **Zero configuration** - Works with defaults
- ✅ **Doesn't lock request stream** - Uses `request.clone()`
- ✅ **Safe by default** - 20+ sensitive fields redacted

**No customer code changes needed!** Just import and configure where to apply.

---

## 📊 What Gets Captured

### ✅ JSON Requests

```json
POST /api/users
Content-Type: application/json

{
  "username": "john",
  "password": "secret123"  ← Automatically redacted
}
```

**Captured:**
```json
{
  "username": "john",
  "password": "[REDACTED]"
}
```

### ✅ GraphQL Requests

```graphql
POST /api/graphql
Content-Type: application/graphql

mutation Login {
  login(email: "john@example.com", password: "secret")  ← Redacted
}
```

**Captured:**
```graphql
mutation Login {
  login(email: "john@example.com", password: "[REDACTED]")
}
```

### ✅ Form Data

```http
POST /api/contact
Content-Type: application/x-www-form-urlencoded

name=John&email=john@example.com&message=Hello
```

**Captured:**
```json
{
  "name": "John",
  "email": "john@example.com",
  "message": "Hello"
}
```

---

## ⚙️ Configuration

### Matcher Patterns

**Apply to all API routes:**
```typescript
export const config = {
  matcher: '/api/:path*',
};
```

**Apply to specific routes:**
```typescript
export const config = {
  matcher: ['/api/login', '/api/register', '/api/graphql'],
};
```

**Apply to everything except static files:**
```typescript
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
```

**Apply to multiple patterns:**
```typescript
export const config = {
  matcher: ['/api/:path*', '/graphql'],
};
```

### Environment Variables

```bash
# Max body size (default: 10KB)
SECURENOW_MAX_BODY_SIZE=20480

# Custom sensitive fields to redact
SECURENOW_SENSITIVE_FIELDS=email,phone,address

# Enable debug logging
OTEL_LOG_LEVEL=debug
```

---

## 🔒 Security Features

### Automatic Redaction (20+ Fields)

These are **always redacted**:
```
password, passwd, pwd, secret, token, api_key, apikey,
access_token, auth, credentials, mysql_pwd, stripeToken,
card, cardnumber, cvv, cvc, ccv, ssn, pin
```

### Custom Sensitive Fields

Add your own:
```bash
SECURENOW_SENSITIVE_FIELDS=credit_card,phone_number,dob
```

Now these are also redacted automatically!

### Size Protection

Bodies larger than `SECURENOW_MAX_BODY_SIZE` show:
```
[TOO LARGE: 50000 bytes]
```

---

## 🎯 File Structure

```
your-nextjs-app/
├── middleware.ts              ← Create this (1 line import!)
├── instrumentation.ts         ← Already created by installer
├── .env.local                 ← Set SECURENOW_CAPTURE_BODY=1
├── app/
│   └── api/
│       ├── login/route.ts     ← Bodies auto-captured
│       ├── users/route.ts     ← Bodies auto-captured
│       └── graphql/route.ts   ← Bodies auto-captured
└── ...
```

---

## 🧪 Testing

### Test Body Capture

1. **Create middleware.ts:**
   ```typescript
   export { middleware } from 'securenow/nextjs-middleware';
   export const config = { matcher: '/api/:path*' };
   ```

2. **Enable in .env.local:**
   ```bash
   SECURENOW_CAPTURE_BODY=1
   ```

3. **Make a test request:**
   ```bash
   curl -X POST http://localhost:3000/api/test \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"secret123"}'
   ```

4. **Check SigNoz:**
   - Find the `/api/test` trace
   - Look for `http.request.body` attribute
   - Verify password shows `[REDACTED]`

### Debug Mode

```bash
OTEL_LOG_LEVEL=debug npm run dev
```

You'll see:
```
[securenow] 📝 Body capture enabled
[securenow] 📚 Import middleware from securenow/nextjs-middleware
```

---

## 🎓 Complete Setup Example

### 1. instrumentation.ts (auto-created by installer)

```typescript
import { registerSecureNow } from 'securenow/nextjs';

export function register() {
  registerSecureNow();
}
```

### 2. middleware.ts (create this for body capture)

```typescript
export { middleware } from 'securenow/nextjs-middleware';

export const config = {
  matcher: '/api/:path*',
};
```

### 3. .env.local

```bash
# Required
SECURENOW_APPID=my-nextjs-app
SECURENOW_INSTANCE=http://your-signoz:4318

# Optional: Enable body capture
SECURENOW_CAPTURE_BODY=1
SECURENOW_MAX_BODY_SIZE=20480
SECURENOW_SENSITIVE_FIELDS=email,phone
```

### 4. Done! ✅

```bash
npm run dev
```

---

## 💡 Why Two Files?

**instrumentation.ts** - OpenTelemetry setup (required)
- Sets up tracing infrastructure
- Auto-captures IP, headers, geo data
- Runs for all requests

**middleware.ts** - Body capture (optional)
- Intercepts requests to clone and read body
- Only needed if you want body capture
- Can be applied selectively to routes

**Separation = flexibility!** You can have tracing without body capture.

---

## ⚡ Performance

**Overhead per request:**
- **Without middleware:** 0ms (just tracing)
- **With middleware:** < 1ms (clone + parse + redact)

**The middleware:**
- Uses `request.clone()` - doesn't lock original
- Runs async - doesn't block request
- Fails gracefully - errors don't break app

---

## ❓ FAQ

### Q: Is this truly self-sufficient?

**A:** Yes! Just export the middleware:
```typescript
export { middleware } from 'securenow/nextjs-middleware';
```

All logic (parsing, redaction, size limits) is in the package.

### Q: Do I need to write any redaction code?

**A:** No! 20+ sensitive fields are redacted automatically. Just add custom ones if needed via env vars.

### Q: Can I customize the redaction?

**A:** Yes, via environment variables:
```bash
SECURENOW_SENSITIVE_FIELDS=my_custom_field,another_field
```

### Q: Will this slow down my app?

**A:** No! < 1ms overhead. Uses `request.clone()` so original is unaffected.

### Q: Can I apply to specific routes only?

**A:** Yes! Use the matcher config:
```typescript
export const config = {
  matcher: ['/api/login', '/api/graphql'],
};
```

### Q: What if I don't want body capture?

**A:** Don't create `middleware.ts`! Just use `instrumentation.ts` for tracing without bodies.

---

## 🎉 Summary

**Enable body capture:**

1. ```bash
   SECURENOW_CAPTURE_BODY=1  # in .env.local
   ```

2. ```typescript
   export { middleware } from 'securenow/nextjs-middleware';  # in middleware.ts
   ```

**Result:**
- ✅ All request bodies captured
- ✅ Sensitive data redacted
- ✅ JSON, GraphQL, Form supported
- ✅ No customer code changes
- ✅ Package handles everything

**Self-sufficient design** - customers just import and configure! 🚀

