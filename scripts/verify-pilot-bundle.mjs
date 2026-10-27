// Offline verification only. Review the pinned reference source before running it.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const watDay = iso => {
  const milliseconds = Date.parse(iso);
  assert.ok(Number.isFinite(milliseconds), 'invalid timestamp');
  return new Date(milliseconds + 3600e3).toISOString().slice(0, 10);
};
const fields = ['delivered_opens', 'delivered_clients', 'received_open', 'received_viewed'];

export async function verifyBundle({ directory, manifestSha256, ruleSha256, acceptanceSha256 }) {
  for (const pin of [manifestSha256, ruleSha256, acceptanceSha256])
    assert.match(pin || '', /^[0-9a-f]{64}$/, 'three explicit SHA-256 pins are required');
  const rawManifest = await readFile(resolve(directory, 'manifest.json'));
  assert.equal(sha256(rawManifest), manifestSha256, 'manifest pin mismatch');
  const manifest = JSON.parse(rawManifest);
  assert.equal(manifest.schema, 1, 'unsupported bundle schema');
  assert.equal(manifest.timezone, 'WAT (UTC+01:00)');
  assert.match(manifest.day, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(manifest.pins.rule_sha256, ruleSha256, 'rule review pin mismatch');
  assert.equal(manifest.pins.acceptance_sha256, acceptanceSha256, 'acceptance changed: not the same check');
  const bytes = {};
  for (const [name, item] of Object.entries(manifest.files)) {
    assert.match(name, /^[a-z0-9][a-z0-9_.-]*$/, 'unsafe artifact path');
    bytes[name] = await readFile(resolve(directory, name));
    assert.equal(sha256(bytes[name]), item.sha256, 'artifact digest mismatch: ' + name);
  }
  const json = name => { assert.ok(bytes[name], 'missing artifact: ' + name); return JSON.parse(bytes[name]); };
  const rule = json('rule.json');
  assert.equal(sha256(rule.rule), ruleSha256, 'rule text does not match pin');
  assert.equal(rule.sha256, ruleSha256);
  assert.equal(sha256(JSON.stringify(rule.pilot_acceptance)), acceptanceSha256, 'acceptance object does not match pin');
  assert.equal(rule.acceptance_sha256, acceptanceSha256);
  assert.ok(bytes['reference.mjs'], 'missing reference');
  assert.equal(sha256(bytes['reference.mjs']), manifest.pins.reference_sha256, 'reference pin mismatch');
  assert.ok(bytes['reference.mjs'].toString().includes(ruleSha256), 'reference does not identify the pinned rule');
  // No network fetch or tracked-link request. This runs only the locally retained,
  // digest-checked source; a digest is an integrity check, not a code safety review.
  const { computeReceipts } = await import('data:text/javascript;base64,' + bytes['reference.mjs'].toString('base64'));
  const candidates = json('candidates.json').candidates;
  const seen = new Set(), results = [];
  for (const lane of manifest.lanes) {
    assert.match(lane.agent_code, /^[a-z0-9-]{4,40}$/, 'one explicit agent_code required');
    assert.ok(!seen.has(lane.agent_code), 'duplicate lane'); seen.add(lane.agent_code);
    assert.equal(lane.classification, lane.agent_code === 'challenge' ? 'synthetic_challenge' : 'external_candidate');
    if (lane.classification === 'external_candidate')
      assert.ok(candidates.some(x => x.agent_code === lane.agent_code && x.classification === lane.classification), 'candidate classification missing');
    const rows = json(lane.rows_file), summary = json(lane.summary_file);
    for (const [name, value] of [[lane.rows_file, rows], [lane.summary_file, summary]]) {
      const url = new URL(manifest.files[name].url);
      assert.equal(url.searchParams.get('agent_code'), lane.agent_code, 'unscoped or wrong-agent request');
      assert.equal(url.searchParams.get('day'), manifest.day, 'wrong requested WAT day');
      assert.equal(value.agent_code, lane.agent_code, 'mixed-agent response');
      assert.equal(value.day, manifest.day, 'wrong response day');
      assert.equal(value.rule_sha256, ruleSha256, 'response rule changed');
    }
    assert.equal(rows.count, rows.rows.length, 'row count mismatch');
    // The live endpoint currently caps responses at 5000 rows without pagination.
    // A saturated export cannot certify completeness even if its summary agrees.
    assert.ok(rows.count < 5000, 'row cap reached: completeness is unproven');
    const rowKeys = new Set();
    for (const row of rows.rows) {
      assert.equal(row.agent_code, lane.agent_code, 'cross-agent row');
      assert.equal(row.day, manifest.day, 'cross-day row');
      assert.ok(['bot', 'human'].includes(row.tier), 'invalid tier');
      assert.ok(Number.isSafeInteger(row.opens) && row.opens >= 0, 'invalid opens');
      assert.match(row.client_key, /^[0-9a-f]{16}$/);
      assert.equal(typeof row.target, 'string');
      assert.equal(typeof row.viewed, 'boolean');
      const rowKey = JSON.stringify([row.day, row.agent_code, row.target, row.client_key, row.tier]);
      assert.ok(!rowKeys.has(rowKey), 'duplicate receipt row'); rowKeys.add(rowKey);
    }
    const computed = computeReceipts(rows.rows);
    assert.deepEqual(computed, Object.fromEntries(fields.map(k => [k, summary[k]])), 'summary mismatch');
    results.push({ agent_code: lane.agent_code, classification: lane.classification, rows: rows.count, summary: computed, result: 'PASS_INSTRUMENTS' });
  }
  assert.ok(results.length > 0, 'no scoped lanes');
  return { result: 'PASS_INSTRUMENTS', day: manifest.day, timezone: manifest.timezone, acceptance_sha256: acceptanceSha256, lanes: results,
    limits: 'Integrity and arithmetic of this retained snapshot only. Not proof of upstream completeness, operator independence, a share, a human reader, a payment, an independent timestamp, or append-only void history.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2), options = {};
    assert.equal(args.length, 8, 'usage: --dir PATH --manifest-sha256 SHA --rule-sha256 SHA --acceptance-sha256 SHA');
    for (let i = 0; i < args.length; i += 2) { assert.ok(!options[args[i]], 'duplicate option'); options[args[i]] = args[i + 1]; }
    assert.deepEqual(Object.keys(options).sort(), ['--acceptance-sha256', '--dir', '--manifest-sha256', '--rule-sha256']);
    console.log(JSON.stringify(await verifyBundle({ directory: options['--dir'], manifestSha256: options['--manifest-sha256'], ruleSha256: options['--rule-sha256'], acceptanceSha256: options['--acceptance-sha256'] }), null, 2));
  } catch (error) { console.error('FAIL_INSTRUMENTS: ' + error.message); process.exitCode = 1; }
}
