// Read-only public export. It never visits a tracked redirect or creates a challenge.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { sha256, watDay, verifyBundle } from './verify-pilot-bundle.mjs';
import assert from 'node:assert/strict';

const directory = resolve(process.argv[2] || '');
assert.ok(process.argv[2], 'provide a NEW output directory');
await mkdir(dirname(directory), { recursive: true });
await mkdir(directory); // No overwrite: every later capture needs a new directory.
const started = new Date().toISOString(), day = watDay(started), base = 'https://agents.serviqo.co';
const manifest = { schema: 1, purpose: 'Operator-exported receipt snapshot for external verifier review',
  day, timezone: 'WAT (UTC+01:00)', capture_started_at: started, capture_finished_at: null,
  timestamps: 'Exporter clock observations; not an independent timestamp witness or atomic database snapshot.',
  pins: {}, files: {}, lanes: [],
  limitations: ['Candidate classifications do not verify independent operation.', 'No source share or operator authorization is supplied by this export.', 'No immutable ledger, append-only void history, or guaranteed repository availability.', 'Sequential reads can race with live traffic; a disagreement fails verification.', 'The live rows API is limited to 5000 rows; a full-sized result is rejected as incomplete.'] };
async function capture(name, path) {
  assert.ok(path.startsWith('/api/v1/') || path === '/healthz');
  const url = base + path;
  const response = await fetch(url, { headers: { 'user-agent': 'serviqo-internal-verifier-export' }, redirect: 'error', signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, 'capture failed: ' + path);
  const data = Buffer.from(await response.arrayBuffer());
  await writeFile(resolve(directory, name), data, { flag: 'wx' });
  manifest.files[name] = { url, method: 'GET', observed_at: new Date().toISOString(), status: response.status, bytes: data.length, sha256: sha256(data) };
  return name.endsWith('.json') ? JSON.parse(data) : data;
}
const rule = await capture('rule.json', '/api/v1/receipts/rule');
const reference = await capture('reference.mjs', '/api/v1/receipts/reference.mjs');
const candidates = await capture('candidates.json', '/api/v1/pilot/candidates');
await capture('health.json', '/healthz');
await capture('counting-rules.json', '/api/v1/counting-rules');
manifest.pins = { rule_sha256: rule.sha256, acceptance_sha256: rule.acceptance_sha256, reference_sha256: sha256(reference) };
const codes = [...candidates.candidates.map(x => x.agent_code), 'challenge'];
for (const code of codes) {
  assert.match(code, /^[a-z0-9-]{4,40}$/);
  const query = new URLSearchParams({ day, agent_code: code });
  const rows_file = code + '.rows.json', summary_file = code + '.summary.json';
  await capture(rows_file, '/api/v1/receipts/rows?' + query);
  await capture(summary_file, '/api/v1/receipts/summary?' + query);
  manifest.lanes.push({ agent_code: code, classification: code === 'challenge' ? 'synthetic_challenge' : 'external_candidate', rows_file, summary_file });
}
const endRule = await capture('rule-at-end.json', '/api/v1/receipts/rule');
assert.equal(endRule.sha256, rule.sha256, 'rule changed during capture');
assert.equal(endRule.acceptance_sha256, rule.acceptance_sha256, 'acceptance changed during capture');
manifest.capture_finished_at = new Date().toISOString();
assert.equal(watDay(manifest.capture_finished_at), day, 'capture crossed a WAT day boundary');
const manifestBytes = JSON.stringify(manifest, null, 2) + '\n';
await writeFile(resolve(directory, 'manifest.json'), manifestBytes, { flag: 'wx' });
const pins = { directory, manifestSha256: sha256(manifestBytes), ruleSha256: rule.sha256, acceptanceSha256: rule.acceptance_sha256 };
console.log(JSON.stringify({ pins, verification: await verifyBundle(pins) }, null, 2));
