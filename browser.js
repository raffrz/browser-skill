import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';
import { createQueueManager } from './lib/queue.js';

// ─── Configuration ────────────────────────────────────────────────────────────

const SESSION_DIR = './.browser-session';
const SCREENSHOTS_DIR = './screenshots';

if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { recursive: true });
if (!existsSync(SCREENSHOTS_DIR)) mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const { load: loadQueue, save: saveQueue, clear: clearQueue } = createQueueManager(SESSION_DIR);

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
    // Print page summary on error for debugging
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
Headless CLI Harness - Batch Mode
═════════════════════════════════════════════════════════

Session control:
  node browser.js begin                    Start a new batch session
  node browser.js end [--headed] [--slow]  Execute all queued commands

Commands (queued after 'begin'):
  node browser.js goto <url>               Navigate to URL
  node browser.js fill <selector> <text>   Fill an input field
  node browser.js click <selector>         Click an element
  node browser.js snapshot                 Take a screenshot
  node browser.js wait <ms>                Wait N milliseconds
  node browser.js summary                  Print current page state

Utilities:
  node browser.js status                   Show queued commands
  node browser.js clear                    Discard the queue

Flags (for 'end'):
  --headed    Open the browser visibly
  --slow      500ms delay between actions
`);
}

function main() {
  const rawArgs = process.argv.slice(2);
  const headed = rawArgs.includes('--headed');
  const slow = rawArgs.includes('--slow');
  const args = rawArgs.filter(a => !a.startsWith('--'));
  const command = args[0];

  if (!command || command === 'help') {
    printHelp();
    process.exit(0);
  }

  const queue = loadQueue();

  switch (command) {
    // ─── Session Control ────────────────────────────────────────────────────
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

    // ─── Queueable Commands ─────────────────────────────────────────────────
    case 'goto':
    case 'fill':
    case 'click':
    case 'snapshot':
    case 'wait':
    case 'summary': {
      if (!queue.active) {
        console.error('❌ No active batch session. Run "node browser.js begin" first.');
        process.exit(1);
      }

      const cmdArgs = args.slice(1);

      // Validate required args
      if (command === 'goto' && cmdArgs.length === 0) {
        console.error('Error: URL required. Usage: node browser.js goto <url>');
        process.exit(1);
      }
      if (command === 'click' && cmdArgs.length === 0) {
        console.error('Error: Selector required. Usage: node browser.js click <selector>');
        process.exit(1);
      }
      if (command === 'fill' && cmdArgs.length < 2) {
        console.error('Error: Selector and text required. Usage: node browser.js fill <selector> <text>');
        process.exit(1);
      }

      queue.commands.push({ action: command, args: cmdArgs });
      saveQueue(queue);
      console.log(`  📥 [${queue.commands.length}] ${command} ${cmdArgs.join(' ')}`);
      break;
    }

    default:
      console.error(`Unknown command: "${command}". Use "help" to see options.`);
      process.exit(1);
  }
}

main();
