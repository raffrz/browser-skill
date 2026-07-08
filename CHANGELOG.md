# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- `--setup kiro` now installs skill to `~/.kiro/skills/browser-skill/SKILL.md` (Kiro skills format) instead of steering directory
- `skills/browser_navigator.md` updated with front-matter (`name`, `description`) for Kiro skill discovery
- Removed manual inclusion front-matter wrapper — skill file is copied as-is
- README updated to reflect new Kiro skill install path

## [0.2.0] - 2026-07-08

### Added
- Global CLI install via `npm install -g browser-skill` (bin field in package.json)
- `--setup kiro` command to install skill into `~/.kiro/steering/` with manual inclusion front-matter
- `--setup generic` command to print skill instructions to stdout
- `--setup path` command to print path to the skill .md file
- `--version` flag to display current version
- `--help` flag with full usage documentation
- `lib/setup.js` module for setup command logic

### Changed
- Session data moved from local `.browser-session/` to `~/.browser-skill/session/` (global, persistent)
- Screenshots moved from local `screenshots/` to `~/.browser-skill/screenshots/`
- Queue file stored at `~/.browser-skill/_queue.json`
- CLI error messages now reference `browser-skill` instead of `node browser.js`
- README rewritten to focus on skill installation and agent integration
- `skills/browser_navigator.md` updated to reference global `browser-skill` command

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
