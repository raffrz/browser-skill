#!/usr/bin/env node

/**
 * Local Login Workflow
 *
 * Demonstrates the batch command system by automating login
 * on the embedded test server (server.js).
 *
 * Prerequisites:
 *   npm run server   (start the local server on port 3000)
 */

import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:3000';

const commands = [
  'node browser.js begin',
  `node browser.js goto "${BASE_URL}/login"`,
  'node browser.js fill "#username" admin',
  'node browser.js fill "#password" 1234',
  'node browser.js click "#login-btn"',
  'node browser.js snapshot',
  'node browser.js end',
];

console.log('🚀 Running local login workflow...\n');

try {
  commands.forEach((cmd, index) => {
    console.log(`[${index + 1}/${commands.length}] ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
  });

  console.log('\n✅ Workflow completed successfully!');
} catch (error) {
  console.error('\n❌ Workflow failed:', error.message);
  process.exit(1);
}
