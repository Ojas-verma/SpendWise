import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { extractionRequest, validateExtraction, localDate } from '../shared/domain.ts';
const today = localDate();
const messages = ['I spent ₹200 on transport today.', 'Spent ₹250 on lunch today.', 'Yesterday I paid ₹120 for an auto.', 'Add ₹500 for groceries on 12 October.', 'I bought something yesterday.'];
const results = [];
for (const [i,message] of messages.entries()) {
  const start=Date.now();
  const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'}/api/chat`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(extractionRequest(message,today,process.env.OLLAMA_MODEL || 'llama3.2:3b')), signal:AbortSignal.timeout(150000) });
  assert.equal(response.ok,true);
  const data = await response.json();
  const parsed=JSON.parse(data.message.content);
  const validation=validateExtraction(parsed,message,today,`parser-test-${i.toString().padStart(16,'0')}`);
  if (i===4) assert.match(validation.message || '',/How much/);
  else { assert.ok(validation.expense,JSON.stringify(validation)); assert.equal(validation.expense.cost,[200,250,120,500][i]); }
  results.push({message,raw:parsed,validation,durationMs:Date.now()-start});
  console.log(`${i+1}/5 ${validation.expense?'VALID':'CLARIFICATION'} ${Date.now()-start}ms`);
}
await mkdir('.local',{recursive:true});
await writeFile('.local/ollama-test-results.json',JSON.stringify({testedAt:new Date().toISOString(),today,model:process.env.OLLAMA_MODEL,results},null,2));
console.log('All five local-model extraction checks passed. No database writes were performed.');
