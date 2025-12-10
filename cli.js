#!/usr/bin/env node
'use strict';

/**
 * SecureNow CLI
 * 
 * Usage: npx securenow init [options]
 */

const fs = require('fs');
const path = require('path');

const commands = {
  init: initCommand,
  help: helpCommand,
  version: versionCommand,
};

// Templates
const templates = {
  typescript: `import { registerSecureNow } from 'securenow/nextjs';

export function register() {
  registerSecureNow();
}

/**
 * Configuration via .env.local:
 * 
 * Required:
 *   SECURENOW_APPID=my-nextjs-app
 * 
 * Optional:
 *   SECURENOW_INSTANCE=http://your-signoz-server:4318
 *   OTEL_EXPORTER_OTLP_HEADERS="x-api-key=your-key"
 *   OTEL_LOG_LEVEL=info
 */
`,
  javascript: `const { registerSecureNow } = require('securenow/nextjs');

export function register() {
  registerSecureNow();
}

/**
 * Configuration via .env.local:
 * 
 * Required:
 *   SECURENOW_APPID=my-nextjs-app
 * 
 * Optional:
 *   SECURENOW_INSTANCE=http://your-signoz-server:4318
 *   OTEL_EXPORTER_OTLP_HEADERS="x-api-key=your-key"
 *   OTEL_LOG_LEVEL=info
 */
`,
  env: `# SecureNow Configuration
# Required: Your application identifier
SECURENOW_APPID=my-nextjs-app

# Optional: Your SigNoz/OpenTelemetry collector endpoint
# Default: http://46.62.173.237:4318
SECURENOW_INSTANCE=http://your-signoz-server:4318

# Optional: API key or authentication headers
# OTEL_EXPORTER_OTLP_HEADERS="x-api-key=your-api-key-here"

# Optional: Log level (debug|info|warn|error)
# OTEL_LOG_LEVEL=info
`,
};

function initCommand(args) {
  const flags = parseFlags(args);
  const cwd = process.cwd();
  
  console.log('\n🚀 SecureNow Setup\n');
  
  // Check if Next.js project
  const isNextJs = isNextJsProject(cwd);
  if (!isNextJs && !flags.force) {
    console.log('⚠️  This doesn\'t appear to be a Next.js project.');
    console.log('   If you want to proceed anyway, use: npx securenow init --force\n');
    process.exit(1);
  }
  
  // Determine TypeScript or JavaScript
  const useTypeScript = flags.typescript || 
                        (!flags.javascript && fs.existsSync(path.join(cwd, 'tsconfig.json')));
  
  // Determine if using src folder
  const useSrc = flags.src || 
                 (!flags.root && fs.existsSync(path.join(cwd, 'src')));
  
  // Construct file paths
  const fileName = useTypeScript ? 'instrumentation.ts' : 'instrumentation.js';
  const filePath = useSrc 
    ? path.join(cwd, 'src', fileName)
    : path.join(cwd, fileName);
  
  // Check if file already exists
  if (fs.existsSync(filePath) && !flags.force) {
    console.log(`❌ ${useSrc ? 'src/' : ''}${fileName} already exists`);
    console.log('   Use --force to overwrite\n');
    process.exit(1);
  }
  
  // Create instrumentation file
  try {
    const template = useTypeScript ? templates.typescript : templates.javascript;
    
    // Ensure src directory exists if needed
    if (useSrc) {
      fs.mkdirSync(path.join(cwd, 'src'), { recursive: true });
    }
    
    fs.writeFileSync(filePath, template, 'utf8');
    console.log(`✅ Created ${useSrc ? 'src/' : ''}${fileName}`);
  } catch (error) {
    console.error(`❌ Failed to create instrumentation file: ${error.message}\n`);
    process.exit(1);
  }
  
  // Create .env.local if it doesn't exist
  const envPath = path.join(cwd, '.env.local');
  if (!fs.existsSync(envPath) || flags.force) {
    try {
      fs.writeFileSync(envPath, templates.env, 'utf8');
      console.log('✅ Created .env.local template');
    } catch (error) {
      console.warn(`⚠️  Could not create .env.local: ${error.message}`);
    }
  } else {
    console.log('ℹ️  .env.local already exists (skipped)');
  }
  
  // Success message
  console.log('\n┌─────────────────────────────────────────────────┐');
  console.log('│  🎉 Setup Complete!                             │');
  console.log('│                                                 │');
  console.log('│  Next steps:                                    │');
  console.log('│                                                 │');
  console.log('│  1. Edit .env.local and configure:             │');
  console.log('│     SECURENOW_APPID=your-app-name              │');
  console.log('│     SECURENOW_INSTANCE=http://signoz:4318      │');
  console.log('│                                                 │');
  console.log('│  2. Start your Next.js app: npm run dev        │');
  console.log('│                                                 │');
  console.log('│  3. Check SigNoz dashboard for traces!         │');
  console.log('│                                                 │');
  console.log('│  📚 Documentation:                              │');
  console.log('│     node_modules/securenow/NEXTJS-GUIDE.md     │');
  console.log('└─────────────────────────────────────────────────┘\n');
}

function helpCommand() {
  console.log(`
SecureNow CLI - OpenTelemetry instrumentation for Next.js

USAGE:
  npx securenow <command> [options]

COMMANDS:
  init        Initialize SecureNow in your Next.js project
  help        Show this help message
  version     Show package version

OPTIONS:
  --typescript, --ts    Force TypeScript (creates instrumentation.ts)
  --javascript, --js    Force JavaScript (creates instrumentation.js)
  --src                 Create file in src/ folder
  --root                Create file in project root
  --force, -f           Overwrite existing files

EXAMPLES:
  # Auto-detect and setup
  npx securenow init

  # Force TypeScript in src folder
  npx securenow init --typescript --src

  # Force JavaScript in root
  npx securenow init --javascript --root

  # Overwrite existing files
  npx securenow init --force

DOCUMENTATION:
  Quick Start: node_modules/securenow/NEXTJS-QUICKSTART.md
  Full Guide:  node_modules/securenow/NEXTJS-GUIDE.md
  Examples:    node_modules/securenow/examples/
`);
}

function versionCommand() {
  try {
    const packageJson = require('./package.json');
    console.log(`securenow v${packageJson.version}`);
  } catch (error) {
    console.log('securenow (version unknown)');
  }
}

// Utility functions
function parseFlags(args) {
  const flags = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--typescript' || arg === '--ts') {
      flags.typescript = true;
    } else if (arg === '--javascript' || arg === '--js') {
      flags.javascript = true;
    } else if (arg === '--src') {
      flags.src = true;
    } else if (arg === '--root') {
      flags.root = true;
    } else if (arg === '--force' || arg === '-f') {
      flags.force = true;
    }
  }
  
  return flags;
}

function isNextJsProject(dir) {
  try {
    const packageJsonPath = path.join(dir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return false;
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    return !!deps.next;
  } catch (error) {
    return false;
  }
}

// Main
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const commandFn = commands[command];
  
  if (!commandFn) {
    console.error(`Unknown command: ${command}`);
    console.log('Run "npx securenow help" for usage\n');
    process.exit(1);
  }
  
  commandFn(args.slice(1));
}

if (require.main === module) {
  main();
}

module.exports = { main };




