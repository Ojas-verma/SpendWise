import 'dotenv/config';
import assert from 'node:assert/strict';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { MongoClient, ObjectId } from 'mongodb';
import { createApp } from '../server/app.ts';
import { workflow } from '../server/integration.ts';
import { localDate, type Expense } from '../shared/domain.ts';
import { mongoUri, database } from './mongo-config.mjs';
const serve=process.argv.includes('--serve');
const port=serve?3001:0;
const client=new MongoClient(mongoUri(),{serverSelectionTimeoutMS:5000});
await client.connect();
const db=client.db(database);
const collection=db.collection('expense_integration_tests');
const ownedIds=new Set<string>();
const evidence:Record<string,unknown>={testedAt:new Date().toISOString(),database,collection:'expense_integration_tests',productionCollectionUntouched:true};
const dir=await mkdtemp(path.resolve('.local/mongo-e2e-'));
let databaseStopped=false;
async function liveWorkflow(body:object):Promise<Record<string,unknown>> {
  const result=await workflow(body,'spendwise-e2e');
  if(result.status==='saved') ownedIds.add((result.expense as Expense).id);
  return result;
}
const app=createApp({workflow:liveWorkflow,dataDir:dir,port:port||3000});
app.use('/assets',express.static(path.resolve('dist/assets')));
app.get('/',async(_req,res)=>{
  const html=await readFile('dist/index.html','utf8');
  res.type('html').send(html.replace('<body>','<body><div style="position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#44311a;color:white;text-align:center;padding:9px;font:13px sans-serif">INTEGRATION TEST WORKSPACE · Real isolated MongoDB collection · Test expenses are cleaned up on exit</div>'));
});
app.post('/__integration/finish',(req,res)=>{
  if(req.headers['x-spendwise-client']!=='1')return void res.sendStatus(403);
  res.json({status:'cleaning'});
  void cleanup().then(()=>process.exit(0));
});
const server=app.listen(port,'127.0.0.1');
await new Promise<void>(r=>server.once('listening',r));
const address=server.address();if(!address||typeof address==='string')throw new Error('No test address');
const url=`http://127.0.0.1:${address.port}`;
const headers={'Content-Type':'application/json','X-SpendWise-Client':'1'};
const post=async(message:string,requestId=randomUUID())=>{
  const r=await fetch(url+'/api/expenses',{method:'POST',headers,body:JSON.stringify({message,requestId})});
  return {http:r.status,...await r.json()};
};
async function cleanup() {
  await new Promise<void>(r=>server.close(()=>r()));
  if(databaseStopped)execFileSync('docker',['start','spendwise-mongodb'],{stdio:'ignore'});
  await collection.deleteMany({id:{$in:[...ownedIds]}});
  await client.close();
  await rm(dir,{recursive:true,force:true});
}
try {
  const messages=['I spent ₹200 on transport today.','Spent ₹250 on lunch today.','Yesterday I paid ₹120 for an auto.','Add ₹500 for groceries on 12 October.'];
  const results=[];
  for(const [i,message] of messages.entries()){
    const result=await post(message);assert.equal(result.http,200);assert.equal(result.status,'saved',JSON.stringify(result));
    assert.equal(result.expense.cost,[200,250,120,500][i]);
    const stored=await collection.findOne({id:result.expense.id});assert.ok(stored);assert.equal(stored.amount,result.expense.cost);assert.equal(stored.originalMessage,message);assert.equal(stored.description,result.expense.descr);assert.equal(stored.currency,'INR');
    assert.equal(stored.date,result.expense.date);assert.equal(stored.cost,undefined);assert.equal(stored.msg,undefined);
    results.push(result);console.log(`Full flow ${i+1}/4: actual MongoDB document confirmed`);
  }
  const repeat=await post(messages[0],results[0].expense.id);assert.equal(repeat.status,'saved');assert.equal(repeat.replayed,true);assert.equal(await collection.countDocuments({id:results[0].expense.id}),1);
  const conflict=await post('Spent ₹300 on groceries today.',results[0].expense.id);assert.equal(conflict.http,409);
  const list=await(await fetch(url+'/api/expenses')).json();assert.equal(list.source,'mongodb');
  const ownExpenses=(list.expenses as Expense[]).filter(e=>ownedIds.has(e.id));assert.equal(ownExpenses.length,4);assert.equal(ownExpenses.reduce((s,e)=>s+e.cost,0),1070);
  for(const message of ['I bought something yesterday.','Spent $200 today.','Spent ₹200 today or yesterday.']){const r=await post(message);assert.equal(r.status,'clarification',JSON.stringify(r));}
  const first=await collection.findOne({id:results[0].expense.id});
  await assert.rejects(collection.insertOne({...first!,_id:new ObjectId()}),e=>(e as {code:number}).code===11000);
  await assert.rejects(collection.insertOne({...first!,_id:new ObjectId(),id:randomUUID(),amount:-10}),e=>(e as {code:number}).code===121);
  evidence.expenses=results.map(r=>r.expense);evidence.total=1070;evidence.replayAndConflictPassed=true;evidence.databaseUniqueIndexPassed=true;evidence.databaseSchemaPassed=true;evidence.clarificationsPassed=true;
  // Exercise a real outage of only the newly added database, and restore it.
  execFileSync('docker',['stop','spendwise-mongodb'],{stdio:'ignore'});databaseStopped=true;
  const failed=await post('Spent ₹40 on coffee today.');assert.notEqual(failed.status,'saved');assert.ok(failed.http>=400);
  const failedRead=await fetch(url+'/api/expenses');assert.equal(failedRead.status,503);
  execFileSync('docker',['start','spendwise-mongodb'],{stdio:'ignore'});databaseStopped=false;
  await client.close();await client.connect();
  assert.equal(await collection.countDocuments({id:{$in:[...ownedIds]}}),4);
  assert.equal(await db.collection('expenses').countDocuments({id:{$in:[...ownedIds]}}),0);
  evidence.outageNeverConfirmedSave=true;evidence.persistenceAcrossRestartPassed=true;
  evidence.testedDate=localDate();
  await writeFile('.local/mongodb-e2e-results.json',JSON.stringify(evidence,null,2));
  console.log('PASS: full writes/readback, history/total 1070, duplicate replay, ID conflict, clarification, unique index, DB schema, outage failure, restart persistence.');
  if(serve){
    console.log(`Isolated real-database browser workspace: http://localhost:${address.port}`);
    console.log(`Finish and clean: POST http://localhost:${address.port}/__integration/finish with header X-SpendWise-Client: 1`);
    process.on('SIGINT',()=>{void cleanup().then(()=>process.exit(0));});
    process.on('SIGTERM',()=>{void cleanup().then(()=>process.exit(0));});
  }else await cleanup();
}catch(error){await cleanup();throw error;}
