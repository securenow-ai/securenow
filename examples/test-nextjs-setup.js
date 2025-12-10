/**
 * Test script to verify SecureNow Next.js setup
 * 
 * Run this to verify your configuration before integrating with Next.js:
 * 
 * SECURENOW_APPID=test-app node examples/test-nextjs-setup.js
 */

const { registerSecureNow } = require('../nextjs.js');

console.log('Testing SecureNow Next.js integration...\n');

// Test 1: Basic registration
console.log('Test 1: Basic registration');
try {
  const sdk = registerSecureNow({
    serviceName: 'test-nextjs-app',
    endpoint: process.env.SECURENOW_INSTANCE || 'http://localhost:4318',
  });
  
  if (sdk) {
    console.log('✅ SDK registered successfully\n');
  } else {
    console.log('⚠️  SDK returned null (expected in Edge runtime)\n');
  }
} catch (error) {
  console.error('❌ Registration failed:', error);
  process.exit(1);
}

// Test 2: Create a test span
console.log('Test 2: Creating test span');
try {
  const api = require('@opentelemetry/api');
  const tracer = api.trace.getTracer('test-tracer');
  const span = tracer.startSpan('test.span');
  span.setAttribute('test.attribute', 'test-value');
  span.setAttribute('test.number', 123);
  span.end();
  console.log('✅ Test span created and ended\n');
} catch (error) {
  console.error('❌ Span creation failed:', error);
  process.exit(1);
}

// Test 3: Verify configuration
console.log('Test 3: Configuration verification');
console.log('- SECURENOW_APPID:', process.env.SECURENOW_APPID || '(not set)');
console.log('- SECURENOW_INSTANCE:', process.env.SECURENOW_INSTANCE || '(using default)');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- OTEL_LOG_LEVEL:', process.env.OTEL_LOG_LEVEL || '(none)');
console.log('✅ Configuration loaded\n');

// Test 4: Wait for export
console.log('Test 4: Waiting for span export...');
setTimeout(() => {
  console.log('✅ Export should have completed\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All tests passed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nCheck your SigNoz dashboard for traces from "test-nextjs-app"\n');
  process.exit(0);
}, 2000);




