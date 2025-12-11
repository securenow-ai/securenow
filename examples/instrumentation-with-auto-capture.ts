/**
 * Next.js Instrumentation with Automatic Body Capture
 * 
 * This is the EASIEST way to enable body capture - just one import line!
 * No code changes needed in your handlers.
 */

import { registerSecureNow } from 'securenow/nextjs';
import 'securenow/nextjs-auto-capture'; // ← Add this line for auto body capture!

export function register() {
  registerSecureNow();
}

/**
 * That's it! Now ALL your API routes automatically capture bodies:
 * 
 * app/api/login/route.ts:
 *   export async function POST(request: Request) {
 *     const body = await request.json(); // ← Auto-captured!
 *     return Response.json({ success: true });
 *   }
 * 
 * Benefits:
 * - ✅ Zero code changes in handlers
 * - ✅ No wrapping needed
 * - ✅ No middleware conflicts
 * - ✅ Automatic sensitive data redaction
 * - ✅ Works with NextAuth
 * 
 * Configuration in .env.local:
 *   SECURENOW_APPID=my-app
 *   SECURENOW_INSTANCE=http://signoz:4318
 *   SECURENOW_CAPTURE_BODY=1
 *   SECURENOW_MAX_BODY_SIZE=10240
 *   SECURENOW_SENSITIVE_FIELDS=custom_field
 */

