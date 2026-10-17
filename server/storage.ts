import fs from 'node:fs/promises';
import path from 'node:path';
export class JsonStore<T> {
  constructor(private filename: string, private initial: T) {}
  async read(): Promise<T> {
    try { return JSON.parse(await fs.readFile(this.filename, 'utf8')) as T; }
    catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return structuredClone(this.initial); throw e; }
  }
  async write(value: T) {
    await fs.mkdir(path.dirname(this.filename), { recursive: true });
    const tmp = this.filename + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(value, null, 2), { mode: 0o600 });
    await fs.rename(tmp, this.filename);
  }
}
