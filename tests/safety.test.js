import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('core demo has no network or execution/trading dependency', () => {
  const source = fs.readFileSync(new URL('../src/core.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /fetch\s*\(|node:https|node:http|orderExecution|allowOrder|privateKey|exchange/i);
});
