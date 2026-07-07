import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from './helpers/server.js';

describe('E2E: Login Flow', () => {
  let baseUrl;
  let server;
  let browser;
  let page;

  before(async () => {
    const result = await createServer();
    server = result.server;
    baseUrl = result.baseUrl;
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  after(async () => {
    await browser.close();
    server.close();
  });

  it('should login successfully with valid credentials', async () => {
    await page.goto(`${baseUrl}/login`);

    await page.fill('#username', 'admin');
    await page.fill('#password', '1234');
    await page.click('#login-btn');

    await page.waitForURL('**/dashboard');

    const heading = await page.textContent('h1');
    assert.equal(heading, 'Welcome to Dashboard');
    assert.ok(page.url().includes('/dashboard'));
  });

  it('should show error with invalid credentials', async () => {
    await page.goto(`${baseUrl}/login`);

    await page.fill('#username', 'wrong');
    await page.fill('#password', 'wrong');
    await page.click('#login-btn');

    const error = await page.textContent('#error-message');
    assert.equal(error, 'Invalid Credentials');
  });

  it('should have correct form elements on login page', async () => {
    await page.goto(`${baseUrl}/login`);

    const username = page.locator('#username');
    const password = page.locator('#password');
    const button = page.locator('#login-btn');

    assert.ok(await username.isVisible());
    assert.ok(await password.isVisible());
    assert.ok(await button.isVisible());
    assert.equal(await password.getAttribute('type'), 'password');
  });
});
