# 📝 Request Body Capture - Quick Start

## Enable in 30 Seconds

### Step 1: Enable
Add to `.env.local`:
```bash
SECURENOW_CAPTURE_BODY=1
```

### Step 2: Deploy
```bash
npm run dev  # or deploy to production
```

### Step 3: Done! ✅

All POST/PUT/PATCH request bodies are now captured with sensitive data automatically redacted!

---

## What Gets Captured (ALL with Auto-Redaction!)

✅ **JSON** - API payloads (objects redacted)  
✅ **GraphQL** - Queries and mutations (arguments/variables redacted)  
✅ **Form Data** - Form submissions (parsed and redacted)  
❌ **File Uploads** - NOT captured at all (by design)

---

## Security Built-In

These fields are **automatically redacted**:
- `password`, `token`, `api_key`, `secret`
- `access_token`, `auth`, `credentials`
- `card`, `cardnumber`, `cvv`, `ssn`
- And 15+ more sensitive fields

**Example:**
```json
// Original
{"username": "john", "password": "secret123"}

// Captured
{"username": "john", "password": "[REDACTED]"}
```

---

## Configuration Options

```bash
# Enable capture (required)
SECURENOW_CAPTURE_BODY=1

# Max body size in bytes (default: 10KB)
SECURENOW_MAX_BODY_SIZE=20480

# Add custom sensitive fields to redact
SECURENOW_SENSITIVE_FIELDS=email,phone,address
```

---

## View in SigNoz

Query for captured bodies:
```
http.request.body IS NOT NULL
```

See specific endpoint:
```
http.target = "/api/checkout"
AND http.request.body CONTAINS "product"
```

---

## Examples

### Next.js API Route
```typescript
// app/api/login/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  // Body automatically captured in traces!
  return Response.json({ success: true });
}
```

### Express.js
```javascript
app.post('/api/login', (req, res) => {
  // req.body automatically captured!
  res.json({ success: true });
});
```

---

## Safety Features

✅ **Size limits** - Bodies over limit show `[TOO LARGE]`  
✅ **Auto-redaction** - 20+ sensitive fields protected  
✅ **Type detection** - JSON, GraphQL, Form parsed correctly  
✅ **No file capture** - Multipart uploads excluded  
✅ **Fast** - < 1ms overhead per request

---

## Common Use Cases

1. **Debug API errors** - See exact input that caused error
2. **Monitor GraphQL** - Track slow queries
3. **Validate inputs** - Understand user input patterns
4. **Track features** - See which API features are used
5. **Security analysis** - Detect malicious payloads

---

## Privacy Notes

⚠️ Request bodies may contain personal data

**Best practices:**
- Add relevant fields to `SECURENOW_SENSITIVE_FIELDS`
- Set appropriate retention in SigNoz
- Document in privacy policy
- Consider GDPR/CCPA requirements

---

## Full Documentation

See [REQUEST-BODY-CAPTURE.md](./REQUEST-BODY-CAPTURE.md) for:
- Complete security guide
- GDPR compliance tips
- Advanced configuration
- Performance optimization
- Troubleshooting
- FAQ

---

**That's it!** Enable with one environment variable, get full request visibility with automatic security. 🔒

