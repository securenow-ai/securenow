# 📝 Request Body Capture - Complete Guide

SecureNow can automatically capture and trace request bodies (JSON, GraphQL, Form data) with built-in security controls!

---

## 🚀 Quick Start

### Enable Body Capture

Add to your `.env.local` or environment variables:

```bash
# Enable request body capture
SECURENOW_CAPTURE_BODY=1

# Optional: Set max body size (default: 10KB)
SECURENOW_MAX_BODY_SIZE=20480

# Optional: Add custom sensitive fields to redact
SECURENOW_SENSITIVE_FIELDS=credit_card,email,phone
```

**That's it!** Request bodies are now captured automatically with sensitive data redacted.

---

## 📊 What Gets Captured

### ✅ Supported Content Types (ALL with Redaction!)

1. **JSON** (`application/json`) - ✅ Fully Redacted
   ```json
   {
     "username": "john",
     "password": "[REDACTED]",
     "email": "john@example.com"
   }
   ```
   Sensitive object properties are automatically redacted.

2. **GraphQL** (`application/graphql`) - ✅ Fully Redacted
   ```graphql
   mutation Login {
     login(username: "john", password: "[REDACTED]") {
       token
     }
   }
   ```
   Sensitive fields in queries, mutations, and variables are redacted using regex pattern matching.

3. **Form Data** (`application/x-www-form-urlencoded`) - ✅ Fully Redacted
   ```
   username=john&password=[REDACTED]&remember=true
   ```
   Parsed into object and sensitive fields redacted.

4. **Multipart** (`multipart/form-data`) - ❌ NOT Captured
   ```
   [MULTIPART - NOT CAPTURED]
   ```
   *File uploads are not captured at all (by design) - too large and unnecessary*

### ❌ What's NOT Captured

- GET requests (no body)
- File uploads (too large)
- Bodies larger than max size
- Binary data
- Non-POST/PUT/PATCH requests

---

## 🔒 Security Features

### Automatic Sensitive Field Redaction

These fields are **automatically redacted**:

```javascript
// Built-in sensitive fields
[
  'password', 'passwd', 'pwd',
  'secret', 'token', 'api_key', 'apikey',
  'access_token', 'auth', 'credentials',
  'mysql_pwd', 'stripeToken',
  'card', 'cardnumber', 'ccv', 'cvc', 'cvv',
  'ssn', 'pin'
]
```

**Example:**
```json
// Original request
{
  "username": "john",
  "password": "super_secret_123",
  "api_key": "sk_live_..."
}

// Captured in trace
{
  "username": "john",
  "password": "[REDACTED]",
  "api_key": "[REDACTED]"
}
```

### Add Custom Sensitive Fields

```bash
# Add your own sensitive fields
SECURENOW_SENSITIVE_FIELDS=credit_card,email,phone,address,dob
```

Now these fields will also be redacted:
```json
{
  "username": "john",
  "email": "[REDACTED]",
  "phone": "[REDACTED]",
  "address": "[REDACTED]"
}
```

### Size Limits

```bash
# Default: 10KB (10240 bytes)
SECURENOW_MAX_BODY_SIZE=10240

# Increase for larger payloads
SECURENOW_MAX_BODY_SIZE=50000

# Bodies larger than this show: [TOO LARGE: X bytes]
```

---

## 💡 Usage Examples

### Next.js API Route

```typescript
// app/api/users/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  // Body is automatically captured in traces!
  // password fields are redacted
  
  return Response.json({ success: true });
}
```

**Trace will show:**
```json
{
  "http.request.body": "{\"username\":\"john\",\"password\":\"[REDACTED]\"}",
  "http.request.body.size": 156,
  "http.request.body.type": "json"
}
```

### Express.js

```javascript
// server.js
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/login', (req, res) => {
  // req.body is automatically captured!
  // Sensitive fields are redacted
  
  res.json({ success: true });
});
```

### GraphQL

```typescript
// GraphQL queries are captured WITH REDACTION
POST /graphql
Content-Type: application/graphql

mutation Login {
  login(username: "john", password: "secret123", token: "abc") {
    user { name }
  }
}
```

**Trace shows (with sensitive fields redacted):**
```json
{
  "http.request.body": "mutation Login { login(username: \"john\", password: \"[REDACTED]\", token: \"[REDACTED]\") { user { name } } }",
  "http.request.body.type": "graphql",
  "http.request.body.size": 245
}
```

