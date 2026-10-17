import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { localDate } from '../shared/domain.ts';
const base=process.env.N8N_BASE_URL || 'http://127.0.0.1:5679';
const url=`${base}/webhook/${process.env.N8N_WEBHOOK_PATH || 'spendwise-v1'}`;
const messages=['I spent ₹200 on transport today.','Spent ₹250 on lunch today.','Yesterday I paid ₹120 for an auto.','Add ₹500 for groceries on 12 October.','I bought something yesterday.'];
const unauthorized=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'list'})});
assert.equal(unauthorized.status,403,'Webhook must reject unauthenticated requests');
const results=[];
for (const [i,message] of messages.entries()) {
  const start=Date.now();
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-SpendWise-Key':process.env.N8N_WEBHOOK_SECRET!},body:JSON.stringify({action:'parse',message,requestId:randomUUID(),today:localDate()}),signal:AbortSignal.timeout(150000)});
  const result=await r.json();
  assert.equal(r.status,200);
  assert.equal(result.status,i===4?'clarification':'parsed',JSON.stringify(result));
  if(i<4) {assert.equal(result.expense.cost,[200,250,120,500][i]); assert.equal(result.expense.msg,message);}
  else assert.match(result.message,/How much/);
  results.push({message,result,durationMs:Date.now()-start});
  console.log(`n8n ${i+1}/5 ${result.status.toUpperCase()} ${Date.now()-start}ms`);
}
await mkdir('.local',{recursive:true});
await writeFile('.local/n8n-test-results.json',JSON.stringify({testedAt:new Date().toISOString(),unauthenticatedStatus:unauthorized.status,results},null,2));
console.log('Actual n8n → Ollama → validation tests passed. Parse-only branch performs no database operations.');
