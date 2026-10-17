import { Bot, Database, ExternalLink, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import type { Health } from './api';

export function Settings({health,loading,onRefresh}:{health:Health|null;loading:boolean;onRefresh:()=>void}) {
  const items=[
    {name:'n8n',detail:'Your local automation workspace',icon:Bot,ok:health?.n8n},
    {name:'Ollama',detail:health?.model||'Local AI extraction',icon:Sparkles,ok:health?.ollama},
    {name:'MongoDB',detail:'Your persistent expense database',icon:Database,ok:health?.mongodb}
  ];
  return <>
    <section className="panel">
      <div className="panel-heading"><div><h2>Your connections</h2><p>Live checks. Your database passwords stay outside the browser.</p></div><button className="button secondary" onClick={onRefresh} disabled={loading}><RefreshCw size={15} className={loading?'spin':''}/>Check again</button></div>
      <div className="integration-grid">{items.map(({name,detail,icon:Icon,ok})=><article className="integration-card" key={name}>
        <span className="integration-icon"><Icon size={25}/></span><span className={'status-pill '+(ok?'connected':'')}>{loading?'Checking…':ok?'Connected':'Needs attention'}</span><h3>{name}</h3><p>{detail}</p>
        <small>{name==='MongoDB'?'Checked by reading the real database through n8n.':name==='Ollama'?'The installed model is checked on your computer.':'The local automation service is checked.'}</small>
      </article>)}</div>
    </section>
    <div className="settings-layout">
      <section className="panel setup-guide"><span className="eyebrow">LOCAL AI. LASTING RECORDS.</span><h2>Your everyday expenses, connected.</h2><ol>
        <li><strong>Start your local workspace</strong><p>Docker Desktop runs n8n and MongoDB. Start SpendWise with the project’s start.ps1 script. Your saved records persist across restarts.</p></li>
        <li><strong>Check the three connections</strong><p>n8n handles the workflow, Ollama understands your message, and MongoDB stores the validated expense. Use Check again after restarting a service.</p><a className="text-link" href={health?.n8nUrl||'http://localhost:5679'} target="_blank" rel="noreferrer">Open local n8n <ExternalLink size={13}/></a></li>
        <li><strong>Add an expense naturally</strong><p>Include an amount and what it was for. If you omit the date, today in India is used. Unclear or missing details prompt a clarification.</p></li>
        <li><strong>Look for a confirmed receipt</strong><p>The app confirms a save only after MongoDB stores the record and the workflow reads it back. Refresh the dashboard to retrieve your real transaction history.</p></li>
      </ol></section>
      <aside className="panel setup-facts"><ShieldCheck size={28}/><h2>Private by design.</h2><p>Your app, automation service, and database run locally. Your existing Ollama model processes expense text on this computer.</p><dl>
        <div><dt>Currency</dt><dd>Indian rupee · INR</dd></div><div><dt>Time zone</dt><dd>{health?.timezone||'Asia/Kolkata'}</dd></div>
        <div><dt>Expense storage</dt><dd>MongoDB · Persistent Docker volume</dd></div><div><dt>Budget storage</dt><dd>Local server file</dd></div>
        <div><dt>Save protection</dt><dd>Unique transaction ID and database readback</dd></div>
      </dl><p className="form-footnote">Google sign-in is no longer required. Existing Sheets data and credentials have been preserved; new expenses use MongoDB.</p></aside>
    </div>
  </>;
}