**GraphQL redaction works on:**
- Arguments: `password: "value"` → `password: "[REDACTED]"`
- Variables: `$token: "value"` → `$token: "[REDACTED]"`
- Inline values in queries and mutations

---

## 🎯 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECURENOW_CAPTURE_BODY` | `0` (disabled) | Enable body capture |
| `SECURENOW_MAX_BODY_SIZE` | `10240` (10KB) | Maximum body size to capture |
| `SECURENOW_SENSITIVE_FIELDS` | `` | Comma-separated custom sensitive fields |

### Programmatic (Next.js)

```typescript
// instrumentation.ts
import { registerSecureNow } from 'securenow/nextjs';

export function register() {
  registerSecureNow({
    serviceName: 'my-app',
    captureBody: true, // Enable body capture
  });
}
```

---

## 🔍 Viewing in SigNoz

### Query Examples

**Find all requests with specific body content:**
```
http.request.body CONTAINS "username"
```

**Find failed login attempts:**
```
http.target = "/api/login" 
AND http.status_code = 401
```

**Group by API endpoint and body size:**
```sql
SELECT 
  http.target,
  AVG(http.request.body.size) as avg_body_size,
  COUNT(*) as requests
FROM spans
WHERE http.request.body.size IS NOT NULL
GROUP BY http.target
ORDER BY avg_body_size DESC
```

**Find large payloads:**
```
http.request.body.size > 5000
```

---

## ⚠️ Privacy & Compliance

### GDPR Considerations

Request bodies may contain personal data. Consider:

1. **Legal Basis** - Ensure you have legitimate interest or consent
2. **Data Minimization** - Only capture what you need
3. **Retention** - Configure SigNoz retention policies
4. **Anonymization** - Add more fields to redact list

### PCI-DSS Compliance

**Never capture card data!** Built-in protection:
- `card`, `cardnumber`, `cvv`, `cvc` → Automatically redacted
- `stripeToken` → Automatically redacted

Add more if needed:
```bash
SECURENOW_SENSITIVE_FIELDS=cardName,cardExpiry,cardCvv
```

### HIPAA Compliance

Add health-related fields:
```bash
SECURENOW_SENSITIVE_FIELDS=ssn,medical_record,diagnosis,prescription
```

---

## 🎓 Best Practices

### ✅ DO

1. **Enable in development first** - Test thoroughly
2. **Add custom sensitive fields** - For your specific use case
3. **Set appropriate size limits** - Balance detail vs storage
4. **Monitor storage usage** - Bodies increase trace size
5. **Document what you capture** - In privacy policy

### ❌ DON'T

1. **Don't capture in production without review** - Check privacy implications
2. **Don't increase size limits too much** - Can impact performance
3. **Don't rely on it for audit logs** - Use dedicated audit logging
4. **Don't capture file uploads** - Too large and unnecessary
5. **Don't forget about retention** - Old data should be deleted

---

## 🐛 Debugging

### Body Not Captured?

**Check:**

1. **Is capture enabled?**
   ```bash
   SECURENOW_CAPTURE_BODY=1
   ```

2. **Is it a supported method?**
   - Only POST, PUT, PATCH
   - Not GET, DELETE, HEAD

3. **Is it a supported content type?**
   - JSON: ✅
   - GraphQL: ✅
   - Form: ✅
   - Multipart: ❌ (by design)

4. **Is body size within limit?**
   ```bash
   # Increase if needed
   SECURENOW_MAX_BODY_SIZE=50000
   ```

5. **Check console on startup:**
   ```
   [securenow] 📝 Request body capture: ENABLED
   ```

### Partial Body Captured?

Bodies are truncated if they exceed `maxBodySize`. Increase the limit:

```bash
SECURENOW_MAX_BODY_SIZE=50000
```

### Sensitive Data Not Redacted?

Add the field name:

```bash
SECURENOW_SENSITIVE_FIELDS=mySecretField,anotherSecret
```

Field matching is case-insensitive and uses `includes()`:
- `password` matches `password`, `Password`, `user_password`
- `token` matches `token`, `access_token`, `oauth_token`

---

## 📈 Performance Impact

### Overhead

