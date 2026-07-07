# browser-skill

A drop-in browser skill for AI agents — navigate, fill forms, click buttons and read pages via shell commands. No SDK, no protocol, just CLI.

## What is this?

`browser-skill` gives your AI agent the ability to **see and interact with web pages**. It exposes a minimal CLI that any LLM-based agent can call through shell commands, receiving structured text output that describes the page state.

The agent reads the output, decides what to do next, and issues the next batch of commands.

## Install

```bash
npm install -g browser-skill
npx playwright install chromium
```

After install, `browser-skill` is available globally in your PATH.

## How It Works

Commands are queued in a batch and executed in a single persistent browser session:

```bash
browser-skill begin                      # start a batch
browser-skill goto "http://example.com"  # queue: navigate
browser-skill fill "#email" "user@x.com" # queue: fill input
browser-skill click "#submit"            # queue: click button
browser-skill snapshot                   # queue: take screenshot
browser-skill end                        # execute all at once
```

After execution, each command prints structured output:

```
[Title] Dashboard
[URL] http://example.com/dashboard
---
[H1] Welcome
[button] #logout type="submit" → "Sign Out"
[input] #search type="text" → ""
```

The agent reads this to understand the page and decide the next action.

## Setting Up as an Agent Skill

### Kiro IDE (automatic)

```bash
browser-skill --setup kiro
```

This copies the skill instructions to `~/.kiro/steering/browser-skill.md` with manual inclusion. Then use `#browser-skill` in any Kiro chat to give the agent browser capabilities.

### Other AI Agents

```bash
# Print skill instructions to stdout (pipe into your agent's context)
browser-skill --setup generic

# Get the path to the skill .md file
browser-skill --setup path
```

For any agent that can execute shell commands, include the output of `--setup generic` in the system prompt or context. The agent will know how to use `browser-skill` commands.

### Example system prompt addition

```
You have a browser automation skill installed globally as `browser-skill`.
Follow the instructions to navigate, fill forms, click and read web pages.
Always start with `browser-skill begin` and finish with `browser-skill end`.
```

## Commands Reference

| Command | Usage | Description |
|---------|-------|-------------|
| `begin` | `browser-skill begin` | Start a new batch session |
| `goto` | `browser-skill goto <url>` | Navigate to URL |
| `fill` | `browser-skill fill <selector> <text>` | Fill an input field |
| `click` | `browser-skill click <selector>` | Click an element |
| `snapshot` | `browser-skill snapshot` | Take a screenshot |
| `wait` | `browser-skill wait <ms>` | Wait N milliseconds |
| `summary` | `browser-skill summary` | Print current page state |
| `status` | `browser-skill status` | Show queued commands |
| `clear` | `browser-skill clear` | Discard the queue |
| `end` | `browser-skill end [--headed] [--slow]` | Execute all queued commands |

## Key Features

- **Global CLI** — install once, use from anywhere
- **Batch execution** — queue multiple commands, run in one browser session
- **Persistent sessions** — cookies and auth survive between batches (`~/.browser-skill/session/`)
- **Structured output** — page state as text the agent can parse and reason about
- **Screenshots** — saved to `~/.browser-skill/screenshots/`
- **Headed mode** — watch the browser live with `--headed`
- **Agent setup** — `--setup kiro` or `--setup generic` for instant integration

## Data Directory

All persistent data lives in `~/.browser-skill/`:

```
~/.browser-skill/
  session/        # Browser state (cookies, localStorage)
  screenshots/    # Captured screenshots
  _queue.json     # Current batch queue
```

## Example: Agent Login Flow

```bash
browser-skill begin
browser-skill goto "http://localhost:3000/login"
browser-skill fill "#username" "admin"
browser-skill fill "#password" "1234"
browser-skill click "#login-btn"
browser-skill snapshot
browser-skill end
```

Output after `click`:
```
[Title] Dashboard
[URL] http://localhost:3000/dashboard
---
[H1] Bem-vindo ao Dashboard
[button] #logout-btn type="submit" → "Sair"
```

The agent sees the URL changed to `/dashboard` and knows login succeeded.

## Local Development

```bash
# Clone the repo
git clone https://github.com/raffrz/browser-skill.git
cd browser-skill
npm install

# Link globally for development
npm link

# Start the embedded test server (for local testing)
npm run server

# Run tests
npm test
```

## Project Structure

```
browser.js              # CLI entry point (global bin)
lib/
  queue.js              # Batch queue management
  setup.js              # --setup command implementation
skills/
  browser_navigator.md  # Agent instructions (the actual "skill")
server.js               # Embedded test server for validation
workflows/              # Reusable automation scripts
```

## Tech Stack

- [Playwright](https://playwright.dev/) — browser automation
- [Express](https://expressjs.com/) — embedded test server
- Node.js ESM

## License

[MIT](LICENSE)
