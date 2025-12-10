# SecureNow Auto-Setup Guide

SecureNow can automatically create the instrumentation file for your Next.js project! Choose the method that works best for you.

---

## 🎯 Three Ways to Setup

### 1. ✨ Automatic Setup (Recommended)

**Happens automatically when you install:**

```bash
npm install securenow
```

**What happens:**
1. Installer detects Next.js project
2. Asks: "Would you like to automatically create instrumentation file? (Y/n)"
3. Creates `instrumentation.ts` (or `.js`) in the right location
4. Creates `.env.local` template
5. Shows next steps

**Example output:**
```
┌─────────────────────────────────────────────────┐
│  🎉 SecureNow installed successfully!          │
│  Next.js project detected                       │
└─────────────────────────────────────────────────┘

Would you like to automatically create instrumentation file? (Y/n) Y

✅ Created instrumentation.ts
✅ Created .env.local template

┌─────────────────────────────────────────────────┐
│  🚀 Next Steps:                                 │
│                                                 │
│  1. Edit .env.local and set:                   │
│     SECURENOW_APPID=your-app-name              │
│     SECURENOW_INSTANCE=http://signoz:4318      │
│                                                 │
│  2. Run your app: npm run dev                  │
│                                                 │
│  3. Check SigNoz for traces!                   │
└─────────────────────────────────────────────────┘
```

---

### 2. 🛠️ CLI Command (Manual but Easy)

**If you skipped auto-setup or want to setup later:**

```bash
npx securenow init
```

**Options:**

```bash
# Force TypeScript
npx securenow init --typescript

# Force JavaScript
npx securenow init --javascript

# Create in src/ folder
npx securenow init --src

# Create in root folder
npx securenow init --root

# Overwrite existing files
npx securenow init --force

# Combine options
npx securenow init --typescript --src
```

**Example:**
```bash
$ npx securenow init

🚀 SecureNow Setup

✅ Created instrumentation.ts
✅ Created .env.local template

┌─────────────────────────────────────────────────┐
│  🎉 Setup Complete!                             │
│                                                 │
│  Next steps:                                    │
│  1. Edit .env.local and configure               │
│  2. Start your app: npm run dev                 │
│  3. Check SigNoz dashboard for traces!          │
└─────────────────────────────────────────────────┘
```

---

### 3. 📝 Manual Creation

**Create the file yourself:**

```typescript
// instrumentation.ts (at project root)
import { registerSecureNow } from 'securenow/nextjs';

export function register() {
  registerSecureNow();
}
```

```bash
# .env.local
SECURENOW_APPID=my-nextjs-app
SECURENOW_INSTANCE=http://your-signoz:4318
```

---

## 🤖 Auto-Setup Behavior

### Detection Logic

The postinstall script checks:

1. **Is this a Next.js project?**
   - Looks for `next` in package.json dependencies
   
2. **Does instrumentation file already exist?**
   - Checks for: `instrumentation.ts`, `instrumentation.js`
   - Checks in: root and `src/` folder
   
3. **Is this an interactive environment?**
   - Skips in CI/CD environments
   - Skips if stdin is not a TTY

### Smart Defaults

- **TypeScript vs JavaScript**
  - Detects `tsconfig.json` → creates `.ts` file
  - No tsconfig → creates `.js` file

- **Root vs src/ folder**
  - If `src/` folder exists → creates file there
  - Otherwise → creates in root

- **.env.local handling**
  - Only creates if it doesn't exist
  - Never overwrites existing `.env.local`

### Non-Interactive Environments

In CI/CD or non-interactive environments:

```bash
[securenow] ℹ️  Non-interactive environment detected
[securenow] 💡 To complete setup, run: npx securenow init
```

---

## 🎛️ CLI Reference

### Commands

```bash
npx securenow init      # Initialize setup
npx securenow help      # Show help
npx securenow version   # Show version
```

### Flags

| Flag | Description |
|------|-------------|
| `--typescript`, `--ts` | Force TypeScript file |
| `--javascript`, `--js` | Force JavaScript file |
| `--src` | Create in src/ folder |
| `--root` | Create in root folder |
| `--force`, `-f` | Overwrite existing files |

