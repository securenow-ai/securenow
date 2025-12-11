/**
 * Example: Next.js API Route with Body Capture
 * 
 * This approach is SAFE and NON-INVASIVE:
 * - No middleware conflicts
 * - No blocking
 * - Runs inside your handler
 * - Optional per route
 */

import { withSecureNow } from 'securenow/nextjs-wrapper';

// Option 1: Wrap the entire handler (recommended)
export const POST = withSecureNow(async (request: Request) => {
  // Your normal handler code
  const body = await request.json();
  
  // Do your logic
  const result = await processLogin(body);
  
  return Response.json({ success: true, result });
});

// Option 2: Selective wrapping - only certain routes
export const PUT = withSecureNow(async (request: Request) => {
  const body = await request.json();
  return Response.json({ updated: true });
});

// Option 3: Don't wrap - no body capture for this route
export async function GET(request: Request) {
  // This route won't capture bodies (but still traced!)
  return Response.json({ data: 'hello' });
}

/**
 * Benefits of this approach:
 * 
 * ✅ No middleware conflicts (doesn't run before routing)
 * ✅ No blocking (captures in background)
 * ✅ Per-route control (wrap only what you need)
 * ✅ Works with NextAuth, other middleware
 * ✅ Never interferes with request flow
 * ✅ Automatic sensitive data redaction
 * 
 * Setup:
 * 1. Set SECURENOW_CAPTURE_BODY=1 in .env.local
 * 2. Wrap handlers with withSecureNow()
 * 3. Done! Bodies captured with redaction
 */

