import 'dotenv/config';
import path from 'node:path';
export const config = {
  port: Number(process.env.PORT || 3000),
  n8n: process.env.N8N_BASE_URL || 'http://127.0.0.1:5679',
  webhookPath: process.env.N8N_WEBHOOK_PATH || 'spendwise-v1',
  secret: process.env.N8N_WEBHOOK_SECRET || '',
  ollama: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
  timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  dataDir: path.resolve('.local')
};
for (const value of [config.n8n, config.ollama]) {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(value).hostname)) throw new Error('Integration URLs must use localhost for this local prototype.');
}
