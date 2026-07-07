# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-07

### Initial Release
- Headless browser control system with batch command execution
- Commands: `begin`, `goto`, `fill`, `click`, `wait`, `snapshot`, `summary`, `end`
- Headed mode (`--headed`) and slow motion (`--slow`) support
- Persistent sessions in `.browser-session/` (cookies and auth survive between batches)
- Batch command queue for single-session execution
- Automatic page state extraction after navigations and clicks
- Screenshots saved to `screenshots/` with timestamps
- Embedded test server (`server.js`) with login flow for local validation
- Reusable workflow system in `workflows/`
  - `local-login` — example automation using the local server
- AI agent documentation in `skills/browser_navigator.md`
- Robust navigation handling (try/catch on `getPageSummary` for context-destroying navigations)
- Test suite using `node:test` (unit, HTTP, and E2E tests)
- GitHub Actions CI pipeline (Node 18, 20, 22)
