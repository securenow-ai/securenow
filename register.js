// securenow/preload.js
'use strict';

// load .env into process.env before anything else
try {
  require('dotenv').config();
  console.log('[securenow] dotenv loaded from', process.env.DOTENV_CONFIG_PATH || '.env');
} catch (e) {
  // dotenv is optional — only warn if it’s missing
  console.warn('[securenow] dotenv not found or failed to load');
}

// then run the real tracer preload
require('./tracing');