### Examples

**Basic setup:**
```bash
npx securenow init
```

**TypeScript in src folder:**
```bash
npx securenow init --typescript --src
```

**JavaScript in root:**
```bash
npx securenow init --javascript --root
```

**Force overwrite:**
```bash
npx securenow init --force
```

**Not a Next.js project but want to proceed:**
```bash
npx securenow init --force
```

---

## 🔧 Configuration

### Disable Auto-Setup

If you never want auto-setup to run:

**Option 1: Environment variable**
```bash
SECURENOW_NO_POSTINSTALL=1 npm install securenow
```

**Option 2: npm config**
```bash
npm install securenow --ignore-scripts
```

**Option 3: Answer "n" when prompted**
```
Would you like to automatically create instrumentation file? (Y/n) n

[securenow] No problem! To setup later, run: npx securenow init
```

---

## 📂 File Locations

The installer chooses locations automatically:

### TypeScript Projects

```
my-nextjs-app/
├── instrumentation.ts     ← Created here (no src/)
└── .env.local            ← Created here
```

or with src/ folder:

```
my-nextjs-app/
├── src/
│   └── instrumentation.ts  ← Created here (with src/)
└── .env.local             ← Created here
```

### JavaScript Projects

```
my-nextjs-app/
├── instrumentation.js     ← Created here
└── .env.local            ← Created here
```

---

## 🚨 Troubleshooting

### Auto-setup didn't run

**Possible reasons:**

1. **Not a Next.js project**
   - Install `next` first, then install `securenow`
   - Or use: `npx securenow init --force`

2. **CI/CD environment**
   - Run manually: `npx securenow init`

3. **File already exists**
   - Auto-setup skips if file exists
   - Use: `npx securenow init --force` to overwrite

4. **Installation with --ignore-scripts**
   - Run: `npx securenow init`

### CLI command not found

```bash
# Make sure securenow is installed
npm list securenow

# Run with npx
npx securenow init
```

### Permission errors

```bash
# On Unix systems, the CLI should be executable
chmod +x node_modules/securenow/cli.js

# Or use npx
npx securenow init
```

---

## 🎯 Comparison

| Method | Speed | Flexibility | Best For |
|--------|-------|-------------|----------|
| **Auto-setup** | ⚡ Instant | Basic | First-time users |
| **CLI** | 🚀 Fast | High | Custom setups |
| **Manual** | 📝 Slow | Full | Advanced users |

---

## 💡 Best Practices

### For Development

1. **Let auto-setup run**
   - Fastest way to get started
   - Creates everything you need

2. **Review generated files**
   - Check `instrumentation.ts`
   - Verify `.env.local` settings

3. **Use CLI for adjustments**
   - `npx securenow init --force` to regenerate

### For Teams

1. **Add to documentation**
   ```md
   ## Setup Observability
   npm install securenow
   # Answer "Y" when prompted
   ```

2. **Share .env.local template**
   - Commit `.env.local.example`
   - Team copies to `.env.local`

3. **CI/CD setup**
   ```bash
   # In CI, skip auto-setup
   npm install --ignore-scripts
   
   # Or set env var
   SECURENOW_NO_POSTINSTALL=1 npm install
   ```

### For Monorepos

```bash
# In each Next.js app
cd apps/web
npx securenow init

cd apps/admin
npx securenow init
```

---

## 🆘 Need Help?

```bash
# Get help
npx securenow help

# Check version
npx securenow version

# Re-run setup
npx securenow init --force
```

**Documentation:**
- [Quick Start](./NEXTJS-QUICKSTART.md)
- [Complete Guide](./NEXTJS-GUIDE.md)
- [Customer Guide](./CUSTOMER-GUIDE.md)

---

## ✨ Summary

**Simplest way:**
```bash
npm install securenow
# Press Y when asked
```

**If you need control:**
```bash
npm install securenow
npx securenow init --typescript --src
```

**For CI/CD:**
```bash
npm install --ignore-scripts
npx securenow init
```

**That's it!** 🎉




