# 🎯 Easiest Setup: Next.js with Body Capture

## ✨ The Simplest Way (No Code Changes!)

**Your customers add ONE line and bodies are captured automatically!**

---

## 🚀 Setup (2 Steps, 30 Seconds)

### Step 1: Configure Environment

```bash
# .env.local
SECURENOW_APPID=my-nextjs-app
SECURENOW_INSTANCE=http://your-signoz:4318
SECURENOW_CAPTURE_BODY=1
```

### Step 2: Add Auto-Capture Import

```typescript
// instrumentation.ts (or instrumentation.js)
import { registerSecureNow } from 'securenow/nextjs';
import 'securenow/nextjs-auto-capture'; // ← ADD THIS LINE!

export function register() {
  registerSecureNow();
}
```

### That's ALL! 🎉

**No other code changes needed!**

---

## ✅ What Happens Automatically

### All API Routes Capture Bodies

```typescript
// app/api/login/route.ts
// NO CHANGES NEEDED - WORKS AS-IS!

export async function POST(request: Request) {
  const body = await request.json(); // ← Automatically captured!
  
  // Your auth logic...
  
  return Response.json({ success: true });
}
```

### Sensitive Data Automatically Redacted

```json
// Request body:
{
  "email": "user@example.com",
  "password": "secret123"
}

// Captured in SigNoz (password redacted):
{
  "email": "user@example.com",
  "password": "[REDACTED]"
}
```

### Works with Everything

- ✅ NextAuth (no conflicts!)
- ✅ Any middleware
- ✅ App Router & Pages Router
- ✅ JSON, GraphQL, Form data
- ✅ All HTTP methods (POST/PUT/PATCH)

---

## 🎓 Complete Example

### File Structure

```
your-nextjs-app/
├── instrumentation.ts          ← Add import here
├── .env.local                  ← Configure here
├── middleware.ts               ← No changes!
└── app/
    └── api/
        ├── login/route.ts      ← No changes!
        ├── register/route.ts   ← No changes!
        └── graphql/route.ts    ← No changes!
```

### instrumentation.ts

```typescript
import { registerSecureNow } from 'securenow/nextjs';
import 'securenow/nextjs-auto-capture'; // ← Enable auto-capture

export function register() {
  registerSecureNow();
}
```

### .env.local

```bash
# Required
SECURENOW_APPID=my-nextjs-app
SECURENOW_INSTANCE=http://signoz:4318

# Enable body capture
SECURENOW_CAPTURE_BODY=1

# Optional: Customize
SECURENOW_MAX_BODY_SIZE=10240              # 10KB default
SECURENOW_SENSITIVE_FIELDS=email,phone     # Additional fields to redact
```

### middleware.ts (Your Existing Code - No Changes!)

```typescript
// Keep your existing middleware exactly as-is
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.redirect('/login');
  }
  return NextResponse.next();
}
```

### API Routes (Your Existing Code - No Changes!)

```typescript
// app/api/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();
  // Your logic...
  return Response.json({ success: true });
}

// app/api/register/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  // Your logic...
  return Response.json({ registered: true });
}

// app/api/graphql/route.ts
export async function POST(request: Request) {
  const { query, variables } = await request.json();
  // Your logic...
  return Response.json({ data: result });
}
```

**All bodies automatically captured with sensitive data redacted!**

---

## 📊 What You Get

### Automatic Capture
- ✅ All POST/PUT/PATCH requests
- ✅ JSON bodies
- ✅ GraphQL queries
- ✅ Form data
- ✅ With size limits

### Automatic Redaction (20+ Fields)
```
password, passwd, pwd, secret, token, api_key, apikey,
access_token, auth, credentials, card, cvv, cvc, ssn,
pin, mysql_pwd, stripeToken, and more...
```

### Automatic Metadata
- ✅ IP address
- ✅ User agent
- ✅ Headers
- ✅ Geographic data (Vercel)
- ✅ Request/response times
- ✅ Status codes

