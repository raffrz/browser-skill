#!/usr/bin/env node

import { chromium } from 'playwright';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import os from 'os';
import { createQueueManager } from './lib/queue.js';
import { runSetup } from './lib/setup.js';

// ─── Configuration ────────────────────────────────────────────────────────────

const HOME_DIR = path.join(os.homedir(), '.browser-skill');
const SESSION_DIR = path.join(HOME_DIR, 'session');
const SCREENSHOTS_DIR = path.join(HOME_DIR, 'screenshots');

if (!existsSync(HOME_DIR)) mkdirSync(HOME_DIR, { recursive: true });
if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { recursive: true });
if (!existsSync(SCREENSHOTS_DIR)) mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const { load: loadQueue, save: saveQueue, clear: clearQueue } = createQueueManager(HOME_DIR);

// ─── Page Summary ─────────────────────────────────────────────────────────────

async function getPageSummary(page) {
  return await page.evaluate(() => {
    const lines = [];

    const title = document.title;
    if (title) lines.push(`[Title] ${title}`);
    lines.push(`[URL] ${window.location.href}`);
    lines.push('---');

    document.querySelectorAll('h1, h2, h3').forEach(el => {
      lines.push(`[${el.tagName}] ${el.textContent.trim()}`);
    });

    document.querySelectorAll('input, button, a, select, textarea').forEach(el => {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const testId = el.dataset.testid ? `[data-testid="${el.dataset.testid}"]` : '';
      const type = el.type ? `type="${el.type}"` : '';
      const text = el.textContent?.trim() || el.value || el.placeholder || '';
      const name = el.name ? `name="${el.name}"` : '';
      const href = el.href ? `href="${el.href}"` : '';
      const selector = id || testId || `${tag}${name ? `[${name}]` : ''}`;
      lines.push(`[${tag}] ${selector} ${type} ${href} → "${text}"`);
    });

    document.querySelectorAll('[id*="error"], [id*="message"], [class*="error"], [class*="alert"]').forEach(el => {
      const text = el.textContent.trim();
      if (text) lines.push(`[MESSAGE] #${el.id || el.className} → "${text}"`);
    });

    return lines.join('\n');
  });
}

// ─── Command Executor (runs inside a live browser session) ────────────────────

