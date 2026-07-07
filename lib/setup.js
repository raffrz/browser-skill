import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_FILE = path.join(__dirname, '..', 'skills', 'browser_navigator.md');

export function runSetup(target) {
  switch (target) {
    case 'kiro': {
      const steeringDir = path.join(os.homedir(), '.kiro', 'steering');
      if (!existsSync(steeringDir)) mkdirSync(steeringDir, { recursive: true });

      const dest = path.join(steeringDir, 'browser-skill.md');

      const content = readFileSync(SKILL_FILE, 'utf-8');
      const withFrontMatter = `---\ninclusion: manual\n---\n\n${content}`;
      writeFileSync(dest, withFrontMatter, 'utf-8');

      console.log(`✅ Skill installed for Kiro at: ${dest}`);
      console.log(`   Use #browser-skill in chat to activate it.`);
      break;
    }

    case 'generic': {
      const content = readFileSync(SKILL_FILE, 'utf-8');
      console.log(content);
      break;
    }

    case 'path': {
      console.log(SKILL_FILE);
      break;
    }

    default:
      console.error(`Unknown setup target: "${target}"`);
      console.error('Available targets: kiro, generic, path');
      process.exit(1);
  }
}
