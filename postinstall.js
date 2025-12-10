#!/usr/bin/env node
'use strict';

/**
 * SecureNow Post-Install Script
 * 
 * Automatically detects Next.js projects and offers to create instrumentation file
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Check if we're in a Next.js project
function isNextJsProject() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) return false;
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    return !!deps.next;
  } catch (error) {
    return false;
  }
}

// Check if instrumentation file already exists
function hasInstrumentationFile() {
  const files = [
    'instrumentation.ts',
    'instrumentation.js',
    'src/instrumentation.ts',
    'src/instrumentation.js'
  ];
  
  return files.some(file => fs.existsSync(path.join(process.cwd(), file)));
}

// Create TypeScript instrumentation file
function createTsInstrumentation(targetPath) {
  const content = `import { registerSecureNow } from 'securenow/nextjs';

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
`;
  
  fs.writeFileSync(targetPath, content, 'utf8');
}

// Create JavaScript instrumentation file
function createJsInstrumentation(targetPath) {
  const content = `const { registerSecureNow } = require('securenow/nextjs');

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
`;
  
  fs.writeFileSync(targetPath, content, 'utf8');
}

// Create .env.local template
function createEnvTemplate(targetPath) {
  const content = `# SecureNow Configuration
# Required: Your application identifier
SECURENOW_APPID=my-nextjs-app

# Optional: Your SigNoz/OpenTelemetry collector endpoint
# Default: http://46.62.173.237:4318
SECURENOW_INSTANCE=http://your-signoz-server:4318

# Optional: API key or authentication headers
# OTEL_EXPORTER_OTLP_HEADERS="x-api-key=your-api-key-here"

# Optional: Log level (debug|info|warn|error)
# OTEL_LOG_LEVEL=info
`;
  
  fs.writeFileSync(targetPath, content, 'utf8');
}

// Check if TypeScript is used
function isTypeScriptProject() {
  return fs.existsSync(path.join(process.cwd(), 'tsconfig.json'));
}

// Main setup function
async function setup() {
  // Skip if not in Next.js project
  if (!isNextJsProject()) {
    console.log('[securenow] Not a Next.js project, skipping auto-setup');
    return;
  }
  
  // Skip if instrumentation file already exists
  if (hasInstrumentationFile()) {
    console.log('[securenow] ✅ Instrumentation file already exists');
    return;
  }
  
  console.log('\n┌─────────────────────────────────────────────────┐');
  console.log('│  🎉 SecureNow installed successfully!          │');
  console.log('│  Next.js project detected                       │');
  console.log('└─────────────────────────────────────────────────┘\n');
  
  // Check if we're in CI/non-interactive environment
  if (process.env.CI || !process.stdin.isTTY) {
    console.log('[securenow] ℹ️  Non-interactive environment detected');
    console.log('[securenow] 💡 To complete setup, run: npx securenow init');
    return;
  }
  
  // Ask user if they want to auto-setup
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Would you like to automatically create instrumentation file? (Y/n) ', (answer) => {
    const shouldCreate = !answer || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
    
    if (!shouldCreate) {
      console.log('\n[securenow] No problem! To setup later, run: npx securenow init');
      rl.close();
      return;
    }
    
    try {
      const useTypeScript = isTypeScriptProject();
      const srcExists = fs.existsSync(path.join(process.cwd(), 'src'));
      
      // Determine file path
      const fileName = useTypeScript ? 'instrumentation.ts' : 'instrumentation.js';
      const filePath = srcExists 
        ? path.join(process.cwd(), 'src', fileName)
        : path.join(process.cwd(), fileName);
      
      // Create instrumentation file
      if (useTypeScript) {
        createTsInstrumentation(filePath);
      } else {
        createJsInstrumentation(filePath);
      }
      
      console.log(`\n✅ Created ${srcExists ? 'src/' : ''}${fileName}`);
      
      // Create .env.local if it doesn't exist
      const envPath = path.join(process.cwd(), '.env.local');
      if (!fs.existsSync(envPath)) {
        createEnvTemplate(envPath);
        console.log('✅ Created .env.local template');
      }
      
      console.log('\n┌─────────────────────────────────────────────────┐');
      console.log('│  🚀 Next Steps:                                 │');
      console.log('│                                                 │');
      console.log('│  1. Edit .env.local and set:                   │');
      console.log('│     SECURENOW_APPID=your-app-name              │');
      console.log('│     SECURENOW_INSTANCE=http://signoz:4318      │');
      console.log('│                                                 │');
      console.log('│  2. Run your app: npm run dev                  │');
      console.log('│                                                 │');
      console.log('│  3. Check SigNoz for traces!                   │');
      console.log('│                                                 │');
      console.log('│  📚 Full guide: npm docs securenow              │');
      console.log('└─────────────────────────────────────────────────┘\n');
      
    } catch (error) {
      console.error('\n❌ Failed to create instrumentation file:', error.message);
      console.log('💡 You can create it manually or run: npx securenow init');
    }
    
    rl.close();
  });
}

// Run setup if this is a new installation (not being installed as a dependency of another package)
if (require.main === module || process.env.npm_config_global !== 'true') {
  setup().catch(err => {
    console.error('[securenow] Setup error:', err);
  });
}

module.exports = { setup };




