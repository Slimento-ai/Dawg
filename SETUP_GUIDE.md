# Complete Setup and Usage Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Testing](#testing)
6. [Usage Guide](#usage-guide)
7. [Troubleshooting](#troubleshooting)
8. [Architecture](#architecture)
9. [API Reference](#api-reference)
10. [Production Deployment](#production-deployment)

---

## Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or yarn/pnpm)
- **Git**: For version control
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Required Knowledge

- Basic JavaScript/TypeScript
- Understanding of Lightning Network invoices
- Familiarity with Nostr protocol (optional but helpful)
- Basic command line usage

### External Requirements

- A Nostr Wallet Connect (NWC) connection string
- A Lightning Network wallet supporting NWC (Alby, Zeus, etc.)

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Slimento-ai/Dawg.git
cd Dawg
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- **@getalby/sdk** - WebLN and NWC integration library
- **vite** - Build tool and development server
- **vitest** - Unit testing framework
- **typescript** - Type safety
- **@vitejs/plugin-vue** - Vue support (optional)

Verify installation:
```bash
npm list @getalby/sdk vite vitest
```

### Step 3: Verify Installation

```bash
npm run build
```

If successful, you'll see a `dist/` folder created.

---

## Configuration

### Step 1: Create Environment File

Copy the example environment file:

```bash
cp .env.example .env.local
```

### Step 2: Configure Environment Variables

Edit `.env.local`:

```env
# Your NWC connection string (optional - can be entered in UI)
VITE_NWC_URL=nostr+walletconnect://your-connection-string-here

# Environment mode
NODE_ENV=development

# Optional: API endpoints
VITE_RELAY_URL=wss://relay.example.com
VITE_API_URL=https://api.example.com
```

### Step 3: Obtain NWC Connection String

#### Option A: Using Alby (Easiest)

1. Install Alby: https://getalby.com
2. Open Alby dashboard
3. Go to **Settings** → **Integrations** → **Nostr Wallet Connect**
4. Click **Create Connection**
5. Copy the `nostr+walletconnect://...` string

#### Option B: Using Zeus

1. Install Zeus: https://zeusln.app
2. Open Zeus app
3. Go to **Settings** → **Integrations** → **Nostr Wallet Connect**
4. Generate connection string
5. Copy the full URL

#### Option C: Using Other Wallets

Similar process - look for "Nostr Wallet Connect" or "WebLN" settings in your wallet app.

### Step 4: Store Connection String

**Method 1: Environment Variable (Recommended for Development)**
```bash
echo "VITE_NWC_URL=nostr+walletconnect://..." >> .env.local
```

**Method 2: Browser Storage (During Runtime)**
- Enter in the web interface
- Automatically saved to localStorage
- Persists across sessions

**Method 3: Encrypted Storage (For Production)**
```typescript
// Implement in your application
import crypto from 'crypto';

function encryptNWCUrl(url: string, password: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', password);
  let encrypted = cipher.update(url, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

Output:
```
  VITE v5.0.0  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Open http://localhost:5173 in your browser.

#### Features in Dev Mode:
- Hot module replacement (HMR)
- Fast refresh on code changes
- Source maps for debugging
- Detailed error messages

### Production Build

```bash
npm run build
```

Output:
```
dist/index.html                  0.50 kB │ gzip:  0.35 kB
dist/index.js                   42.15 kB │ gzip: 15.32 kB
dist/style.css                   5.23 kB │ gzip:  1.85 kB
```

### Preview Production Build

```bash
npm run preview
```

Opens http://localhost:4173 with the production build.

### Build Output Structure

```
dist/
├── index.html          # Entry HTML file
├── index.js            # Bundled JavaScript
├── index.js.map        # Source map for debugging
├── style.css           # Bundled styles
└── style.css.map       # Style source map
```

---

## Testing

### Unit Tests

#### Run All Tests

```bash
npm run test
```

Output:
```
✓ src/nwc.test.ts (9 tests)
✓ src/storage.test.ts (4 tests)

Test Files  2 passed (2)
Tests      13 passed (13)
```

#### Run Tests in Watch Mode

```bash
npm run test -- --watch
```

Auto-reruns tests on file changes.

#### Run Tests with UI

```bash
npm run test:ui
```

Opens interactive test dashboard at http://localhost:51204.

#### Run Specific Test

```bash
npm run test -- nwc.test
```

#### Run Tests with Coverage

```bash
npm run test -- --coverage
```

Generates coverage report:
```
File               | % Statements | % Branch | % Funcs | % Lines
-------------------|--------------|----------|---------|--------
All files          |     92.3     |  87.1    |  94.6   |  92.3
 src/nwc.ts        |     95.2     |  90.0    |  100    |  95.2
 src/storage.ts    |     88.5     |  82.0    |  88.5   |  88.5
```

### Manual Testing

#### Test Scenario 1: Wallet Connection

1. Start dev server: `npm run dev`
2. Open http://localhost:5173
3. Enter NWC URL: `nostr+walletconnect://...`
4. Click **Connect Wallet**
5. Verify wallet info displays

**Expected Result**: ✓ Connected status, wallet alias, and public key shown

#### Test Scenario 2: Send Payment

1. Ensure wallet is connected
2. Enter testnet invoice (or real invoice for mainnet)
3. Click **Send Payment**
4. Verify preimage in response

**Expected Result**: ✓ Success message with preimage

#### Test Scenario 3: Disconnect & Reconnect

1. Click **Disconnect**
2. Verify localStorage cleared
3. Re-enter NWC URL
4. Click **Connect Wallet** again

**Expected Result**: ✓ Works without errors

#### Test Scenario 4: Error Handling

1. Enter invalid NWC URL
2. Click **Connect Wallet**
3. Verify error message displays

**Expected Result**: ✓ Clear error message shown

### Browser Compatibility Testing

```bash
# Test in different browsers
- Chrome: npm run dev (then open)
- Firefox: npm run dev (then open)
- Safari: npm run dev (then open)
- Edge: npm run dev (then open)
```

---

## Usage Guide

### Web Interface Overview

```
┌─────────────────────────────────────────┐
│         🐕 Dawg - WebLN Test            │
│  Nostr Wallet Connect Integration       │
├─────────────────────────────────────────┤
│                                         │
│  NWC Connection String:                 │
│  [________________________] (password)  │
│                                         │
│  [Connect Wallet] [Disconnect]          │
│                                         │
│  ┌─ Wallet Info ──────────────────────┐ │
│  │ Status: Connected                   │ │
│  │ Alias: My Alby Wallet               │ │
│  │ Public Key: 48f2c8...               │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  Lightning Invoice:                     │
│  [________________________]             │
│  [______________________] (multiline)   │
│                                         │
│  [Send Payment]                         │
│                                         │
│  Status: ✓ Success!                    │
│  Preimage: abc123def456...             │
│                                         │
└─────────────────────────────────────────┘
```

### Step-by-Step Usage

#### 1. Connect to Wallet

```
Input: NWC Connection URL
Process: 
  1. Validate URL format
  2. Initialize WebLN provider
  3. Call enable() to activate
  4. Retrieve wallet info
  5. Store URL in localStorage
Output: Connected wallet info
```

**Example:**
```
NWC URL: nostr+walletconnect://2b24250...?relay=wss://relay.damus.io&secret=098f6bcd...
Status: ✓ Connected
Alias: My Lightning Wallet
Public Key: 48f2c8d8de...
```

#### 2. Send a Payment

```
Input: Lightning Invoice
Process:
  1. Validate invoice format
  2. Send to connected wallet
  3. Wallet prompts user (if needed)
  4. Return preimage on success
Output: Transaction confirmation
```

**Example:**
```
Invoice: lnbc10000n1p3x3v3pp5test...
Amount: 0.001 BTC (0.1 USD)
Status: ✓ Payment sent
Preimage: abc123def456ghi789jkl...
Relay: wss://relay.damus.io
```

#### 3. View Wallet Information

Automatic display after connection:
```
Status: Connected
Alias: Your Wallet Name
Color: #0088ff
Public Key: 48f2c8d8de...
```

#### 4. Disconnect Wallet

```
Process:
  1. Clear current connection
  2. Remove from localStorage
  3. Reset UI to initial state
Output: Disconnected state
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Focus NWC URL input |
| `Tab` | Navigate between inputs |
| `Enter` | Submit current form |
| `Escape` | Clear status message |

---

## Troubleshooting

### Wallet Payment Problems

#### Problem 1: "Insufficient Balance"

**Error Message**: 
```
✗ Payment failed: Insufficient balance in wallet
```

**Causes**:
- Wallet contains fewer sats than invoice amount
- Insufficient funds for on-chain transaction
- Lightning channel has no capacity

**Solutions**:

```bash
# 1. Check wallet balance (from Wallet Info displayed after connection)
# Look at the wallet alias and public key shown

# 2. Top-up wallet - Choose one of these methods:

# Option A: Receive Lightning payment
# Ask someone to send you sats via Lightning invoice

# Option B: On-chain deposit
# Get your Bitcoin address from wallet and deposit BTC

# Option C: Open new Lightning channel (if using self-hosted wallet)
# Add more liquidity to your Lightning channels

# 3. For testnet testing - use testnet invoice instead
# Request testnet invoice from recipient (starts with lntbs instead of lnbc)

# 4. Split large payments
# Instead of one 10,000 sat payment, try 5 x 2,000 sat payments
```

**Verification**:
```javascript
// Check balance programmatically
const info = await getWalletInfo(nwc);
console.log('Balance:', info.balance); // Will show available sats
```

#### Problem 2: "Invalid Invoice Format"

**Error Message**:
```
✗ Payment failed: Invalid invoice format
```

**Causes**:
- Invoice doesn't start with `lnbc` or `lntbs`
- Invoice is corrupted or incomplete
- Invoice has extra spaces or characters
- Wrong network (mainnet vs testnet)

**Solutions**:

```bash
# 1. Verify invoice format
# Valid mainnet: lnbc1000n1p3x3v3pp5...
# Valid testnet: lntbs1000n1p3x3v3pp5...

# 2. Check for common mistakes:
# ❌ "LNBC1000..." (uppercase) → ✓ Convert to lowercase
# ❌ "ln bc1000..." (space) → ✓ Remove spaces
# ❌ "lnbc1000... " (trailing space) → ✓ Trim whitespace

# 3. Get fresh invoice from recipient
# Old invoices expire after ~1 hour
# Request a new one

# 4. Verify invoice amount matches
# Some invoices have fixed amounts
# Verify you can afford the amount shown

# 5. Test with a valid invoice
# Use this test invoice for mainnet:
# lnbc21n1p0sample (if available from test service)
```

**Manual Verification**:
```javascript
// Test invoice validation
const invoice = 'lnbc10000n1p3x3v3pp5...';

// Check format
if (!invoice.startsWith('lnbc') && !invoice.startsWith('lntbs')) {
  console.error('Invalid invoice format');
}

// Check length (should be long)
if (invoice.length < 50) {
  console.error('Invoice too short');
}
```

#### Problem 3: "Invoice Expired"

**Error Message**:
```
✗ Payment failed: Invoice has expired
```

**Causes**:
- Invoice created more than 1 hour ago
- Wallet time is out of sync
- Relay is slow and processing old request

**Solutions**:

```bash
# 1. Request new invoice from recipient
# Lightning invoices expire after ~1 hour by default

# 2. Check system time
# Incorrect time can cause expiration issues

# Linux/Mac:
date

# Windows:
Get-Date

# Set correct time if needed:
# System Preferences → Date & Time → Set automatically

# 3. Try payment immediately after getting invoice
# Don't wait - send within minutes of receiving

# 4. Check wallet time sync
# Some wallets sync with relay time
# Restart wallet app to resync

# 5. Use longer expiry invoice (for recurring payments)
# Ask recipient to generate invoice with longer expiry time
```

**Debug Timestamp**:
```javascript
// Check invoice expiry
const invoice = 'lnbc10000n1p3x3v3pp5...';
const decodedInvoice = await decodeInvoice(invoice);
console.log('Created:', new Date(decodedInvoice.timestamp * 1000));
console.log('Expires:', new Date((decodedInvoice.timestamp + 3600) * 1000));
console.log('Now:', new Date());
```

#### Problem 4: "Relay Error - Connection Failed"

**Error Message**:
```
✗ Payment failed: Relay connection error
```

**Causes**:
- Relay is offline or unreachable
- Network connectivity issue
- Firewall blocking relay
- VPN restrictions
- Relay temporarily overloaded

**Solutions**:

```bash
# 1. Check relay status
curl -I wss://relay.damus.io/health
# Should return HTTP 200

# 2. Try alternative relay
# In your NWC URL, change the relay parameter:
# FROM: nostr+walletconnect://...?relay=wss://relay1.com
# TO:   nostr+walletconnect://...?relay=wss://relay2.com

# Alternative relays to try:
# - wss://relay.damus.io
# - wss://nos.lol
# - wss://relay.snort.social
# - wss://relay.current.fyi
# - wss://relay.nostr.band

# 3. Check internet connection
ping google.com
# Should show replies

# 4. Check firewall/VPN
# Disable VPN temporarily and retry
# Check firewall rules for WSS (WebSocket Secure) ports

# 5. Restart browser
# Clear cache and cookies
# Browser: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)

# 6. Try from different network
# Use mobile hotspot or different WiFi
# Helps determine if it's network-specific issue
```

**Network Debug**:
```javascript
// Test relay connectivity
async function testRelayConnection(relayUrl) {
  try {
    const ws = new WebSocket(relayUrl);
    ws.onopen = () => console.log('✓ Relay connected');
    ws.onerror = () => console.error('✗ Relay failed');
    setTimeout(() => ws.close(), 5000);
  } catch (e) {
    console.error('Connection error:', e.message);
  }
}

testRelayConnection('wss://relay.damus.io');
```

#### Problem 5: "Payment Sent But No Confirmation"

**Symptoms**:
- Button shows processing but never completes
- No preimage returned
- Wallet shows payment but app doesn't confirm

**Causes**:
- Relay didn't deliver confirmation message
- Browser connection interrupted
- Wallet crashed or disconnected
- Network timeout

**Solutions**:

```bash
# 1. Wait longer (up to 30 seconds)
# Lightning payments can be slow during network congestion
# Don't click Send again while processing

# 2. Check if payment actually went through
# Look at your wallet app directly
# Check transaction history
# If sats are deducted, payment succeeded

# 3. Increase timeout in code
# Edit vitest.config.ts or timeout in payment function
test: {
  testTimeout: 30000  // 30 seconds
}

# 4. Retry connection
# Click Disconnect
# Click Connect Wallet again
# Check wallet status

# 5. Check relay logs
# Some relay implementations provide debug info
# Ask relay provider for transaction details

# 6. Verify amount was received
# Ask recipient if payment arrived
# If yes, payment succeeded (confirmation just delayed)
```

**Manual Retry**:
```javascript
// Add retry logic for payments
async function sendPaymentWithRetry(nwc, invoice, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await sendPayment(nwc, invoice);
      console.log('✓ Payment sent:', response.preimage);
      return response;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
      }
    }
  }
  throw new Error('Payment failed after retries');
}
```

#### Problem 6: "LNURL Decode Error"

**Error Message**:
```
✗ Payment failed: Unable to decode LNURL
```

**Causes**:
- Pasted LNURL instead of invoice
- Wrong format (need actual invoice, not payment request)
- Corrupted LNURL string

**Solutions**:

```bash
# 1. Understand the difference:
# LNURL: lnurl1dp68gurn8ghj7mr0vdjk2mr0d4skjm3wv4uxzmtsd3jjmmw4jcxj... (payment request)
# Invoice: lnbc10000n1p3x3v3pp5... (actual invoice)

# 2. Get the actual invoice, not LNURL
# Some payment requests use LNURL protocol
# Scan the LNURL with your wallet to get an invoice
# Then paste the resulting invoice here

# 3. Use correct wallet decode
# Online LNURL decoder: https://lnurl.fiatjaf.com/
# Check what format you have before pasting

# 4. Copy full invoice carefully
# Make sure you copied the entire string
# Check for missing characters at start or end
```

#### Problem 7: "Preimage Mismatch Error"

**Error Message**:
```
✗ Payment failed: Preimage mismatch
```

**Causes**:
- Wallet returned invalid preimage
- Relay tampered with message
- Wallet implementation bug

**Solutions**:

```bash
# 1. This is a rare edge case
# Usually indicates wallet or relay issue

# 2. Try different wallet
# If using Alby, try Zeus
# If using Zeus, try Alby
# Helps identify if it's wallet-specific

# 3. Try different relay
# Change NWC relay parameter
# See "Relay Error" solutions above

# 4. Report to wallet developer
# This is likely a bug
# Provide:
# - Wallet name and version
# - Invoice details (amount, timestamp)
# - Relay being used
# - Error logs from browser console

# 5. Use direct payment method temporarily
# Use traditional Lightning (QR code) instead of NWC
# Until issue is resolved
```

---

### Build Errors

#### Error 1: "Module not found: @getalby/sdk"

**Full Error**:
```
Error: Cannot find module '@getalby/sdk'
```

**Causes**:
- npm install didn't complete
- Dependencies not installed correctly
- node_modules corrupted
- npm cache issue

**Solutions**:

```bash
# Method 1: Fresh reinstall (most reliable)
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Verify installation worked
npm list @getalby/sdk
# Should show: @getalby/sdk@latest

# Method 2: Just reinstall packages
npm install

# Method 3: Using different package manager
# If npm doesn't work, try yarn
yarn install

# Or try pnpm
pnpm install

# Method 4: Check if npm is working
npm --version
# Should show version 9.0.0 or higher

# If very old version, update npm
npm install -g npm@latest
```

**Verification**:
```bash
# Check package.json has dependency
cat package.json | grep "@getalby/sdk"

# Check node_modules exists
ls node_modules/@getalby/sdk/
```

#### Error 2: "Cannot find type definitions"

**Full Error**:
```
error TS7016: Could not find a declaration file for module '@getalby/sdk'
```

**Causes**:
- TypeScript types not installed
- @types package missing
- tsconfig.json not configured correctly

**Solutions**:

```bash
# Method 1: Install type definitions
npm install --save-dev @types/node

# Method 2: Update all type definitions
npm update @types/*

# Method 3: Check tsconfig.json
cat tsconfig.json | grep -A 5 "skipLibCheck"
# Make sure skipLibCheck is false or removed

# Edit tsconfig.json:
{
  "compilerOptions": {
    "skipLibCheck": false,  // Change to false
    "strict": true,
    "declaration": true
  }
}

# Method 4: Clear TypeScript cache
rm -rf dist/
npm run build
```

**Verify TypeScript**:
```bash
# Check TypeScript version
npm list typescript

# Try compiling
npx tsc --version
npx tsc --noEmit  # Check for type errors without building
```

#### Error 3: "Port 5173 already in use"

**Full Error**:
```
error: listen EADDRINUSE: address already in use :::5173
```

**Causes**:
- Another process using port 5173
- Previous dev server still running
- Port configured in use

**Solutions**:

```bash
# Method 1: Kill the process using the port
# Linux/Mac:
lsof -ti:5173 | xargs kill -9

# Windows (PowerShell):
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Method 2: Use different port
npm run dev -- --port 3000
# Now access at http://localhost:3000

# Method 3: Wait for process to timeout
# Usually takes 30-60 seconds for OS to release port
# Then try again

# Method 4: Restart everything
npm run dev
# Ctrl+C to stop
# Wait 5 seconds
# npm run dev again

# Method 5: Configure default port in vite.config.ts
export default defineConfig({
  server: {
    port: 3000,  // Change default port
  },
});
```

**Check Running Processes**:
```bash
# List all Node processes
ps aux | grep node

# List ports in use
lsof -i -P -n | grep LISTEN
```

#### Error 4: "Vite build failed - Invalid syntax"

**Full Error**:
```
error during build:
Error: Invalid syntax in src/nwc.ts:42
Unexpected token '}'
```

**Causes**:
- Syntax error in TypeScript/JavaScript
- Missing semicolon or bracket
- Incorrect import/export syntax

**Solutions**:

```bash
# Method 1: Check file for syntax errors
# Line 42 in src/nwc.ts
cat -n src/nwc.ts | sed -n '40,44p'

# Common mistakes:
# ❌ async function test { }  →  ✓ async function test() { }
# ❌ import { test } from .  →  ✓ import { test } from './path'
# ❌ export default test   →  ✓ export default test; (optional semi)

# Method 2: Use TypeScript compiler to find errors
npx tsc --noEmit

# Method 3: Use a linter (if installed)
npm run lint  # if available

# Method 4: Check common TypeScript issues
# - Missing return type on async functions
// ❌ async function test() { }
// ✓ async function test(): Promise<void> { }

# Method 5: Validate file is proper JavaScript/TypeScript
# Check against these patterns:
# - All { have matching }
# - All ( have matching )
# - All [ have matching ]
# - All strings properly quoted
```

**Fix Template**:
```typescript
// WRONG - Missing return type
async function sendPayment(nwc, invoice) {
  await nwc.sendPayment(invoice);
}

// CORRECT - Add return type
async function sendPayment(nwc: any, invoice: string): Promise<any> {
  const response = await nwc.sendPayment(invoice);
  return response;
}
```

#### Error 5: "ENOSPC: no space left on device"

**Full Error**:
```
error: ENOSPC: no space left on device, mkdir
```

**Causes**:
- Disk drive is full
- node_modules folder too large
- Too many build artifacts

**Solutions**:

```bash
# Method 1: Check disk space
df -h
# Look for / partition, should have >1GB free

# Method 2: Clean up disk space
# Remove old node_modules
rm -rf node_modules/

# Delete build artifacts
rm -rf dist/

# Clear npm cache
npm cache clean --force

# Method 3: Check what's taking space
du -sh node_modules/
# Usually 300-500MB for this project

# Method 4: Remove unnecessary files
# If other projects exist
rm -rf ../old-project/node_modules/

# Clean system cache (careful with this)
# Linux: rm -rf ~/.cache/*
# Mac: rm -rf ~/Library/Caches/*

# Method 5: Get more disk space
# Upgrade storage
# Move to external drive
# Use cloud storage

# Method 6: After freeing space, reinstall
npm install
npm run build
```

**Check Space**:
```bash
# Detailed disk usage
df -h
du -sh ./*
du -sh ./node_modules
```

#### Error 6: "Unexpected character '@'"

**Full Error**:
```
Error: Unexpected character '@' at line 1 column 1
```

**Causes**:
- Trying to run TypeScript directly
- Using wrong file extension
- Build system not configured for TypeScript

**Solutions**:

```bash
# Method 1: Use npm scripts, not direct file execution
# ❌ WRONG
node src/nwc.ts

# ✓ RIGHT
npm run dev
npm run build
npm run test

# Method 2: If need to run TypeScript directly
npx ts-node src/nwc.ts

# Method 3: Check file exists and is readable
ls -la src/nwc.ts
# Should show file with .ts extension

# Method 4: Verify vite config is correct
cat vite.config.ts
# Should have proper imports and exports

# Method 5: Check for encoding issues
# File might be corrupted
# Recreate the file if needed
file src/nwc.ts  # Should show "ASCII text" or "UTF-8 text"
```

#### Error 7: "Cannot find 'tsconfig.json'"

**Full Error**:
```
error: Cannot find 'tsconfig.json'
```

**Causes**:
- tsconfig.json deleted or moved
- Running from wrong directory
- File not committed to git

**Solutions**:

```bash
# Method 1: Check if file exists
ls -la tsconfig.json
# If not found:

# Method 2: Create from scratch
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "moduleResolution": "bundler"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Method 3: Check current directory
pwd
# Should show repository root containing tsconfig.json

# Method 4: List all config files
ls -la *.json
# Should show:
# - package.json
# - tsconfig.json
# - tsconfig.node.json
# - vite.config.ts
# - vitest.config.ts

# Method 5: If file was deleted, restore from git
git checkout tsconfig.json
```

#### Error 8: "Module parse failed"

**Full Error**:
```
error: The requested module does not provide an export named 'NWC'
```

**Causes**:
- Wrong import syntax
- Named vs default export mismatch
- Module doesn't export what you're trying to import

**Solutions**:

```bash
# Method 1: Check what's actually exported
# In src/nwc.ts, look at exports:
grep "export" src/nwc.ts

# Should see:
# export async function initializeNWC() { }
# export async function sendPayment() { }

# Method 2: Use correct import syntax
# ❌ WRONG
import { NWC } from './nwc';

# ✓ RIGHT
import { initializeNWC, sendPayment } from './src/nwc';

# Method 3: Check import vs require
# For ES modules (.ts files), use import
import { test } from './module';

# For CommonJS, use require
const { test } = require('./module');

# Method 4: Verify all exports exist
# Look at bottom of each file
# Should have: export function name() { }

# Method 5: Check for circular imports
# Can cause exports to be undefined
# Ensure files don't import each other circularly
```

**Import Examples**:
```typescript
// CORRECT - Named imports
import { initializeNWC, sendPayment } from './src/nwc';

// CORRECT - Default import
import nwcModule from './src/nwc';

// CORRECT - Import everything
import * as nwc from './src/nwc';

// WRONG - Doesn't work for named exports
import NWC from './src/nwc';
```

#### Error 9: "Node version not compatible"

**Full Error**:
```
error: This version of vite requires node >=14.0.0
```

**Causes**:
- Node.js version too old
- Project requires newer Node version

**Solutions**:

```bash
# Check current Node version
node --version
# Should be v18.0.0 or higher

# Method 1: Update Node.js
# Option A: Using NVM (Node Version Manager) - RECOMMENDED
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
node --version  # Should show v18.x.x

# Option B: Direct download
# Go to https://nodejs.org/
# Download LTS version (18.x)
# Install normally

# Option C: Using package manager
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install nodejs npm

# Mac (Homebrew):
brew install node

# Windows:
# Download from https://nodejs.org/ or use chocolatey

# Method 2: Verify after update
node --version
npm --version

# Method 3: Reinstall dependencies after updating Node
rm -rf node_modules package-lock.json
npm install
```

**Check Node Installation**:
```bash
node --version    # Should be v18+
npm --version     # Should be v9+
which node        # Show where Node is installed
which npm         # Show where npm is installed
```

#### Error 10: "ESM syntax error in CommonJS"

**Full Error**:
```
Error: Cannot use import statement outside a module
```

**Causes**:
- Mixing ES modules and CommonJS
- package.json doesn't declare module type
- Wrong file extension (.js vs .mjs)

**Solutions**:

```bash
# Method 1: Check package.json has module type
grep "type" package.json
# Should show: "type": "module"

# If not, add it:
# Edit package.json and add after "name" field:
{
  "name": "dawg-webln",
  "type": "module",
  ...
}

# Method 2: Use consistent imports/exports
# Use import/export (modern ES modules)
import { test } from './module';
export function test() { }

# Don't mix with require/module.exports
const test = require('./module');  // Don't use this
module.exports = test;             // Don't use this

# Method 3: Check all files use .ts or .js
# (not mixing extensions inconsistently)
ls src/*.ts
# All should be .ts files

# Method 4: Verify vite.config.ts is correct
cat vite.config.ts | head -1
# Should start with: import { defineConfig } from 'vite';
# Not: const { defineConfig } = require('vite');
```

---

## Architecture

### Project Structure

```
Dawg/
├── src/
│   ├── nwc.ts              # NWC payment handlers
│   ├── nwc.test.ts         # Unit tests for NWC
│   ├── storage.ts          # URL storage utilities
│   └── storage.test.ts     # Unit tests for storage
├── dist/                   # Built output (generated)
├── index.html              # Web interface
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Test configuration
├── tsconfig.json           # TypeScript configuration
├── tsconfig.node.json      # Node config
├── package.json            # Dependencies
├── .env.example            # Example environment vars
├── .gitignore              # Git ignore rules
├── README.md               # Quick start guide
└── SETUP_GUIDE.md          # This file
```

### Data Flow

```
User Input
    ↓
Web Interface (index.html)
    ↓
Storage Layer (storage.ts)
    ├→ localStorage (browser)
    └→ environment variables
    ↓
NWC Handler (nwc.ts)
    ↓
Alby SDK (@getalby/sdk)
    ↓
WebLN Provider
    ↓
Nostr Wallet Connect
    ↓
User's Wallet (Alby, Zeus, etc.)
    ↓
Lightning Network
```

### Component Overview

#### 1. Storage Module (`src/storage.ts`)

```typescript
// Functions:
- loadNWCUrl()      // Load from localStorage or env
- storeNWCUrl()     // Save to localStorage
- clearNWCUrl()     // Remove from storage
```

**Responsibility**: Persistent URL storage

#### 2. NWC Module (`src/nwc.ts`)

```typescript
// Functions:
- initializeNWC()   // Connect to wallet
- sendPayment()     // Send Lightning invoice
- getWalletInfo()   // Retrieve wallet details
```

**Responsibility**: WebLN operations

#### 3. Web Interface (`index.html`)

```html
// Sections:
- Connection Setup  (input + buttons)
- Wallet Info       (display area)
- Payment Form      (input + send button)
- Status Display    (feedback messages)
```

**Responsibility**: User interaction

### State Management

```
Current State:
{
  isConnected: boolean,
  currentNWC: WebLNProvider | null,
  walletInfo: {
    alias: string,
    pubkey: string,
    color: string
  },
  statusMessage: string,
  statusType: 'success' | 'error' | 'info'
}
```

---

## API Reference

### Storage Functions

#### `loadNWCUrl(): string`

Load NWC URL from localStorage or environment variable.

```typescript
import { loadNWCUrl } from './src/storage';

const url = loadNWCUrl();
// Returns: "nostr+walletconnect://..."
// Throws: Error if not found
```

#### `storeNWCUrl(url: string): void`

Save NWC URL to localStorage.

```typescript
import { storeNWCUrl } from './src/storage';

storeNWCUrl('nostr+walletconnect://...');
```

#### `clearNWCUrl(): void`

Remove NWC URL from localStorage.

```typescript
import { clearNWCUrl } from './src/storage';

clearNWCUrl();
```

### NWC Functions

#### `initializeNWC(nwcUrl: string): Promise<WebLNProvider>`

Initialize and connect to wallet via NWC.

```typescript
import { initializeNWC } from './src/nwc';

const nwc = await initializeNWC('nostr+walletconnect://...');
// Returns: Connected WebLN provider
// Throws: Error if connection fails
```

#### `sendPayment(nwc: WebLNProvider, invoice: string): Promise<PaymentResponse>`

Send payment via connected wallet.

```typescript
import { sendPayment } from './src/nwc';

const response = await sendPayment(nwc, 'lnbc10000n1p3x3v3pp5...');
// Returns: { preimage: string, relays: string[] }
// Throws: Error if payment fails
```

#### `getWalletInfo(nwc: WebLNProvider): Promise<WalletInfo>`

Retrieve wallet information.

```typescript
import { getWalletInfo } from './src/nwc';

const info = await getWalletInfo(nwc);
// Returns: { alias: string, color: string, pubkey: string }
// Throws: Error if request fails
```

### TypeScript Interfaces

```typescript
interface WebLNProvider {
  enable(): Promise<void>;
  sendPayment(invoice: string): Promise<PaymentResponse>;
  getInfo(): Promise<WalletInfo>;
}

interface PaymentResponse {
  preimage: string;
  relays: string[];
}

interface WalletInfo {
  alias: string;
  color: string;
  pubkey: string;
}
```

---

## Production Deployment

### Pre-Deployment Checklist

```
□ Run all tests: npm run test
□ Build production: npm run build
□ Check bundle size: npm run build (check output)
□ Run security audit: npm audit
□ Update dependencies: npm update
□ Review environment variables
□ Test in production mode: npm run preview
□ Test on multiple browsers
□ Test on mobile devices
□ Verify SSL/TLS certificates
□ Set up monitoring/logging
```

### Build Optimization

```bash
# Analyze bundle size
npm run build -- --analyze

# Minify and optimize
npm run build

# Check output
ls -lah dist/
```

### Deployment Options

#### Option 1: Static Hosting (Vercel, Netlify)

```bash
# Build
npm run build

# Deploy dist/ folder to Vercel/Netlify
# Commands:
# Build: npm run build
# Output: dist
```

#### Option 2: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview"]
```

```bash
# Build image
docker build -t dawg:latest .

# Run container
docker run -p 5173:5173 dawg:latest
```

#### Option 3: Traditional Server (Node.js)

```bash
# Build
npm run build

# Start production server
npm run preview
```

Or use PM2:
```bash
npm install -g pm2
pm2 start "npm run preview" --name "dawg"
pm2 save
```

### Environment Variables (Production)

```env
# .env.production
NODE_ENV=production
VITE_NWC_URL=nostr+walletconnect://[YOUR_PRODUCTION_URL]
VITE_RELAY_URL=wss://relay.damus.io
VITE_API_URL=https://api.yourdomain.com
```

### Security Headers

Add to your server configuration:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### SSL/TLS Configuration

```bash
# Use HTTPS only
# Let's Encrypt (free): https://letsencrypt.org/

# Test with curl
curl -v https://your-domain.com
```

### Monitoring and Logging

```typescript
// Add error tracking (Sentry example)
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://your-sentry-dsn@sentry.io/project",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

### Performance Optimization

```bash
# Enable gzip compression on server
# Enable caching headers
# Use CDN for static assets
# Lazy load components
# Minify and bundle JavaScript
```

---

## Quick Reference

### Common Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run unit tests
npm run test:ui      # Test dashboard
```

### Useful Links

- **Alby**: https://getalby.com
- **WebLN Spec**: https://www.webln.dev/
- **Nostr**: https://nostr.com/
- **Lightning Network**: https://lightning.network/
- **Vite Docs**: https://vitejs.dev/
- **Vitest Docs**: https://vitest.dev/

### Support Resources

| Issue | Resource |
|-------|----------|
| WebLN | https://github.com/getAlby/alby-js-sdk |
| Lightning | https://lightning.network/docs/ |
| Nostr | https://github.com/nostr-protocol/nostr |
| Vite | https://vitejs.dev/guide/ |
| TypeScript | https://www.typescriptlang.org/docs/ |

---

## Next Steps

1. ✅ Complete setup from this guide
2. ✅ Run tests to verify installation
3. ✅ Start development server
4. ✅ Test wallet connection
5. ✅ Send test payment
6. ✅ Build for production
7. ✅ Deploy to your server

**Questions?** Check the Troubleshooting section or open an issue on GitHub.
