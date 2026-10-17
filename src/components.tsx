import { ArrowDownLeft, ArrowUpRight, Check, ChevronRight, CircleAlert, LoaderCircle, Plus, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from './api';
import type { Expense } from '../shared/domain';
export const money = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: v % 1 ? 2 : 0 }).format(v);
export const shortDate = (v: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(v + 'T00:00:00Z'));
export function Empty({ title, children }: { title: string; children: React.ReactNode }) { return <div className="empty"><span className="empty-icon"><ArrowDownLeft size={24}/></span><h3>{title}</h3><p>{children}</p></div>; }
export function ExpenseRows({ expenses, onSelect }: { expenses: Expense[]; onSelect: (e: Expense) => void }) {
  return <div className="table-scroll"><table className="transactions-table"><thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th className="amount">Amount</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{expenses.map(e => <tr key={e.id}><td><button className="transaction-name" onClick={() => onSelect(e)}><span className={'category-icon cat-' + e.category.split(' ')[0].toLowerCase()}><ArrowUpRight size={18}/></span><span>{e.descr}<small>Expense · INR</small></span></button></td><td><span className="category-tag">{e.category}</span></td><td>{shortDate(e.date)}<small className="year">{e.date.slice(0,4)}</small></td><td className="amount">{money(e.cost)}</td><td><button className="icon-button" aria-label={`View ${e.descr}`} onClick={() => onSelect(e)}><ChevronRight size={16}/></button></td></tr>)}</tbody></table></div>;
}
type ChatItem = { role: 'user' | 'assistant'; text: string; expense?: Expense; kind?: 'saved' | 'error' | 'clarification' };
export function Composer({ onSaved, compact = false }: { onSaved: () => void; compact?: boolean }) {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState<ChatItem[]>([]);
  const request = useRef<{ message: string; id: string } | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (items.length) end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [items.length, pending]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!message.trim() || pending) return;
    const text = message.trim();
    if (request.current?.message !== text) request.current = { message: text, id: crypto.randomUUID() };
    setItems(old => [...old, { role: 'user', text }]); setPending(true);
    try {
      const result = await api.add(text, request.current.id);
      if (result.status === 'saved') {
        setItems(old => [...old, { role: 'assistant', kind: 'saved', text: 'Saved to MongoDB', expense: result.expense }]);
        setMessage(''); request.current = null; onSaved();
      } else { setItems(old => [...old, { role: 'assistant', kind: result.status, text: result.message }]); if (result.status === 'clarification') request.current = null; }
    } catch (error) { setItems(old => [...old, { role: 'assistant', kind: 'error', text: (error as Error).message }]); }
    finally { setPending(false); }
  }
  const suggestions = ['Spent ₹250 on lunch today.', 'Yesterday I paid ₹120 for an auto.', 'Add ₹500 for groceries on 12 October.'];
  return <div className={'composer ' + (compact ? 'compact' : '')}>
    {!compact && <div className="assistant-intro"><div className="assistant-orb"><Sparkles size={28}/></div><span className="eyebrow">YOUR EVERYDAY MONEY COMPANION</span><h2>Just say what you spent.</h2><p>A coffee, your commute, a grocery run.<br/>Turn everyday words into an organized expense record.</p></div>}
    {items.length > 0 && <div className="chat-log" role="log" aria-label="Expense conversation">{items.map((item,i) => <div key={i} className={'chat-message ' + item.role + ' ' + (item.kind || '')}>{item.role === 'assistant' && (item.kind === 'saved' ? <Check size={17}/> : <CircleAlert size={17}/>)}<div><p>{item.text}</p>{item.expense && <div className="receipt"><strong>{money(item.expense.cost)}</strong><span>{item.expense.descr}</span><small>{item.expense.category} · {shortDate(item.expense.date)}</small></div>}</div></div>)}{pending && <div className="chat-message assistant"><LoaderCircle className="spin" size={17}/><p>Interpreting your expense and waiting for a save receipt…</p></div>}<div ref={end}/></div>}
    <form onSubmit={submit} className="expense-input"><label htmlFor={compact ? 'quick-expense' : 'chat-expense'} className="sr-only">Describe your expense</label><Sparkles size={19}/><input id={compact ? 'quick-expense' : 'chat-expense'} value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. Spent ₹200 on transport today" maxLength={2000} disabled={pending}/><button className="send-button" disabled={pending || !message.trim()} aria-label="Save expense">{pending ? <LoaderCircle className="spin" size={18}/> : <Send size={18}/>}</button></form>
    <div className="suggestions">{suggestions.slice(0, compact ? 2 : 3).map(s => <button key={s} disabled={pending} onClick={() => setMessage(s)}><Plus size={12}/>{s}</button>)}</div><p className="privacy-note">Processed locally with Ollama. Confirmed only after MongoDB saves.</p>
  </div>;
}
export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d=ref.current!; d.showModal(); return () => d.close(); }, []);
  return <dialog ref={ref} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose(); }}><div className="dialog-inner"><div className="dialog-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20}/></button></div>{children}</div></dialog>;
}
