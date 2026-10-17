import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { mongoUri, database } from './mongo-config.mjs';
if (!process.env.N8N_WEBHOOK_SECRET || process.env.N8N_WEBHOOK_SECRET.length < 32) throw new Error('Generate a strong server-side webhook secret in .env first.');
mkdirSync('.local', { recursive: true });
writeFileSync('.local/credential-import.json', JSON.stringify([
  { id: 'spendwiseWebhookAuth', name: 'SpendWise Webhook', type: 'httpHeaderAuth', data: { name: 'X-SpendWise-Key', value: process.env.N8N_WEBHOOK_SECRET } },
  { id: 'spendwiseMongoDb', name: 'SpendWise MongoDB', type: 'mongoDb', data: { configurationType: 'connectionString', connectionString: mongoUri(true), database, tls: false } }
]), { mode: 0o600 });
console.log('Prepared private webhook and MongoDB credential import. Never commit it; remove after importing. Existing Google credentials are not changed.');
