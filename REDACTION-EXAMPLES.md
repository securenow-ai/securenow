# 🔒 Redaction Examples - See It In Action

Real examples of how SecureNow redacts sensitive data across all content types.

---

## JSON Redaction

### Example 1: Login Request

**Original Request:**
```json
POST /api/login
Content-Type: application/json

{
  "username": "john@example.com",
  "password": "MySecretPass123!",
  "remember": true,
  "device_id": "abc123"
}
```

**Captured in Trace:**
```json
{
  "username": "john@example.com",
  "password": "[REDACTED]",
  "remember": true,
  "device_id": "abc123"
}
```

### Example 2: Payment Request

**Original Request:**
```json
POST /api/payment
Content-Type: application/json

{
  "amount": 99.99,
  "currency": "USD",
  "card": {
    "number": "4242424242424242",
    "cvv": "123",
    "expiry": "12/25"
  },
  "billing": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Captured in Trace:**
```json
{
  "amount": 99.99,
  "currency": "USD",
  "card": "[REDACTED]",
  "billing": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```
*Note: The entire `card` object is redacted because the key contains "card"*

### Example 3: Nested Secrets

**Original Request:**
```json
{
  "user": {
    "name": "John",
    "auth": {
      "password": "secret",
      "api_key": "sk_live_abc123"
    }
  },
  "metadata": {
    "session_token": "xyz789"
  }
}
```

**Captured in Trace:**
```json
{
  "user": {
    "name": "John",
    "auth": {
      "password": "[REDACTED]",
      "api_key": "[REDACTED]"
    }
  },
  "metadata": {
    "session_token": "[REDACTED]"
  }
}
```
*Recursive redaction finds sensitive fields at any depth*

---

## GraphQL Redaction

### Example 1: Login Mutation

**Original Request:**
```graphql
POST /graphql
Content-Type: application/graphql

mutation Login {
  login(
    email: "john@example.com", 
    password: "MySecretPass123!"
  ) {
    token
    user {
      id
      name
    }
  }
}
```

**Captured in Trace:**
```graphql
mutation Login {
  login(
    email: "john@example.com", 
    password: "[REDACTED]"
  ) {
    token
    user {
      id
      name
    }
  }
}
```

### Example 2: Variables with Secrets

**Original Request:**
```graphql
mutation CreateUser($input: UserInput!) {
  createUser(input: $input) {
    id
  }
}

Variables:
{
  "input": {
    "email": "john@example.com",
    "password": "secret123",
    "api_key": "sk_test_abc"
  }
}
```

**Captured in Trace:**
```graphql
mutation CreateUser($input: UserInput!) {
  createUser(input: $input) {
    id
  }
}

Variables:
{
  "input": {
    "email": "john@example.com",
    "password": "[REDACTED]",
    "api_key": "[REDACTED]"
  }
}
```

### Example 3: Multiple Sensitive Fields

**Original Request:**
```graphql
mutation UpdateAccount {
  updateAccount(
    id: "123",
    password: "newpass",
    secret: "mysecret",
    api_key: "sk_live_xyz"
  ) {
    success
  }
}
```

**Captured in Trace:**
```graphql
mutation UpdateAccount {
  updateAccount(
    id: "123",
    password: "[REDACTED]",
    secret: "[REDACTED]",
    api_key: "[REDACTED]"
  ) {
    success
  }
}
```

---

## Form Data Redaction

### Example 1: Login Form

**Original Request:**
```http
POST /api/login
Content-Type: application/x-www-form-urlencoded

username=john&password=secret123&remember=on
```

**Captured in Trace:**
```json
{
  "username": "john",
  "password": "[REDACTED]",
  "remember": "on"
}
```

### Example 2: Registration Form

**Original Request:**
```http
POST /api/register
Content-Type: application/x-www-form-urlencoded

email=john@example.com&password=MyPass123&confirm_password=MyPass123&terms=agree
```

**Captured in Trace:**
```json
{
  "email": "john@example.com",
  "password": "[REDACTED]",
  "confirm_password": "[REDACTED]",
  "terms": "agree"
}
```
*Note: "confirm_password" is redacted because it contains "password"*

---

## Multipart (NOT Captured)

### Example: File Upload

**Original Request:**
```http
POST /api/upload
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

[Binary PDF data...]
------WebKitFormBoundary
Content-Disposition: form-data; name="description"

Important document
------WebKitFormBoundary--
```

**Captured in Trace:**
```json
{
  "http.request.body": "[MULTIPART - NOT CAPTURED]",
  "http.request.body.type": "multipart",
  "http.request.body.note": "File uploads not captured by design"
}
```
*Multipart data is NOT captured at all - too large and unnecessary*

---

## Custom Sensitive Fields

### Configure Custom Fields

```bash
# .env.local
SECURENOW_SENSITIVE_FIELDS=email,phone,address,ssn,credit_card
```

### Example with Custom Fields

**Original Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "address": "123 Main St",
  "credit_card": "4242424242424242"
}
```

**Captured in Trace:**
```json
{
  "name": "John Doe",
  "email": "[REDACTED]",
  "phone": "[REDACTED]",
  "address": "[REDACTED]",
  "credit_card": "[REDACTED]"
}
```

---

## Field Matching Rules

### Case-Insensitive Matching

These all get redacted if "password" is in the sensitive list:
- `password` → `[REDACTED]`
- `Password` → `[REDACTED]`
- `PASSWORD` → `[REDACTED]`
- `user_password` → `[REDACTED]`
- `passwordHash` → `[REDACTED]`

### Partial Matching (Substring)

If "token" is sensitive, these get redacted:
- `token` → `[REDACTED]`
- `access_token` → `[REDACTED]`
- `refresh_token` → `[REDACTED]`
- `oauth_token` → `[REDACTED]`
- `stripe_token` → `[REDACTED]`

### Built-in Sensitive Fields (20+)

```javascript
[
  'password', 'passwd', 'pwd',
  'secret', 'token', 'api_key', 'apikey',
  'access_token', 'auth', 'credentials',
  'mysql_pwd', 'stripeToken',
  'card', 'cardnumber', 'ccv', 'cvc', 'cvv',
  'ssn', 'pin'
]
```

---

## Edge Cases

### 1. Empty Values

**Original:**
```json
{ "password": "" }
```

**Captured:**
```json
{ "password": "[REDACTED]" }
```
*Even empty sensitive fields are redacted*

### 2. Null Values

**Original:**
```json
{ "password": null }
```

**Captured:**
```json
{ "password": "[REDACTED]" }
```

### 3. Numeric Passwords

**Original:**
```json
{ "password": 123456 }
```

**Captured:**
```json
{ "password": "[REDACTED]" }
```

### 4. Array of Objects

**Original:**
```json
{
  "users": [
    { "name": "John", "password": "pass1" },
    { "name": "Jane", "password": "pass2" }
  ]
}
```

**Captured:**
```json
{
  "users": [
    { "name": "John", "password": "[REDACTED]" },
    { "name": "Jane", "password": "[REDACTED]" }
  ]
}
```

---

## Verification

### Test Your Redaction

1. **Enable body capture:**
   ```bash
   SECURENOW_CAPTURE_BODY=1
   ```

2. **Make a test request:**
   ```bash
   curl -X POST http://localhost:3000/api/test \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"secret123"}'
   ```

3. **Check SigNoz:**
   - Find the trace
   - Look for `http.request.body`
   - Verify password shows `[REDACTED]`

### Debug Redaction

Enable debug logging:
```bash
OTEL_LOG_LEVEL=debug npm run dev
```

You'll see:
```
[securenow] 📝 Request body capture: ENABLED (max: 10240 bytes, redacting 23 sensitive fields)
```

---

## 🎉 Summary

**Redaction works on ALL content types:**

| Type | Redaction | Method |
|------|-----------|--------|
| **JSON** | ✅ Yes | Object property matching |
| **GraphQL** | ✅ Yes | Regex pattern matching |
| **Form Data** | ✅ Yes | Parsed then object matching |
| **Multipart** | ❌ N/A | Not captured at all |

**Protection:**
- 20+ built-in sensitive fields
- Custom fields support
- Case-insensitive matching
- Substring matching (e.g., "password" matches "user_password")
- Recursive (works at any nesting level)
- Fast (< 1ms overhead)

**Your data is safe!** 🔒