- **Memory:** ~10-50KB per request (for body storage)
- **CPU:** < 1ms for redaction
- **Storage:** Increases trace size by body size

### Optimization Tips

1. **Set reasonable size limits**
   ```bash
   SECURENOW_MAX_BODY_SIZE=10240  # 10KB
   ```

2. **Only enable where needed**
   ```typescript
   // Enable only for specific environments
   if (process.env.NODE_ENV === 'development') {
     process.env.SECURENOW_CAPTURE_BODY = '1';
   }
   ```

3. **Filter in SigNoz**
   - Use sampling to reduce volume
   - Set up trace tail sampling

---

## 🎯 Use Cases

### 1. Debug API Issues

**Problem:** Users report API errors but you can't reproduce

**Solution:** Capture body to see exact input
```
http.target = "/api/checkout" 
AND http.status_code >= 400
```

View `http.request.body` to see what caused the error.

### 2. Monitor GraphQL Queries

**Problem:** Need to optimize slow GraphQL queries

**Solution:** Capture GraphQL bodies
```
http.request.body CONTAINS "query"
AND duration > 1000ms
```

See which queries are slow.

### 3. Track Feature Usage

**Problem:** Want to know which API features are used

**Solution:** Analyze request bodies
```sql
SELECT 
  COUNT(*) as usage,
  http.request.body
FROM spans
WHERE http.target = "/api/features"
GROUP BY http.request.body
```

### 4. Validate Input Patterns

**Problem:** Need to understand common input patterns

**Solution:** Review captured bodies
```
http.target = "/api/search"
AND http.method = "POST"
```

---

## 🔧 Advanced Configuration

### Custom Redaction Logic

For more complex redaction, you can use OpenTelemetry SpanProcessor:

```typescript
// instrumentation.ts
import { trace } from '@opentelemetry/api';
import { registerSecureNow } from 'securenow/nextjs';

class CustomRedactionProcessor {
  onStart(span) {
    // Custom logic here
  }
  
  onEnd(span) {
    const body = span.attributes['http.request.body'];
    if (body && typeof body === 'string') {
      // Apply custom redaction
      const redacted = body.replace(/\b\d{16}\b/g, '[CARD]'); // Redact card numbers
      span.setAttribute('http.request.body', redacted);
    }
  }
}

export function register() {
  registerSecureNow({ captureBody: true });
  
  // Add custom processor
  trace.getTracerProvider()
    .addSpanProcessor(new CustomRedactionProcessor());
}
```

### Conditional Capture

Enable only for specific routes:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Enable body capture only for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    process.env.SECURENOW_CAPTURE_BODY = '1';
  }
  
  return NextResponse.next();
}
```

---

## ❓ FAQ

### Q: Will this capture passwords?

**A:** No! Passwords are automatically redacted. Any field with `password`, `passwd`, or `pwd` in the name shows `[REDACTED]`.

### Q: What about credit cards?

**A:** Automatically redacted. Fields with `card`, `cardnumber`, `cvv`, `cvc` are protected.

### Q: Can I disable redaction?

**A:** Not recommended! But you can clear the sensitive fields list (⚠️ dangerous):
```bash
SECURENOW_SENSITIVE_FIELDS=""  # Don't do this!
```

### Q: Does this work with file uploads?

**A:** No, multipart/form-data is not captured (by design). Only metadata is logged.

### Q: What's the performance impact?

**A:** Minimal. < 1ms CPU overhead, ~10-50KB memory per request.

### Q: Can I capture response bodies too?

**A:** Not yet. Feature coming soon! Track issue #XXX.

### Q: Is this GDPR compliant?

**A:** Depends on your use case. Review privacy implications and:
- Add relevant fields to redaction list
- Set appropriate retention
- Document in privacy policy

---

## 🎉 Summary

**Enable request body capture in 3 steps:**

1. ```bash
   SECURENOW_CAPTURE_BODY=1
   ```

2. ```bash
   # Optional: customize
   SECURENOW_MAX_BODY_SIZE=20480
   SECURENOW_SENSITIVE_FIELDS=email,phone
   ```

3. **Deploy!** Bodies are captured with sensitive data automatically redacted.

**View in SigNoz:**
- `http.request.body` - The captured body (redacted)
- `http.request.body.size` - Body size in bytes
- `http.request.body.type` - Content type (json, graphql, form)

---

**Made with security in mind** 🔒

