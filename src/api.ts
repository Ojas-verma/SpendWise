import type { Budget, Expense, Result } from '../shared/domain';
export interface Health { n8n: boolean; ollama: boolean; mongodb: boolean; configured: boolean; model: string; timezone: string; n8nUrl: string; today: string }
export interface Records { expenses: Expense[]; invalidRows: number; source: string; today: string }
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', 'X-SpendWise-Client': '1', ...options?.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data as T;
}
export const api = {
  records: () => request<Records>('/api/expenses'),
  health: () => request<Health>('/api/health'),
  budgets: () => request<Budget[]>('/api/budgets'),
  saveBudgets: (budgets: Budget[]) => request<Budget[]>('/api/budgets', { method: 'PUT', body: JSON.stringify(budgets) }),
  add: (message: string, requestId: string) => request<Result>('/api/expenses', { method: 'POST', body: JSON.stringify({ message, requestId }) })
};
