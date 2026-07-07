import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, rmSync, mkdirSync } from 'fs';
import path from 'path';
import { createQueueManager } from '../lib/queue.js';

const TEST_DIR = path.join('.', '.test-session');

describe('Queue Management', () => {
  let queue;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    queue = createQueueManager(TEST_DIR);
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  it('should return empty inactive queue when no file exists', () => {
    const result = queue.load();
    assert.deepEqual(result, { active: false, commands: [] });
  });

  it('should save and load a queue', () => {
    const data = { active: true, commands: [{ action: 'goto', args: ['http://example.com'] }] };
    queue.save(data);
    const loaded = queue.load();
    assert.deepEqual(loaded, data);
  });

  it('should accumulate commands in queue', () => {
    queue.save({ active: true, commands: [] });

    const state = queue.load();
    state.commands.push({ action: 'goto', args: ['http://localhost:3000'] });
    state.commands.push({ action: 'fill', args: ['#user', 'admin'] });
    state.commands.push({ action: 'click', args: ['#btn'] });
    queue.save(state);

    const loaded = queue.load();
    assert.equal(loaded.commands.length, 3);
    assert.equal(loaded.commands[0].action, 'goto');
    assert.equal(loaded.commands[2].action, 'click');
  });

  it('should clear the queue file', () => {
    queue.save({ active: true, commands: [{ action: 'snapshot', args: [] }] });
    queue.clear();
    const loaded = queue.load();
    assert.deepEqual(loaded, { active: false, commands: [] });
  });

  it('should not throw when clearing non-existent queue', () => {
    assert.doesNotThrow(() => queue.clear());
  });

  it('should create session directory if it does not exist', () => {
    const customDir = path.join('.', '.test-session-new');
    if (existsSync(customDir)) rmSync(customDir, { recursive: true });

    createQueueManager(customDir);
    assert.ok(existsSync(customDir));

    rmSync(customDir, { recursive: true });
  });
});
