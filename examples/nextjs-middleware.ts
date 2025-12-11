/**
 * Next.js Middleware with SecureNow Body Capture
 * 
 * Place this file as: middleware.ts (in your project root or src/)
 * 
 * This single line enables automatic body capture for all API routes!
 */

// Just export the middleware from securenow - that's it!
export { middleware } from 'securenow/nextjs-middleware';

// Optional: Configure which routes to apply to
export const config = {
  matcher: '/api/:path*',  // Apply to all API routes
  
  // Or be more specific:
  // matcher: ['/api/login', '/api/register', '/api/graphql'],
  
  // Or apply to everything:
  // matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};

/**
 * That's it! Request bodies are now automatically captured with:
 * - Sensitive fields redacted (passwords, tokens, cards, etc.)
 * - Size limits enforced
 * - All content types supported (JSON, GraphQL, Form)
 * - Zero impact on request processing
 * 
 * Configure via environment variables:
 *   SECURENOW_MAX_BODY_SIZE=20480
 *   SECURENOW_SENSITIVE_FIELDS=email,phone,address
 */

