import fs from 'node:fs';
import { discoverSignals } from './core.js';

const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const fixtureIndex = args.indexOf('--fixture');
const file = inputIndex >= 0 ? args[inputIndex + 1] : (fixtureIndex >= 0 ? args[fixtureIndex + 1] : null);
if (!file) {
  console.error('Usage: node src/cli.js --input signal-input.json');
  process.exit(2);
}
const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
const rows = payload.rows || [];
const t0Rows = rows.filter(row => row.split === (payload.t0Split || 'T0'));
const result = discoverSignals(rows, { datasetId: payload.datasetId || 'local-input', target: payload.target, features: payload.features || [], t0Rows });
console.log(JSON.stringify({ datasetId: payload.datasetId || 'local-input', t0Rows: t0Rows.length, signals: result }, null, 2));
