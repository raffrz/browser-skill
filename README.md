# browser-interaction

A headless browser CLI harness designed for AI-driven web automation. Instead of relying on complex protocols, it exposes simple shell commands that an AI agent can call sequentially to navigate, fill forms, click buttons, and capture page state.

## Why

AI agents (LLMs) can execute shell commands. This tool gives them a minimal interface to interact with web pages through a persistent browser session — no MCP server, no WebSocket, no SDK. Just `stdin`/`stdout` over CLI.

## How It Works

Commands are queued in a batch and executed in a single browser session:

```bash
node browser.js begin                      # start a batch
node browser.js goto "http://example.com"  # queue: navigate
node browser.js fill "#email" "user@x.com" # queue: fill input
node browser.js click "#submit"            # queue: click button
node browser.js snapshot                   # queue: take screenshot
node browser.js end                        # execute all at once
```

After execution, each command prints structured output showing the page state (titles, headings, interactive elements, error messages) so the AI can decide what to do next.

## Features

- **Batch execution** — queue multiple commands, run in one browser session
- **Persistent sessions** — cookies and auth survive between batches
- **Page state extraction** — automatic summary of interactive elements after navigation
- **Screenshots** — visual snapshots saved with timestamps
- **Headed mode** — optionally watch the browser with `--headed`
- **Workflow system** — reusable automation scripts in `workflows/`

## Getting Started

```bash
# Install dependencies
npm install

# Start the test server (optional, for local testing)
npm run server

# Run the example workflow
node workflows/local-login.js
```

## Commands

| Command | Description |
|---------|-------------|
| `begin` | Start a new batch session |
| `goto <url>` | Navigate to URL |
| `fill <selector> <text>` | Fill an input field |
| `click <selector>` | Click an element |
| `snapshot` | Save a screenshot to `screenshots/` |
| `wait <ms>` | Wait N milliseconds |
| `summary` | Print current page state |
| `status` | Show queued commands |
| `clear` | Discard the queue |
| `end [--headed] [--slow]` | Execute all queued commands |

## Example Output

After a `click` or `goto`, the CLI prints:

```
[Title] Dashboard
[URL] http://localhost:3000/dashboard
---
[H1] Welcome to Dashboard
[button] #logout-btn type="submit" → "Sign Out"
```

An AI agent reads this output to understand the page and decide the next action.

## Workflows

Pre-built automation scripts live in `workflows/`. Each has three files:

- `*.js` — executable script
- `*.json` — structured config for programmatic use
- `*.md` — human-readable documentation

See [workflows/README.md](workflows/README.md) for details.

## Project Structure

```
browser.js              # CLI harness (queue + execute commands)
server.js               # Embedded test server for local validation
workflows/              # Reusable automation scripts
skills/                 # AI agent instructions
screenshots/            # Captured screenshots (gitignored)
.browser-session/       # Persistent browser data (gitignored)
```

## Tech Stack

- [Playwright](https://playwright.dev/) — browser automation
- [Express](https://expressjs.com/) — embedded test server
- Node.js ESM

## License

[MIT](LICENSE)
