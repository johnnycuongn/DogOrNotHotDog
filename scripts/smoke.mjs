// End-to-end check: can this machine actually reach Claude?
// It verifies the wiring — Node, dependencies, and the Claude Code login —
// not whether the model gets the answer right. Any well-formed reply passes.
import { classify } from '../classifier.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const image = readFileSync(path.join(here, '..', 'test', 'fixtures', 'hotdog.png'));

try {
  const { verdict, confidence, saw } = await classify(image, 'image/png');
  console.log(`✓ Claude replied: ${verdict} (${Math.round(confidence * 100)}% — "${saw}")`);
  if (verdict !== 'hotdog') {
    console.log('  It called the drawing something else, which is fine — the');
    console.log('  round trip is what this checks, and that worked.');
  }
  process.exit(0);
} catch (error) {
  console.error(`✗ ${error.message}\n`);
  console.error('  Most likely this Mac is not logged in to Claude Code.');
  console.error('  Run `claude` once, finish the login, then try again.');
  process.exit(1);
}
