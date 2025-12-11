# Next.js Body Capture - Choosing the Right Approach

## 🎯 Two Approaches Available

SecureNow offers two ways to capture request bodies in Next.js:

1. **Wrapper Approach** (Recommended ✅)
2. **Middleware Approach** (Use with caution ⚠️)

---

## ✅ Wrapper Approach (RECOMMENDED)

### How It Works

Wrap individual API route handlers to capture bodies **inside the handler**:

```typescript
import { withSecureNow } from 'securenow/nextjs-wrapper';

export const POST = withSecureNow(async (request: Request) => {
  const body = await request.json();
  return Response.json({ success: true });
});
```

### ✅ Pros

- **Zero middleware conflicts** - Doesn't interfere with NextAuth or other middleware
- **Never blocks requests** - Runs after routing is complete
- **Per-route control** - Wrap only the routes you need
- **Non-invasive** - Your middleware stays unchanged
- **Safe** - Runs inside your handler, can't prevent handler execution
- **Background capture** - Doesn't delay responses

### ❌ Cons

- Requires wrapping each route individually (but only the ones you want!)
- Slightly more verbose (one extra line per route)

### When to Use

- ✅ You have NextAuth or other middleware
- ✅ You want zero conflicts
- ✅ You want fine-grained control
- ✅ You prioritize reliability
- ✅ **This is the recommended approach for most users**

### Setup

**Step 1:** Enable in .env.local
```bash
SECURENOW_CAPTURE_BODY=1
```

**Step 2:** Wrap your API routes
```typescript
// app/api/login/route.ts
import { withSecureNow } from 'securenow/nextjs-wrapper';

export const POST = withSecureNow(async (request: Request) => {
  const body = await request.json();
  // Your logic...
  return Response.json({ success: true });
});
```

**That's it!** No middleware.ts needed.

📚 **Full guide:** See `NEXTJS-WRAPPER-APPROACH.md`

---

## ⚠️ Middleware Approach (Use with Caution)

### How It Works

Export SecureNow's middleware to capture bodies **before your handlers**:

```typescript
// middleware.ts
export { middleware } from 'securenow/nextjs-middleware';

export const config = {
  matcher: '/api/:path*',
};
```

### ✅ Pros

- One-time setup (no per-route wrapping)
- Applies to all routes automatically

### ❌ Cons

- **Can conflict with NextAuth** and other middleware
- **May block requests** from reaching handlers
- **All-or-nothing** - applies to all matched routes
- **Runs before routing** - can interfere with request flow
- **May cause "Response body disturbed or locked" errors**

### When to Use

- You have no other middleware
- You want to capture ALL routes
- You're okay with potential conflicts
- **Not recommended if you use NextAuth or have complex middleware**

### Known Issues

**Conflicts with NextAuth:**
```typescript
// ❌ This can cause conflicts
export { middleware } from 'securenow/nextjs-middleware';

// If you also use NextAuth, you'll need complex middleware composition
```

**Solution:** Use the wrapper approach instead!

📚 **Full guide:** See `NEXTJS-BODY-CAPTURE.md` (but consider wrapper approach first)

---

## 🔄 Comparison Table

| Feature | Wrapper Approach | Middleware Approach |
|---------|-----------------|---------------------|
| **Setup complexity** | Per-route wrapping | One-time setup |
| **Middleware conflicts** | ✅ None | ⚠️ Possible |
| **NextAuth compatibility** | ✅ Perfect | ❌ Can conflict |
| **Request blocking** | ✅ Never | ⚠️ Possible |
| **Control granularity** | ✅ Per-route | ❌ All-or-nothing |
| **Error impact** | ✅ Isolated | ⚠️ Can block all routes |
| **Recommended for** | ✅ Most users | ⚠️ Simple apps only |

---

## 🎯 Our Recommendation

### For Most Users (Especially with NextAuth)

**Use the Wrapper Approach:**

