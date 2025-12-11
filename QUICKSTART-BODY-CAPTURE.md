# 🚀 Quick Start: Body Capture in Next.js

## ✅ Recommended: Wrapper Approach (No Conflicts!)

This approach **never interferes** with your middleware or routing.

### Step 1: Enable in .env.local

```bash
SECURENOW_APPID=my-app
SECURENOW_INSTANCE=http://signoz:4318
SECURENOW_CAPTURE_BODY=1
```

### Step 2: Wrap Your API Routes

```typescript
// app/api/login/route.ts
import { withSecureNow } from 'securenow/nextjs-wrapper';

export const POST = withSecureNow(async (request: Request) => {
  const body = await request.json();
  
  // Your logic here...
  
  return Response.json({ success: true });
});
```

### Step 3: Keep Your Middleware Clean

```typescript
// middleware.ts - NO securenow imports!
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  // Just your auth logic - securenow doesn't interfere!
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.redirect('/login');
  }
  return NextResponse.next();
}
```

**That's it!** 🎉

---

## What Gets Captured

### ✅ Automatically Captured & Redacted

```typescript
// Request:
{
  "username": "john",
  "password": "secret123",
  "email": "john@example.com"
}

// In your traces (sensitive fields redacted):
{
  "username": "john",
  "password": "[REDACTED]",
  "email": "john@example.com"
}
```

### 🔒 Auto-Redacted Fields (20+)

```
password, passwd, pwd, secret, token, api_key, access_token,
auth, credentials, card, cardnumber, cvv, cvc, ssn, pin, etc.
```

### 📝 Supported Content Types

- ✅ JSON (`application/json`)
- ✅ GraphQL (`application/graphql`)
- ✅ Form data (`application/x-www-form-urlencoded`)
- ℹ️ Multipart (marked as `[MULTIPART - NOT CAPTURED]`)

---

## ✨ Benefits

### Zero Conflicts
- ✅ Works perfectly with NextAuth
- ✅ Works with any middleware
- ✅ Never blocks requests
- ✅ Runs inside your handler (not before)

### Safe & Secure
- ✅ Automatic sensitive data redaction
- ✅ Size limits (configurable)
- ✅ Non-blocking (background capture)
- ✅ Fails silently (never breaks your app)

### Flexible
- ✅ Per-route control (wrap only what you need)
- ✅ Easy to add/remove
- ✅ Works with App Router & Pages Router

---

## 📊 Example: Full API Route

```typescript
import { withSecureNow } from 'securenow/nextjs-wrapper';
import { db } from '@/lib/db';

export const POST = withSecureNow(async (request: Request) => {
  try {
    // Parse body (securenow captures this automatically)
    const { email, password } = await request.json();
    
    // Your business logic
    const user = await db.user.create({
      data: { email, passwordHash: hash(password) }
    });
    
    return Response.json({ 
      success: true, 
      userId: user.id 
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 400 });
  }
});

// Optional: Other methods without capture
export async function GET() {
  const users = await db.user.findMany();
  return Response.json({ users });
}
```

**Trace will show:**
- ✅ HTTP method, path, status
- ✅ Request body: `{"email":"john@example.com","password":"[REDACTED]"}`
- ✅ Response time
- ✅ IP address, user agent
- ✅ All without blocking or interfering!

---

## ⚙️ Configuration

### Environment Variables

```bash
# Required
SECURENOW_APPID=my-nextjs-app
SECURENOW_INSTANCE=http://your-signoz:4318

# Body capture
SECURENOW_CAPTURE_BODY=1                    # Enable body capture
SECURENOW_MAX_BODY_SIZE=10240              # Max size in bytes (10KB default)
SECURENOW_SENSITIVE_FIELDS=email,phone     # Additional fields to redact

# Optional
OTEL_LOG_LEVEL=info                        # Logging level
```

### Custom Sensitive Fields

Add your own fields to redact:

```bash
SECURENOW_SENSITIVE_FIELDS=credit_card_number,ssn,bank_account
```

Now these will also show as `[REDACTED]` in traces!

---

## 🎓 More Examples

### Selective Wrapping

```typescript
// Capture body for login
export const POST = withSecureNow(async (request: Request) => {
  const body = await request.json();
  return Response.json({ success: true });
});

// No capture for public endpoint
export async function GET() {
  return Response.json({ status: 'ok' });
}
```

### With Dynamic Routes

```typescript
// app/api/users/[id]/route.ts
import { withSecureNow } from 'securenow/nextjs-wrapper';

export const PUT = withSecureNow(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const body = await request.json();
  const userId = params.id;
  
  await updateUser(userId, body);
  
  return Response.json({ updated: true });
});
```

### Pages Router

```typescript
// pages/api/login.ts
import { withSecureNow } from 'securenow/nextjs-wrapper';

async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;
    // Your logic...
    res.json({ success: true });
  } else {
    res.status(405).end();
  }
}

export default withSecureNow(handler);
```

---

## 🐛 Troubleshooting

### Q: I'm getting "Response body disturbed or locked" errors

**A:** Don't use the middleware approach! Use the wrapper approach shown above. The wrapper runs inside your handler and never locks the request.

### Q: Bodies aren't being captured

**Check:**
1. Is `SECURENOW_CAPTURE_BODY=1` set in `.env.local`?
2. Did you wrap the route with `withSecureNow()`?
3. Is the request POST/PUT/PATCH?
4. Is content-type `application/json` or similar?

### Q: Can I use this with NextAuth?

**A:** Yes! That's exactly what it's designed for. Your middleware stays clean:

```typescript
// middleware.ts - Just NextAuth, no securenow!
export async function middleware(request) {
  const token = await getToken({ req: request });
  // ...
}

// API routes - Add securenow wrapper
export const POST = withSecureNow(handler);
```

---

## ✅ Summary

**Setup (2 steps):**
1. Set `SECURENOW_CAPTURE_BODY=1` in `.env.local`
2. Wrap routes: `withSecureNow(handler)`

**Result:**
- ✅ Request bodies captured
- ✅ Sensitive fields redacted
- ✅ Zero middleware conflicts
- ✅ Non-blocking & safe
- ✅ Works with NextAuth

**That's it!** 🎊

📚 **More info:**
- `NEXTJS-WRAPPER-APPROACH.md` - Full guide
- `NEXTJS-BODY-CAPTURE-COMPARISON.md` - Comparison with middleware approach

