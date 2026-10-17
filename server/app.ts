import express from 'express';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { categories, localDate, normalizeRows, validDate, type Budget, type Expense, type Result } from '../shared/domain.ts';
import { config } from './config.ts';
import { workflow, IntegrationError } from './integration.ts';
import { JsonStore } from './storage.ts';
type Entry = { fingerprint: string; state: 'pending' | 'saved'; expense?: Expense };
export function createApp(deps: { workflow: typeof workflow; dataDir: string; port?: number } = { workflow, dataDir: config.dataDir }) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store' });
    if (req.path.startsWith('/api')) {
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(req.hostname)) return void res.status(403).json({ message: 'Local access only.' });
      if (req.headers['sec-fetch-site'] === 'cross-site') return void res.status(403).json({ message: 'Cross-site requests are blocked.' });
      if (!['GET', 'HEAD'].includes(req.method) && (req.headers['x-spendwise-client'] !== '1' || !req.is('application/json'))) return void res.status(403).json({ message: 'Use the SpendWise application to make this request.' });
      if (req.headers.origin && ![`http://localhost:${deps.port ?? config.port}`, `http://127.0.0.1:${deps.port ?? config.port}`].includes(req.headers.origin)) return void res.status(403).json({ message: 'Origin is not allowed.' });
    }
    next();
  });
  app.use(express.json({ limit: '8kb' }));
  const budgets = new JsonStore<Budget[]>(path.join(deps.dataDir, 'budgets.json'), []);
  // Never replay old Google Sheets receipts as MongoDB saves.
  const journal = new JsonStore<Record<string, Entry>>(path.join(deps.dataDir, 'requests-mongodb.json'), {});
  let busy = false;
  async function records() {
    const result = await deps.workflow({ action: 'list' });
    if (result.status !== 'ok' || !Array.isArray(result.expenses)) throw new IntegrationError('MongoDB is not available. Check the database service and n8n connection.', 'DATABASE_UNAVAILABLE');
    const parsed = normalizeRows(result.expenses as Record<string, unknown>[]);
    return { ...parsed, invalidRows: parsed.invalidRows + Number(result.invalidRows || 0) };
  }
  app.get('/api/expenses', async (_req, res, next) => {
    try { res.json({ ...await records(), source: 'mongodb', today: localDate(new Date(), config.timezone) }); } catch (e) { next(e); }
  });
  app.post('/api/expenses', async (req, res, next) => {
    const { message, requestId } = req.body || {};
    if (typeof message !== 'string' || !message.trim() || message.length > 2000 || typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) return void res.status(400).json({ status: 'error', message: 'Provide an expense message and a valid request ID.' });
    if (busy) return void res.status(429).json({ status: 'error', message: 'Another expense is being processed. Please wait.' });
    busy = true;
    const fingerprint = createHash('sha256').update(message.trim()).digest('hex');
    try {
      const log = await journal.read();
      const entry = log[requestId];
      if (entry && entry.fingerprint !== fingerprint) return void res.status(409).json({ status: 'error', message: 'This request ID belongs to a different message.' });
      if (entry) {
        const found = (await records()).expenses.find(e => e.id === requestId);
        if (found && found.msg === message.trim()) { log[requestId] = { fingerprint, state: 'saved', expense: found }; await journal.write(log); return void res.json({ status: 'saved', expense: found, replayed: true }); }
        return void res.status(409).json({ status: 'error', code: 'WRITE_UNCERTAIN', message: 'A previous attempt could not be confirmed in MongoDB. Check the database and n8n execution before submitting again. No second write was sent.' });
      }
      log[requestId] = { fingerprint, state: 'pending' };
      await journal.write(log);
      let result: Record<string, unknown>;
      try { result = await deps.workflow({ action: 'create', message: message.trim(), requestId, today: localDate(new Date(), config.timezone), timezone: config.timezone }); }
      catch (e) { if (e instanceof IntegrationError && !e.uncertain) { delete log[requestId]; await journal.write(log); } throw e; }
      if (result.status === 'saved') {
        const p = result.expense as Expense;
        if (!p || p.id !== requestId || !validDate(p.date) || typeof p.cost !== 'number' || !Number.isFinite(p.cost) || p.cost <= 0 || p.currency !== 'INR' || !categories.includes(p.category) || p.msg !== message.trim()) throw new IntegrationError('The saved response could not be verified. Check MongoDB before retrying.', 'INVALID_RECEIPT', true);
        log[requestId] = { fingerprint, state: 'saved', expense: p }; await journal.write(log);
        res.json({ status: 'saved', expense: p } satisfies Result);
      } else if (result.status === 'clarification') {
        delete log[requestId]; await journal.write(log);
        res.json({ status: 'clarification', message: String(result.message || 'Please clarify the expense.') });
      } else if (result.status === 'error' && ['PARSE_FAILED','DB_LOOKUP_FAILED'].includes(String(result.code))) {
        delete log[requestId]; await journal.write(log);
        res.status(502).json({ status: 'error', code: result.code, message: String(result.message) });
      } else throw new IntegrationError('Saving could not be confirmed. Check MongoDB and the n8n execution before retrying.', 'WRITE_UNCERTAIN', true);
    } catch (e) { next(e); } finally { busy = false; }
  });
  app.get('/api/budgets', async (_req, res, next) => { try { res.json(await budgets.read()); } catch (e) { next(e); } });
  app.put('/api/budgets', async (req, res, next) => {
    const value: unknown = req.body;
    if (!Array.isArray(value) || value.length > 200 || value.some(b => !b || !categories.includes(b.category) || typeof b.amount !== 'number' || !Number.isFinite(b.amount) || b.amount <= 0 || b.amount > 10000000 || !/^\d{4}-(0[1-9]|1[0-2])$/.test(b.month)) || new Set(value.map(b => `${b.month}:${b.category}`)).size !== value.length) return void res.status(400).json({ message: 'Use one positive budget per category and month.' });
    try { await budgets.write(value); res.json(value); } catch (e) { next(e); }
  });
  app.get('/api/health', async (_req, res) => {
    const checks = await Promise.allSettled([
      fetch(config.n8n + '/healthz', { signal: AbortSignal.timeout(4000) }).then(r => r.ok),
      fetch(config.ollama + '/api/tags', { signal: AbortSignal.timeout(4000) }).then(r => r.json()).then(j => j.models?.some((m: { name: string }) => m.name === config.model)),
      records().then(() => true)
    ]);
    const ok = (i: number) => checks[i].status === 'fulfilled' && checks[i].value === true;
    res.json({ n8n: ok(0), ollama: ok(1), mongodb: ok(2), configured: Boolean(config.secret), model: config.model, timezone: config.timezone, n8nUrl: config.n8n.replace('127.0.0.1', 'localhost'), today: localDate(new Date(), config.timezone) });
  });
  app.use('/api', (_req, res) => { res.status(404).json({ message: 'API route not found.' }); });
  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof IntegrationError) res.status(503).json({ status: 'error', message: error.message, code: error.code });
    else if (error instanceof SyntaxError || 'type' in error && error.type === 'entity.too.large') res.status(400).json({ status: 'error', message: 'The request body is invalid or too large.' });
    else { console.error('Request failed:', error.name); res.status(500).json({ status: 'error', message: 'The request could not be completed. Check the local server.' }); }
  });
  return app;
}
