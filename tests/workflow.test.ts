import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const workflow=JSON.parse(readFileSync('n8n/spendwise.workflow.json','utf8'));
const node=(name:string)=>workflow.nodes.find((n:{name:string})=>n.name===name);
test('real n8n read-error items cannot produce an empty success or reach insertion',()=>{
  const readCode=new Function('$input', node('List response').parameters.jsCode);
  assert.throws(()=>readCode({all:()=>[{json:{error:'Authentication failed'}}]}),/read failed/);
  const lookupCode=new Function('$input','$',node('Prepare document').parameters.jsCode);
  assert.throws(()=>lookupCode({all:()=>[{json:{error:'Authentication failed'}}]},()=>{throw new Error('Unexpected expense lookup');}),/transaction lookup failed/);
  const empty=readCode({all:()=>[{json:{}}]});
  assert.equal(empty[0].json.status,'ok');
  assert.equal(empty[0].json.expenses.length,0);
  assert.throws(()=>readCode({all:()=>[{json:{headers:{},body:{action:'list'}}}]}),/read failed/);
  assert.throws(()=>lookupCode({all:()=>[{json:{status:'validated',expense:{id:'example'}}}]},()=>{}),/transaction lookup failed/);
});
test('insert failures cannot confirm saving and successful insertion requires readback',()=>{
  assert.notEqual(node('Insert expense').alwaysOutputData,true);
  assert.equal(node('Insert expense').onError,'stopWorkflow');
  const destinations=workflow.connections['Insert expense'].main;
  assert.equal(destinations[0][0].node,'Verify stored expense');
  assert.equal(destinations[1],undefined);
  const confirm=new Function('$input','$',node('Save confirmed').parameters.jsCode);
  assert.throws(()=>confirm({all:()=>[{json:{}}]},()=>({first:()=>({json:{expense:{id:'missing-record-123456789'}}})})),/confirmation mismatch/);
  const proposed={id:'proposed-input-123456789',date:'2026-10-17',amount:200,currency:'INR',category:'Transport',description:'Auto',originalMessage:'Spent ₹200 on auto today.'};
  assert.throws(()=>confirm({all:()=>[{json:proposed}]},()=>({first:()=>({json:{expense:{id:proposed.id}}})})),/confirmation mismatch/);
  for(const name of ['Read expenses','Check transaction ID','Verify stored expense'])assert.equal(node(name).onError,'stopWorkflow');
});
