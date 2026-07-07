# Workflow: Local Login

## Description

Automates the login flow on the embedded test server (`server.js`). This is the simplest possible workflow and serves as a reference for creating more complex ones.

## Prerequisites

Start the local server before running:

```bash
npm run server
```

## Commands

```bash
node browser.js begin
node browser.js goto "http://localhost:3000/login"
node browser.js fill "#username" admin
node browser.js fill "#password" 1234
node browser.js click "#login-btn"
node browser.js snapshot
node browser.js end
```

## Quick Run

```bash
node workflows/local-login.js
```

## Flow Details

### Step 1: Navigate to Login

- **URL**: `http://localhost:3000/login`
- Page shows a form with username, password, and a submit button

### Step 2: Fill Credentials

- **Username selector**: `#username`
- **Password selector**: `#password`
- Test credentials: `admin` / `1234`

### Step 3: Submit

- **Button selector**: `#login-btn`
- On success: redirects to `/dashboard`
- On failure: shows "Invalid Credentials" in `#error-message`

### Step 4: Verify

- Screenshot saved to `screenshots/` with timestamp
- Expected result: page title "Dashboard", heading "Welcome to Dashboard"

## Success Indicators

| Signal | Meaning |
|--------|---------|
| URL changes to `/dashboard` | Login succeeded |
| `[H1] Welcome to Dashboard` in output | Confirmed on dashboard |
| `[MESSAGE] #error-message → "Invalid Credentials"` | Wrong credentials |

## Troubleshooting

- **Connection refused**: Make sure `npm run server` is running
- **Error message appears**: Verify credentials (admin/1234)
- **Timeout**: Increase wait times or check if port 3000 is in use
