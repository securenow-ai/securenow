# 📊 Automatic IP and Request Metadata Capture

SecureNow automatically captures user IP addresses and detailed request metadata in your Next.js traces!

---

## ✅ What Gets Captured Automatically

### 🌐 Client Information
- **IP Address** (`http.client_ip`)
  - From `x-forwarded-for` (Vercel, most proxies)
  - From `x-real-ip`
  - From `cf-connecting-ip` (Cloudflare)
  - From `x-client-ip`
  - From socket `remoteAddress`

### 📱 Request Details
- **User Agent** (`http.user_agent`) - Browser/device info
- **Referer** (`http.referer`) - Where the user came from
- **Host** (`http.host`) - Your domain
- **Scheme** (`http.scheme`) - http or https
- **Request ID** (`http.request_id`) - Correlation ID if present

### 🌍 Geographic Data (when available)
- **Country** (`http.geo.country`)
  - From Vercel: `x-vercel-ip-country`
  - From Cloudflare: `cf-ipcountry`
- **Region** (`http.geo.region`) - From `x-vercel-ip-country-region`
- **City** (`http.geo.city`) - From `x-vercel-ip-city`

### 📊 Response Data
- **Status Code** (`http.status_code`) - 200, 404, 500, etc.

---

## 🚀 Usage

**No configuration needed!** Just use SecureNow:

```typescript
// instrumentation.ts
import { registerSecureNow } from 'securenow/nextjs';

export function register() {
  registerSecureNow();
}
```

That's it! All request metadata is automatically captured.

---

## 📈 View in SigNoz

In your SigNoz dashboard, you'll see these attributes on every span:

```json
{
  "http.client_ip": "203.0.113.45",
  "http.user_agent": "Mozilla/5.0...",
  "http.referer": "https://google.com",
  "http.host": "your-app.vercel.app",
  "http.scheme": "https",
  "http.status_code": 200,
  "http.geo.country": "US",
  "http.geo.region": "CA",
  "http.geo.city": "San Francisco"
}
```

---

## 🔍 Use Cases

### 1. Debug Location-Specific Issues
Filter traces by country/region to debug geographic problems:
```
http.geo.country = "JP" AND http.status_code >= 500
```

### 2. Track User Journey
Follow a specific user through your app using IP:
```
http.client_ip = "203.0.113.45"
```

### 3. Monitor Bot Traffic
Identify and filter bot requests:
```
http.user_agent CONTAINS "bot" OR http.user_agent CONTAINS "crawler"
```

### 4. Analyze Referer Sources
See where your traffic comes from:
```
GROUP BY http.referer
```

### 5. Performance by Region
Compare response times across regions:
```
AVG(duration) GROUP BY http.geo.country
```

---

## 🛠️ Customization

### Option 1: Add More Attributes

You can add custom attributes in your Next.js code:

```typescript
// In your API route or server component
import { trace } from '@opentelemetry/api';

export async function GET(request: Request) {
  const span = trace.getActiveSpan();
  
  if (span) {
    // Add custom attributes
    span.setAttributes({
      'user.id': getUserId(request),
      'user.subscription': 'premium',
      'request.path': new URL(request.url).pathname,
    });
  }
  
  // Your code...
}
```

### Option 2: Disable Auto-Capture

If you don't want automatic IP capture, you can use a simpler configuration:

```typescript
// instrumentation.ts
import { registerSecureNow } from 'securenow/nextjs';

export function register() {
  // This will use the simple @vercel/otel default
  // (no automatic IP capture)
  process.env.SECURENOW_SIMPLE_MODE = '1';
  registerSecureNow();
}
```

---

## 🔒 Privacy Considerations

### IP Address Handling

**By default, SecureNow captures IP addresses.** Consider these privacy aspects:

1. **GDPR Compliance**
   - IP addresses are considered personal data under GDPR
   - Ensure you have legal basis for processing
   - Consider anonymizing IPs in some regions

2. **Data Retention**
   - Configure SigNoz retention policies
   - Consider shorter retention for IP data

3. **Anonymization Option**

