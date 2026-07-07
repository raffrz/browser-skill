import { existsSync, writeFileSync, readFileSync, unlinkSync, mkdirSync } from 'fs';
import path from 'path';

// ─── Queue Management ─────────────────────────────────────────────────────────

export function createQueueManager(sessionDir) {
  const queueFile = path.join(sessionDir, '_queue.json');

  if (!existsSync(sessionDir)) mkdirSync(sessionDir, { recursive: true });

  function load() {
    if (existsSync(queueFile)) {
      return JSON.parse(readFileSync(queueFile, 'utf-8'));
    }
    return { active: false, commands: [] };
  }

  function save(queue) {
    writeFileSync(queueFile, JSON.stringify(queue, null, 2), 'utf-8');
  }

  function clear() {
    if (existsSync(queueFile)) unlinkSync(queueFile);
  }

  return { load, save, clear };
}
