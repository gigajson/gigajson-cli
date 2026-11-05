#!/usr/bin/env node
// `npx gigajson file.json`: opens a local file in GigaJSON (gigajson.com/app/) without uploading it anywhere.
// The file is served on 127.0.0.1 under a random path; the app fetches it from there (its "From URL" path,
// ?open= in apps/web/src/main.tsx) and keeps it in the browser's storage. No dependencies.
import { createServer } from 'node:http';
import { createReadStream, statSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { Readable, pipeline } from 'node:stream';

const APP = process.env.GIGAJSON_APP || 'https://gigajson.com/app/';
const IDLE_MS = 5 * 60_000;   // nobody fetched the file: give up
const GRACE_MS = 60_000;      // after a transfer: time for a retry (Repair in the app fetches again)

const args = process.argv.slice(2);
const flag = (...names) => names.some(n => args.includes(n));
const files = args.filter(a => !a.startsWith('-'));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

if (flag('-v', '--version')) { console.log(pkg.version); process.exit(0); }
if (flag('-h', '--help') || (!files.length && process.stdin.isTTY)) {
  console.log(`Usage: gigajson <file>          open a file in GigaJSON
       <command> | gigajson      open what another command prints
Options: --no-open (print the link instead of opening a browser), --version, --help

Opens JSON, JSON Lines, CSV, YAML or XML, up to 1 GB, in your browser. The file goes
from this computer to your browser through 127.0.0.1 and is never uploaded.`);
  process.exit(flag('-h', '--help') ? 0 : 1);
}
if (files.length > 1) fail('One file at a time.');

let name, size, body;   // body: stdin's chunks (kept as they came: joining them would double the memory), else the file is streamed from disk
if (files.length) {
  const st = (() => { try { return statSync(files[0]); } catch { return null; } })();
  if (!st) fail(`No such file: ${files[0]}`);
  if (!st.isFile()) fail(`Not a file: ${files[0]}`);
  name = basename(files[0]); size = st.size;
} else {
  const parts = []; for await (const c of process.stdin) parts.push(c);
  body = parts; name = 'stdin.json'; size = parts.reduce((n, c) => n + c.length, 0);
  if (!size) fail('Nothing came in on stdin.');
}

const origin = new URL(APP).origin;
const path = `/${randomBytes(16).toString('hex')}/${encodeURIComponent(name)}`;
const cors = { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' };
let timer, sent = false;
const quitIn = (ms, msg) => { clearTimeout(timer); timer = setTimeout(() => { if (msg) console.log(msg); process.exit(0); }, ms); };

const server = createServer((req, res) => {
  if (new URL(req.url, 'http://x').pathname !== path) { res.writeHead(404).end(); return; }
  // Chrome asks before a public site reaches this computer (Private Network Access preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { ...cors, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Private-Network': 'true', 'Access-Control-Max-Age': '60' }).end();
    return;
  }
  if (req.method !== 'GET') { res.writeHead(405).end(); return; }
  clearTimeout(timer);
  res.writeHead(200, { ...cors, 'Content-Type': 'application/octet-stream', 'Content-Length': size, 'Cache-Control': 'no-store' });
  res.on('finish', () => {
    if (!sent) console.log(`Sent ${name} (${mb(size)}) to the browser. Press Ctrl+C to stop, or wait a minute.`);
    sent = true; quitIn(GRACE_MS);
  });
  res.on('close', () => { if (!res.writableFinished) quitIn(GRACE_MS); });
  // pipeline closes the file when the browser goes away mid-transfer (.pipe() left it open)
  pipeline(body ? Readable.from(body, { objectMode: false }) : createReadStream(files[0]), res, () => {});
});

server.listen(0, '127.0.0.1', () => {
  const link = `${APP}?open=${encodeURIComponent(`http://127.0.0.1:${server.address().port}${path}`)}`;
  console.log(`Opening ${name} (${mb(size)}) in GigaJSON:\n  ${link}`);
  console.log('If the browser asks to allow access to devices on your local network, allow it: that is this command.');
  if (!flag('--no-open')) openBrowser(link);
  quitIn(IDLE_MS, 'Nothing fetched the file in 5 minutes; stopped.');
});

function openBrowser(url) {
  const [cmd, argv] = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try { spawn(cmd, argv, { stdio: 'ignore', detached: true }).on('error', () => console.log('Open the link above in your browser.')).unref(); }
  catch { console.log('Open the link above in your browser.'); }
}
function mb(n) { return n < 1 << 20 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / (1 << 20)).toFixed(n < 10 << 20 ? 1 : 0)} MB`; }
function fail(msg) { console.error(msg); process.exit(1); }
