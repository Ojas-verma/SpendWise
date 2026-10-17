import express from 'express';
import path from 'node:path';
import { createApp } from './app.ts';
import { config } from './config.ts';
const app = createApp();
const production = process.argv.includes('--production');
if (production) {
  app.use(express.static(path.resolve('dist')));
  app.use((_req, res) => { res.sendFile(path.resolve('dist/index.html')); });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true, hmr: { host: 'localhost' } }, appType: 'spa' });
  app.use(vite.middlewares);
}
app.listen(config.port, '127.0.0.1', () => console.log(`SpendWise AI is running at http://localhost:${config.port}`));
