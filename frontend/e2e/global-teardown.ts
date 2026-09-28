import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';

const PID_FILE = path.join(__dirname, 'fixtures', '.stub-backend.pid');

export default async function globalTeardown(): Promise<void> {
  try {
    const pid = Number(await readFile(PID_FILE, 'utf8'));
    if (pid) process.kill(pid, 'SIGTERM');
  } catch {
    // The stub already exited or was never started — nothing to stop.
  }
  await rm(PID_FILE, { force: true });
}
