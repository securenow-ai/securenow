// node_modules/securenow/register-vite.js  (CommonJS, for -r)
'use strict';

try {
  require('dotenv').config();
  console.log('[securenow] dotenv loaded for Vite preload');
} catch {
  console.log('[securenow] dotenv not available, continuing without .env');
}

// Trace the Node process (Vite dev/preview server) using your existing Node tracer
module.exports = require('./web-vite.mjs');
