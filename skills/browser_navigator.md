# Browser Navigator - Agent Instructions

You have access to a CLI script (`browser.js`) that controls a headless browser in batch mode. Commands are queued and executed all at once in a single browser session.

## Usage Flow

```bash
node browser.js begin          # Start batch session
node browser.js <command>      # Queue commands (as many as needed)
node browser.js end            # Execute all at once and close the browser
```

## Available Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `begin` | `node browser.js begin` | Start a new batch session |
| `goto`  | `node browser.js goto <url>` | Navigate to URL |
| `fill`  | `node browser.js fill <selector> <text>` | Fill an input field |
| `click` | `node browser.js click <selector>` | Click an element |
| `snapshot` | `node browser.js snapshot` | Take a screenshot for visual inspection |
| `wait`  | `node browser.js wait <ms>` | Wait N milliseconds |
| `summary` | `node browser.js summary` | Print current page state without interacting |
| `status` | `node browser.js status` | Show queued commands (before executing) |
| `clear` | `node browser.js clear` | Discard the queue without executing |
| `end`   | `node browser.js end [--headed] [--slow]` | Execute all queued commands |

## Flags (for `end`)

- `--headed` — Open the browser visibly on screen
- `--slow` — 500ms delay between actions (useful for visual debugging)

## Interpreting Output

After `end`, each command prints its result sequentially:

- `[Title]` — Page title
- `[URL]` — Current URL
- `[H1]`, `[H2]` — Visible headings
- `[input]` — Form fields (with id, data-testid, type)
- `[button]` — Clickable buttons
- `[a]` — Links
- `[MESSAGE]` — Error or status messages

## Decision Flow

1. **Start** with `begin`
2. **Navigate** with `goto <url>`
3. **Fill** fields with `fill <selector> <text>`
4. **Click** the action button with `click <selector>`
5. **Verify** with `snapshot` or `summary`
6. **Execute** with `end`
7. **Analyze** the output:
   - If `[URL]` changed to the expected page → success
   - If `[MESSAGE]` shows an error → action failed, build a new corrected batch

## Selectors

Prefer selectors in this order:
1. `#id` (e.g., `#login-btn`)
2. `[data-testid="..."]` (e.g., `[data-testid="user-input"]`)
3. Composite CSS selectors as a last resort

## Persistent State

The browser retains cookies and session between batches (uses `launchPersistentContext`). After a successful login, subsequent batches will already be authenticated.

## Example: Successful Login

```bash
node browser.js begin
node browser.js goto http://localhost:3000/login
node browser.js fill #username admin
node browser.js fill #password 1234
node browser.js click #login-btn
node browser.js snapshot
node browser.js end
```

Expected result after execution: the `click` output will show `[URL] http://localhost:3000/dashboard` and `[H1] Welcome to Dashboard`.

## Example: Detect Error and Retry

If the previous batch output showed `[MESSAGE] #error-message → "Invalid Credentials"`, build a new batch with correct credentials:

```bash
node browser.js begin
node browser.js goto http://localhost:3000/login
node browser.js fill #username admin
node browser.js fill #password 1234
node browser.js click #login-btn
node browser.js end
```