```typescript
// Custom middleware to anonymize IPs
import { trace } from '@opentelemetry/api';

export function middleware(request: NextRequest) {
  const span = trace.getActiveSpan();
  
  if (span) {
    const ip = request.ip || 'unknown';
    // Anonymize last octet: 203.0.113.45 → 203.0.113.0
    const anonymized = ip.replace(/\.\d+$/, '.0');
    span.setAttribute('http.client_ip', anonymized);
  }
  
  return NextResponse.next();
}
```

---

## 🎯 Examples

### Example 1: Geographic Load Balancing Debugging

**Problem:** Users in Asia report slow performance

**Solution:** Query traces by region
```
http.geo.country IN ["JP", "CN", "KR"] 
AND duration > 1000ms
```

### Example 2: Bot Detection

**Problem:** Suspicious traffic patterns

**Solution:** Filter by user agent
```
http.user_agent CONTAINS "bot" 
OR http.user_agent CONTAINS "crawler"
OR http.user_agent CONTAINS "spider"
```

### Example 3: Referer Analysis

**Problem:** Want to track marketing campaigns

**Solution:** Group by referer
```
http.referer CONTAINS "utm_source"
GROUP BY http.referer
```

### Example 4: Rate Limiting Analysis

**Problem:** Need to identify IPs hitting rate limits

**Solution:** Track by IP and status
```
http.status_code = 429
GROUP BY http.client_ip
ORDER BY COUNT DESC
```

---

## 📊 Dashboard Queries

### Top Countries by Traffic
```sql
SELECT 
  http.geo.country,
  COUNT(*) as requests,
  AVG(duration) as avg_duration
FROM spans
WHERE http.geo.country IS NOT NULL
GROUP BY http.geo.country
ORDER BY requests DESC
LIMIT 10
```

### Slowest Requests by Region
```sql
SELECT 
  http.geo.country,
  http.target,
  MAX(duration) as max_duration
FROM spans
WHERE http.geo.country IS NOT NULL
GROUP BY http.geo.country, http.target
ORDER BY max_duration DESC
LIMIT 20
```

### Error Rate by User Agent
```sql
SELECT 
  http.user_agent,
  COUNT(*) as total,
  SUM(CASE WHEN http.status_code >= 400 THEN 1 ELSE 0 END) as errors,
  (errors / total * 100) as error_rate
FROM spans
GROUP BY http.user_agent
ORDER BY error_rate DESC
LIMIT 10
```

---

## 🔧 Technical Details

### How It Works

1. **HttpInstrumentation** intercepts incoming HTTP requests
2. **requestHook** extracts headers and metadata
3. **Attributes** are added to the active span
4. **Data flows** to SigNoz with the trace

### Headers Priority

IP address is extracted in this order:
1. `x-forwarded-for` (first IP in list)
2. `x-real-ip`
3. `cf-connecting-ip` (Cloudflare)
4. `x-client-ip`
5. `socket.remoteAddress`

### Performance Impact

- **Minimal overhead:** < 1ms per request
- **No blocking:** Runs async with request processing
- **Fail-safe:** Errors don't break requests

---

## ❓ FAQ

### Q: Is this GDPR compliant?

**A:** IP addresses are personal data. Ensure you:
- Have legal basis (legitimate interest, consent, etc.)
- Document in privacy policy
- Configure appropriate retention
- Consider anonymization for EU users

### Q: Can I disable IP capture?

**A:** Yes, use simple mode:
```typescript
process.env.SECURENOW_SIMPLE_MODE = '1';
registerSecureNow();
```

### Q: Does this work on Edge Runtime?

**A:** Currently only Node.js runtime is supported. Edge runtime support coming soon.

### Q: What about bot traffic?

**A:** Bot traffic is captured automatically. Filter using:
```
http.user_agent NOT CONTAINS "bot"
```

### Q: Can I capture custom headers?

**A:** Yes! Use OpenTelemetry API:
```typescript
import { trace } from '@opentelemetry/api';

const span = trace.getActiveSpan();
span.setAttribute('custom.header', request.headers.get('x-custom'));
```

---

## 🎉 Summary

SecureNow automatically captures:
- ✅ IP addresses (multiple sources)
- ✅ User agents
- ✅ Referers
- ✅ Geographic data (Vercel/Cloudflare)
- ✅ Request/response metadata

**Zero configuration required** - it just works!

View everything in SigNoz for powerful analytics and debugging.

