import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './helpers/server.js';

describe('Embedded Server', () => {
  let baseUrl;
  let server;

  before(async () => {
    const result = await createServer();
    server = result.server;
    baseUrl = result.baseUrl;
  });

  after(() => {
    server.close();
  });

  it('GET /login should return login page with form elements', async () => {
    const res = await fetch(`${baseUrl}/login`);
    const html = await res.text();

    assert.equal(res.status, 200);
    assert.ok(html.includes('id="username"'));
    assert.ok(html.includes('id="password"'));
    assert.ok(html.includes('id="login-btn"'));
    assert.ok(html.includes('id="error-message"'));
  });

  it('POST /api/login with valid credentials should redirect to dashboard', async () => {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=admin&password=1234',
      redirect: 'manual',
    });

    assert.equal(res.status, 302);
    assert.ok(res.headers.get('location').includes('/dashboard'));
  });

  it('POST /api/login with invalid credentials should show error', async () => {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=wrong&password=wrong',
    });

    const html = await res.text();
    assert.equal(res.status, 200);
    assert.ok(html.includes('Invalid Credentials'));
  });

  it('GET /dashboard should return dashboard page', async () => {
    const res = await fetch(`${baseUrl}/dashboard`);
    const html = await res.text();

    assert.equal(res.status, 200);
    assert.ok(html.includes('Welcome to Dashboard'));
    assert.ok(html.includes('id="logout-btn"'));
  });
});