```typescript
// middleware.ts - Your auth logic (no securenow!)
export async function middleware(request) {
  // Just your middleware - no securenow imports
  const token = await getToken({ req: request });
  if (!token) return NextResponse.redirect('/login');
  return NextResponse.next();
}

// app/api/protected/route.ts - Wrap individual routes
import { withSecureNow } from 'securenow/nextjs-wrapper';

export const POST = withSecureNow(async (request: Request) => {
  // Your handler - no conflicts!
  const body = await request.json();
  return Response.json({ success: true });
});
```

**Why?**
- ✅ Zero conflicts
- ✅ Your middleware stays clean
- ✅ Per-route control
- ✅ Never blocks requests

### For Simple Apps (No Other Middleware)

**You can use Middleware Approach:**

```typescript
// middleware.ts
export { middleware } from 'securenow/nextjs-middleware';

export const config = {
  matcher: '/api/:path*',
};
```

**Why?**
- ✅ One-time setup
- ✅ Auto-applies to all routes
- ⚠️ But be aware of potential conflicts if you add other middleware later

---

## 📊 Real-World Scenarios

### Scenario 1: NextAuth + SecureNow

**❌ Middleware Approach - Can Cause Issues:**
```typescript
// middleware.ts
import { getToken } from 'next-auth/jwt';
import { middleware as securenowMiddleware } from 'securenow/nextjs-middleware';

export async function middleware(request) {
  // Complex composition needed - prone to conflicts
  await securenowMiddleware(request);
  const token = await getToken({ req: request });
  // ...
}
```

**✅ Wrapper Approach - Clean & Safe:**
```typescript
// middleware.ts - Just NextAuth
export async function middleware(request) {
  const token = await getToken({ req: request });
  if (!token) return NextResponse.redirect('/login');
  return NextResponse.next();
}

// app/api/*/route.ts - Add SecureNow per route
import { withSecureNow } from 'securenow/nextjs-wrapper';
export const POST = withSecureNow(handler);
```

### Scenario 2: Rate Limiting + SecureNow

**❌ Middleware Approach:**
```typescript
// Multiple middleware = conflicts
```

**✅ Wrapper Approach:**
```typescript
// middleware.ts - Just rate limiting
export async function middleware(request) {
  await checkRateLimit(request);
  return NextResponse.next();
}

// routes - Add SecureNow
export const POST = withSecureNow(handler);
```

### Scenario 3: Simple API (No Other Middleware)

**✅ Either Approach Works:**

**Option A - Wrapper:**
```typescript
export const POST = withSecureNow(handler);
```

**Option B - Middleware:**
```typescript
export { middleware } from 'securenow/nextjs-middleware';
```

Both work fine when you have no other middleware!

---

## 🚀 Migration Guide

### From Middleware to Wrapper

**Before:**
```typescript
// middleware.ts
export { middleware } from 'securenow/nextjs-middleware';
export const config = { matcher: '/api/:path*' };
```

**After:**
```typescript
// middleware.ts - Delete securenow import!
// (Keep your other middleware like NextAuth)

// app/api/login/route.ts
import { withSecureNow } from 'securenow/nextjs-wrapper';
export const POST = withSecureNow(async (request) => {
  // Your handler
});

// app/api/register/route.ts
import { withSecureNow } from 'securenow/nextjs-wrapper';
export const POST = withSecureNow(async (request) => {
  // Your handler
});
```

**Result:** No more conflicts! 🎉

---

## ✅ Summary

### Quick Decision Guide

**Do you have NextAuth or other middleware?**
- Yes → Use **Wrapper Approach** ✅
- No → Either works, but wrapper is safer

**Do you want per-route control?**
- Yes → Use **Wrapper Approach** ✅
- No → Middleware works

**Do you prioritize zero conflicts?**
- Yes → Use **Wrapper Approach** ✅
- Not critical → Middleware works

**Do you experience "Response body disturbed" errors?**
- Yes → Switch to **Wrapper Approach** ✅

### Bottom Line

**For 90% of users:** Use the **Wrapper Approach** 

It's safer, more flexible, and conflict-free!

📚 **Full documentation:**
- Wrapper: `NEXTJS-WRAPPER-APPROACH.md`
- Middleware: `NEXTJS-BODY-CAPTURE.md`