async function executeCommand(page, cmd) {
  const { action, args } = cmd;

  switch (action) {
    case 'goto': {
      const url = args[0];
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      try {
        const summary = await getPageSummary(page);
        console.log(`> goto ${url}`);
        console.log(summary);
      } catch (err) {
        console.log(`> goto ${url}`);
        console.log(`  ⚠️  Summary unavailable (navigation in progress)`);
      }
      console.log('');
      break;
    }

    case 'fill': {
      const [selector, ...textParts] = args;
      const text = textParts.join(' ');
      await page.fill(selector, text);
      console.log(`> fill "${selector}" "${text}"`);
      console.log(`  ✓ Filled`);
      console.log('');
      break;
    }

    case 'click': {
      const selector = args[0];
      await page.click(selector);
      await page.waitForLoadState('domcontentloaded');
      try {
        const summary = await getPageSummary(page);
        console.log(`> click "${selector}"`);
        console.log(summary);
      } catch (err) {
        console.log(`> click "${selector}"`);
        console.log(`  ⚠️  Summary unavailable (navigation in progress)`);
      }
      console.log('');
      break;
    }

    case 'snapshot': {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot-${timestamp}.png`;
      const filepath = path.join(SCREENSHOTS_DIR, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      console.log(`> snapshot`);
      console.log(`  📸 ${filepath}`);
      console.log('');
      break;
    }

    case 'wait': {
      const ms = parseInt(args[0]) || 1000;
      await page.waitForTimeout(ms);
      console.log(`> wait ${ms}ms`);
      console.log('');
      break;
    }

    case 'summary': {
      const summary = await getPageSummary(page);
      console.log(`> summary`);
      console.log(summary);
      console.log('');
      break;
    }

    default:
      console.error(`  ❌ Unknown command: "${action}"`);
  }
}

// ─── Batch Execution ──────────────────────────────────────────────────────────

async function executeBatch(queue, options = {}) {
  const { headed, slowMo } = options;

  console.log(`\n🚀 Executing batch (${queue.commands.length} commands)...\n`);

  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: !headed,
    slowMo: slowMo || 0,
    viewport: { width: 1280, height: 720 },
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    for (let i = 0; i < queue.commands.length; i++) {
      const cmd = queue.commands[i];
      console.log(`[${i + 1}/${queue.commands.length}] ────────────────────`);
      await executeCommand(page, cmd);
    }
    console.log('✅ Batch completed successfully!');
  } catch (err) {
    console.error(`❌ Error during execution: ${err.message}`);
    try {
      const summary = await getPageSummary(page);
      console.error(`Page state at time of error:\n${summary}`);
    } catch {}
  } finally {
    await context.close();
    clearQueue();
  }
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
browser-skill — Browser automation skill for AI agents
═══════════════════════════════════════════════════════════

Usage:
  browser-skill <command> [args]

Session control:
  begin                        Start a new batch session
  end [--headed] [--slow]      Execute all queued commands

Commands (queued after 'begin'):
  goto <url>                   Navigate to URL
  fill <selector> <text>       Fill an input field
  click <selector>             Click an element
  snapshot                     Take a screenshot
  wait <ms>                    Wait N milliseconds
  summary                      Print current page state

Utilities:
  status                       Show queued commands
  clear                        Discard the queue

Setup:
  --setup kiro                 Install skill into ~/.kiro/steering/
  --setup generic              Print skill instructions to stdout
  --setup path                 Print path to skill .md file

Info:
  --version                    Show version
  --help                       Show this help

Data directory: ${HOME_DIR}
`);
}

function main() {
  const rawArgs = process.argv.slice(2);

  // ─── Handle flags ───────────────────────────────────────────────────────
  if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (rawArgs.includes('--version') || rawArgs.includes('-v')) {
    const pkgPath = new URL('./package.json', import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    console.log(pkg.version);
    process.exit(0);
  }

  if (rawArgs.includes('--setup')) {
    const setupIdx = rawArgs.indexOf('--setup');
    const target = rawArgs[setupIdx + 1] || 'generic';
    runSetup(target);
    process.exit(0);
  }

  // ─── Commands ───────────────────────────────────────────────────────────
  const headed = rawArgs.includes('--headed');
  const slow = rawArgs.includes('--slow');
  const args = rawArgs.filter(a => !a.startsWith('--'));
  const command = args[0];

  if (!command) {
    printHelp();
    process.exit(0);
  }

  const queue = loadQueue();

  switch (command) {
    // ─── Session Control ──────────────────────────────────────────────────
    case 'begin': {
      if (queue.active) {
        console.log('⚠️  Batch session already active. Use "end" to execute or "clear" to reset.');
        console.log(`   ${queue.commands.length} command(s) in queue.`);
        process.exit(1);
      }
      const newQueue = { active: true, commands: [] };
      saveQueue(newQueue);
      console.log('🟢 Batch session started. Queue commands and finish with "end".');
      break;
    }

    case 'end': {
      if (!queue.active || queue.commands.length === 0) {
        console.log('⚠️  No commands in queue. Use "begin" first and add commands.');
        process.exit(1);
      }
      executeBatch(queue, { headed, slowMo: slow ? 500 : 0 });
      break;
    }

    case 'status': {
      if (!queue.active) {
        console.log('💤 No active batch session.');
      } else {
        console.log(`📋 Active batch session - ${queue.commands.length} command(s) in queue:`);
        queue.commands.forEach((cmd, i) => {
          console.log(`   ${i + 1}. ${cmd.action} ${cmd.args.join(' ')}`);
        });
      }
      break;
    }

    case 'clear': {
      clearQueue();
      console.log('🗑️  Queue cleared.');
      break;
    }

    // ─── Queueable Commands ───────────────────────────────────────────────
    case 'goto':
    case 'fill':
    case 'click':
    case 'snapshot':
    case 'wait':
    case 'summary': {
      if (!queue.active) {
        console.error('❌ No active batch session. Run "browser-skill begin" first.');
        process.exit(1);
      }

      const cmdArgs = args.slice(1);

      if (command === 'goto' && cmdArgs.length === 0) {
        console.error('Error: URL required. Usage: browser-skill goto <url>');
        process.exit(1);
      }
      if (command === 'click' && cmdArgs.length === 0) {
        console.error('Error: Selector required. Usage: browser-skill click <selector>');
        process.exit(1);
      }
      if (command === 'fill' && cmdArgs.length < 2) {
        console.error('Error: Selector and text required. Usage: browser-skill fill <selector> <text>');
        process.exit(1);
      }

      queue.commands.push({ action: command, args: cmdArgs });
      saveQueue(queue);
      console.log(`  📥 [${queue.commands.length}] ${command} ${cmdArgs.join(' ')}`);
      break;
    }

    default:
      console.error(`Unknown command: "${command}". Use "browser-skill --help" to see options.`);
      process.exit(1);
  }
}

main();
