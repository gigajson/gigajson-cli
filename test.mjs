// npm test: starts the command with --no-open and checks what its server answers. No dependencies.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const BIN = fileURLToPath(new URL('./bin/gigajson.mjs', import.meta.url));
const APP = 'http://localhost:5173/app/';
const dir = mkdtempSync(join(tmpdir(), 'gigajson-test-'));
const procs = [];
const run = (args, input) => new Promise((resolve, reject) => {
  const p = spawn(process.execPath, [BIN, ...args, '--no-open'], { env: { ...process.env, GIGAJSON_APP: APP }, stdio: ['pipe', 'pipe', 'pipe'] });
  procs.push(p);
  let text = '';
  p.stdout.on('data', d => { text += d; const m = /\?open=(\S+)/.exec(text); if (m) resolve(decodeURIComponent(m[1])); });
  p.stderr.on('data', d => { text += d; });
  p.on('exit', code => reject(Object.assign(new Error(text), { code })));
  p.stdin.end(input);
});

try {
  const file = join(dir, 'orders 1.json');
  writeFileSync(file, '{"orders":[1,2,3]}');
  const url = await run([file]);
  assert.match(url, /^http:\/\/127\.0\.0\.1:\d+\/[0-9a-f]{32}\/orders%201\.json$/, 'a loopback address with a random path');

  const pre = await fetch(url, { method: 'OPTIONS' });
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('access-control-allow-origin'), 'http://localhost:5173', 'CORS for the app only');
  assert.equal(pre.headers.get('access-control-allow-private-network'), 'true');

  const res = await fetch(url);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), '{"orders":[1,2,3]}');
  assert.equal((await fetch(url.replace(/[0-9a-f]{32}/, '0'.repeat(32)))).status, 404, 'another path is refused');
  assert.equal((await fetch(url, { method: 'POST' })).status, 405);

  const piped = await run([], '{"piped":true}');
  assert.match(piped, /\/stdin\.json$/);
  assert.equal(await (await fetch(piped)).text(), '{"piped":true}');

  await assert.rejects(run([join(dir, 'missing.json')]), e => e.code === 1 && /No such file/.test(e.message));
  console.log('ok');
} finally {
  procs.forEach(p => p.kill());
  rmSync(dir, { recursive: true, force: true });
}
