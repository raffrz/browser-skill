# Workflows - Reusable Automation Flows

This folder contains pre-configured automation flows for common tasks using `browser.js`.

## Structure

Each workflow has three files:

1. **`*.md`** - Full documentation
2. **`*.js`** - Executable script
3. **`*.json`** - Structured configuration (for parsing/automation)

## Available Workflows

### Local Login
Authenticates on the embedded test server (`server.js`).

**Quick run:**
```bash
npm run server          # start the target app
node workflows/local-login.js
```

**Documentation:**
```bash
cat workflows/local-login.md
```

## Creating a New Workflow

### 1. Test the flow manually
```bash
node browser.js begin
node browser.js goto "<url>"
node browser.js fill "<selector>" "<text>"
node browser.js click "<selector>"
node browser.js snapshot
node browser.js end --headed
```

### 2. Document in a .md file
Create `workflows/<flow-name>.md` with:
- Description and objective
- Command list
- Selectors used
- Success/failure indicators

### 3. Create the executable .js
```javascript
import { execSync } from 'child_process';

const commands = [
  'node browser.js begin',
  'node browser.js goto "..."',
  // ...
  'node browser.js end'
];

commands.forEach(cmd => execSync(cmd, { stdio: 'inherit' }));
```

### 4. Create the .json configuration
Structure the workflow in JSON for programmatic access and integration with other tools.

## Best Practices

### Selectors
- Prefer IDs (`#element`)
- Use `data-testid` when available
- Avoid fragile CSS paths

### Validation
- Always include `snapshot` at the end
- Use `summary` to inspect page state
- Document expected URLs at each step

### Security
- **Never commit real credentials** in public workflows
- Use environment variables or placeholders
- Add credential files to `.gitignore`

### Wait Times
- Use generous waits after navigations (3-5s)
- Wait after clicks that cause redirects
- SPAs may need longer load times

## Troubleshooting

### Workflow fails mid-execution
- Increase `wait` times
- Verify selectors still exist
- Use `--headed` to watch the browser

### Session not persisting
- Check that `.browser-session/` exists locally
- Clear and retry: delete `.browser-session/` folder
