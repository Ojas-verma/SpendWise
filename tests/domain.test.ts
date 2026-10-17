import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate, resolveDate, validDate, amountsInMessage, validateExtraction, normalizeRows } from '../shared/domain.ts';
const today='2026-10-17';
const raw={cost:200,date:today,currency:'INR',category:'Transport',descr:'Transport'};
test('India date boundaries and relative dates are deterministic',()=>{
  assert.equal(localDate(new Date('2026-10-16T19:00:00Z')),today);
  assert.equal(resolveDate('paid ₹200 yesterday',today),'2026-10-16');
  assert.equal(resolveDate('day before yesterday ₹200',today),'2026-10-15');
  assert.equal(resolveDate('Add ₹500 for groceries on 12 October.',today),'2026-10-12');
  assert.equal(resolveDate('₹200 on 31 February',today),null);
  assert.equal(resolveDate('₹200 on 2026-02-30',today),null);
  assert.equal(resolveDate('₹200 last Friday',today),null);
  assert.equal(resolveDate('spent ₹200',today),today);
  assert.equal(validDate('2024-02-29'),true);
  assert.equal(validDate('2026-02-29'),false);
});
test('amount evidence excludes dates and supports rupee notation',()=>{
  assert.deepEqual(amountsInMessage('Spent 200 on transport today'),[200]);
  assert.deepEqual(amountsInMessage('Add ₹1,250.50 on 12 October'),[1250.5]);
  assert.deepEqual(amountsInMessage('Paid 120 rupees for auto'),[120]);
  assert.deepEqual(amountsInMessage('I bought something yesterday'),[]);
  assert.deepEqual(amountsInMessage('Add 500 for groceries on 12 October'),[500]);
});
test('valid expenses retain original input and resolve date outside the model',()=>{
  const msg='I spent ₹200 on transport yesterday.';
  const result=validateExtraction(raw,msg,today,'transaction-123456789');
  assert.equal(result.expense?.date,'2026-10-16');
  assert.equal(result.expense?.msg,msg);
});
test('missing or fabricated amounts, malformed data, currencies and dates cannot be saved',()=>{
  for (const [p,msg] of [[raw,'I bought something yesterday.'],[{...raw,cost:300},'Spent ₹200'],[{...raw,cost:'200'},'Spent ₹200'],[{...raw,cost:0},'Spent ₹0'],[raw,'Spent ₹-200'],[raw,'Spent $200'],[raw,'Spent ₹200 on 31 February'],[raw,'Spent ₹200 tomorrow'],[raw,'Spent ₹200 on 2027-01-01'],[raw,'Spent ₹200 and ₹300'],[null,'Spent ₹200'],[{...raw,descr:''},'Spent ₹200']] as const) assert.equal(validateExtraction(p,msg,today,'transaction-123456789').expense,undefined, msg);
});
test('stored records are normalized and malformed records are reported',()=>{
  const parsed=normalizeRows([{date:today,cost:'1,200',descr:'Rent',msg:'Paid rent'},{date:'2026-02-30',cost:200},{date:today,cost:'x'},{date:today,cost:20,currency:'USD'},{}]);
  assert.equal(parsed.expenses.length,1); assert.equal(parsed.expenses[0].cost,1200); assert.equal(parsed.expenses[0].category,'Other'); assert.equal(parsed.invalidRows,3);
});
test('MongoDB field names preserve the existing frontend contract',()=>{
  const result=normalizeRows([{id:'mongodb-1234567890',date:today,amount:200,currency:'INR',category:'Transport',description:'Auto',originalMessage:'Paid ₹200 for an auto today.'}]);
  assert.deepEqual(result.expenses[0],{id:'mongodb-1234567890',date:today,cost:200,currency:'INR',category:'Transport',descr:'Auto',msg:'Paid ₹200 for an auto today.'});
});
test('conflicting dates, questions, and uncertain or negated spending require clarification',()=>{
  assert.equal(resolveDate('Spent ₹200 today or yesterday',today),null);
  assert.equal(resolveDate('Spent ₹200 on 12 October or 13 October',today),null);
  for(const message of ['I did not spend ₹200 today.','Maybe I spent ₹200 today.','Did I spend ₹200 today?']) assert.equal(validateExtraction(raw,message,today,'transaction-123456789').expense,undefined);
});
