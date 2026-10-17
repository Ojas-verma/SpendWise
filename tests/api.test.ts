import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.ts';
import { IntegrationError } from '../server/integration.ts';
import { localDate } from '../shared/domain.ts';
async function harness(fn:(body:object)=>Promise<Record<string,unknown>>) {
  const dir=await mkdtemp(path.join(tmpdir(),'spendwise-test-'));
  const server=createApp({workflow:fn,dataDir:dir}).listen(0,'127.0.0.1');
  await new Promise<void>(resolve=>server.once('listening',resolve));
  const addr=server.address(); if (!addr || typeof addr==='string') throw new Error('No test port');
  return { url:`http://127.0.0.1:${addr.port}`, close:async()=>{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve())); await rm(dir,{recursive:true,force:true});} };
}
const headers={'Content-Type':'application/json','X-SpendWise-Client':'1'};
const id='11111111-2222-4333-8444-555555555555';
const message='Spent ₹200 on transport today.';
const expense={id,date:localDate(),cost:200,currency:'INR',category:'Transport',descr:'Transport',msg:message};
test('success is tied to a save receipt; replay does not cause a second write',async()=>{
  let writes=0;
  const h=await harness(async body=>{if((body as {action:string}).action==='list')return{status:'ok',expenses:[expense]};writes++;return {status:'saved',expense};});
  try { for(let i=0;i<2;i++){const r=await fetch(h.url+'/api/expenses',{method:'POST',headers,body:JSON.stringify({message,requestId:id})});assert.equal(r.status,200);assert.equal((await r.json()).status,'saved');}assert.equal(writes,1); const r=await fetch(h.url+'/api/expenses',{method:'POST',headers,body:JSON.stringify({message:'another expense',requestId:id})});assert.equal(r.status,409); } finally {await h.close();}
});
test('a timeout remains uncertain and cannot silently retry a write',async()=>{
  let writes=0;
  const h=await harness(async body=>{if((body as {action:string}).action==='list')return{status:'ok',expenses:[]};writes++;throw new IntegrationError('Timed out','NO_RESPONSE',true);});
  try{const init={method:'POST',headers,body:JSON.stringify({message,requestId:id})};assert.equal((await fetch(h.url+'/api/expenses',init)).status,503);const retry=await fetch(h.url+'/api/expenses',init);assert.equal(retry.status,409);assert.equal((await retry.json()).code,'WRITE_UNCERTAIN');assert.equal(writes,1);}finally{await h.close();}
});
test('uncertain write reconciles from the actual database read before confirming',async()=>{
  let writes=0;
  const h=await harness(async body=>{if((body as {action:string}).action==='list')return{status:'ok',expenses:[expense]};writes++;throw new IntegrationError('Timed out','NO_RESPONSE',true);});
  try{const init={method:'POST',headers,body:JSON.stringify({message,requestId:id})};await fetch(h.url+'/api/expenses',init);const retry=await fetch(h.url+'/api/expenses',init);assert.equal((await retry.json()).status,'saved');assert.equal(writes,1);}finally{await h.close();}
});
test('cross-site writes and invalid budget values are rejected',async()=>{
  const h=await harness(async()=>({status:'ok',expenses:[]}));
  try{assert.equal((await fetch(h.url+'/api/budgets',{method:'PUT',headers:{...headers,Origin:'https://example.com'},body:'[]'})).status,403);assert.equal((await fetch(h.url+'/api/budgets',{method:'PUT',headers,body:JSON.stringify([{category:'Transport',amount:-1,month:'2026-10'}])})).status,400);const values=[{category:'Transport',amount:2000,month:'2026-10'}];assert.equal((await fetch(h.url+'/api/budgets',{method:'PUT',headers,body:JSON.stringify(values)})).status,200);assert.deepEqual(await(await fetch(h.url+'/api/budgets')).json(),values);}finally{await h.close();}
});
test('failed database operations never become success responses',async()=>{
  const h=await harness(async()=>({status:'error',code:'DB_WRITE_UNCONFIRMED'}));
  try{const r=await fetch(h.url+'/api/expenses',{method:'POST',headers,body:JSON.stringify({message,requestId:id})});assert.equal(r.status,503);assert.equal((await r.json()).status,'error');}finally{await h.close();}
});
test('a cached receipt cannot claim success when the database is unavailable',async()=>{
  let calls=0;
  const h=await harness(async()=>{if(++calls===1)return{status:'saved',expense};throw new IntegrationError('Database unavailable');});
  try {const init={method:'POST',headers,body:JSON.stringify({message,requestId:id})};assert.equal((await fetch(h.url+'/api/expenses',init)).status,200);assert.equal((await fetch(h.url+'/api/expenses',init)).status,503);} finally {await h.close();}
});