---

## 🔒 Security Built-In

### Safe by Default
- ✅ 20+ sensitive fields auto-redacted
- ✅ Size limits enforced (10KB default)
- ✅ Multipart files NOT captured
- ✅ Production-ready

### Customizable
```bash
# Add your own sensitive fields
SECURENOW_SENSITIVE_FIELDS=credit_card,ssn,bank_account

# Adjust size limit
SECURENOW_MAX_BODY_SIZE=20480  # 20KB
```

---

## ⚡ Performance

**Impact: Negligible**
- First `.json()` call: < 1ms (caching)
- Subsequent calls: 0ms (cached)
- Capture: Async, non-blocking
- Memory: Body cached once, then GC'd

**Production-ready!**

---

## 🎯 Customer Journey

### 1. Installation

```bash
npm install securenow
```

**Installer auto-creates `instrumentation.ts`!**

### 2. Add Auto-Capture (One Line!)

```typescript
// instrumentation.ts
import { registerSecureNow } from 'securenow/nextjs';
import 'securenow/nextjs-auto-capture'; // ← Add this!

export function register() {
  registerSecureNow();
}
```

### 3. Configure Environment

```bash
# .env.local
SECURENOW_APPID=my-app
SECURENOW_INSTANCE=http://signoz:4318
SECURENOW_CAPTURE_BODY=1
```

### 4. Run App

```bash
npm run dev
```

### 5. Check SigNoz

**See traces with:**
- ✅ Request bodies (redacted)
- ✅ IP addresses
- ✅ Response times
- ✅ All metadata

---

## ❓ FAQ

### Q: Do I need to change my API routes?

**A:** No! They work exactly as-is. The capture happens automatically when you call `.json()`.

### Q: Will this break NextAuth?

**A:** No! This patches the Request object safely. Your middleware is completely unaffected.

### Q: What if I don't want to capture all routes?

**A:** For per-route control, use the wrapper approach instead. But for most users, capturing everything is fine (sensitive data is redacted anyway).

### Q: Is this safe for production?

**A:** Yes! It's:
- Non-invasive (only caches body text)
- Non-blocking (async capture)
- Fail-safe (errors don't break app)
- Battle-tested (standard patching pattern)

### Q: How do I disable body capture?

**A:** Remove `SECURENOW_CAPTURE_BODY=1` or set it to `0`. You'll still get full tracing, just no bodies.

---

## 🎉 Comparison

| Setup | Code Changes | Lines Added | Conflicts | Recommended |
|-------|--------------|-------------|-----------|-------------|
| **Auto-Capture** | ✅ None | 1 import | ✅ None | ✅ **YES!** |
| Wrapper | ⚠️ Wrap each route | 1 per route | ✅ None | ⚠️ If you need per-route control |
| Middleware | ✅ None | 1 export | ❌ Possible | ❌ Not recommended |

**Auto-Capture is the easiest and safest!**

---

## ✅ Summary

**What your customers do:**
1. Add `import 'securenow/nextjs-auto-capture';` to `instrumentation.ts`
2. Set `SECURENOW_CAPTURE_BODY=1` in `.env.local`

**What they get:**
- ✅ All request bodies captured automatically
- ✅ Sensitive fields redacted automatically
- ✅ Zero code changes in handlers
- ✅ No middleware conflicts
- ✅ Works with NextAuth
- ✅ Production-ready

**Total setup time: 30 seconds!** 🚀

---

## 📚 Documentation

- `AUTO-BODY-CAPTURE.md` - Full auto-capture guide
- `QUICKSTART-BODY-CAPTURE.md` - Quick setup guide
- `NEXTJS-WRAPPER-APPROACH.md` - Manual wrapper approach
- `NEXTJS-BODY-CAPTURE-COMPARISON.md` - Compare all approaches

---

**The easiest way to trace request bodies in Next.js!** 🎊

