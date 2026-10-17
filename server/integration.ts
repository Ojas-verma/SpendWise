import { config } from './config.ts';
export class IntegrationError extends Error { constructor(message: string, public code = 'INTEGRATION_UNAVAILABLE', public uncertain = false) { super(message); } }
export async function workflow(body: object, webhookPath = config.webhookPath): Promise<Record<string, unknown>> {
  const readOnly = (body as { action?: string }).action === 'list';
  if (!config.secret) throw new IntegrationError('Connect the n8n workflow in Settings before adding expenses.', 'NOT_CONFIGURED');
  let response: Response;
  try {
    response = await fetch(`${config.n8n}/webhook/${webhookPath}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-SpendWise-Key': config.secret },
      body: JSON.stringify(body), signal: AbortSignal.timeout(readOnly ? 15000 : 150000)
    });
  } catch { throw new IntegrationError(readOnly ? 'The expense list could not be loaded from n8n. Check its MongoDB connection.' : 'The workflow did not return a response. Check n8n before retrying; a write may still be running.', 'NO_RESPONSE', !readOnly); }
  if (!response.ok) throw new IntegrationError(response.status === 404 ? 'The SpendWise workflow is not published in n8n yet.' : response.status === 401 || response.status === 403 ? 'The webhook authentication does not match. Check Header Auth in n8n.' : 'n8n returned an error. Check its execution log before retrying.', `HTTP_${response.status}`, ![401,403,404].includes(response.status));
  try {
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error();
    return result as Record<string, unknown>;
  } catch { throw new IntegrationError('n8n returned an unexpected response. Check the execution before retrying.', 'INVALID_RESPONSE', true); }
}
