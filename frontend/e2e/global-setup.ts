import { spawn, type ChildProcess } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const PID_FILE = path.join(__dirname, 'fixtures', '.stub-backend.pid');

// Starts the stub API before the suite and waits until it answers. Fails fast
// when :3000 is already taken (a local backend running, for example).
export default async function globalSetup(): Promise<void> {
  const child: ChildProcess = spawn('node', [path.join(__dirname, 'fixtures', 'stub-backend.mjs')], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  if (child.pid) await writeFile(PID_FILE, String(child.pid), 'utf8');

  const deadline = Date.now() + 15_000;
  for (;;) {
    try {
      const response = await fetch('http://127.0.0.1:3000/api/companies');
      if (response.ok) return;
    } catch {
      // Not up yet — keep polling until the deadline.
    }
    if (Date.now() > deadline) throw new Error('stub-backend did not answer on :3000 within 15s');
    if (child.exitCode !== null && child.exitCode !== 0) {
      throw new Error('stub-backend exited early — is :3000 already in use?');
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
