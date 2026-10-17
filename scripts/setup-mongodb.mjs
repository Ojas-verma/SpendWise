import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
let source=readFileSync(existsSync('.env')?'.env':'.env.example','utf8');
const values={MONGO_HOST_PORT:'27018',MONGO_DATABASE:'spendwise',MONGO_INITDB_ROOT_USERNAME:'spendwise_admin',MONGO_INITDB_ROOT_PASSWORD:randomBytes(32).toString('hex'),MONGO_APP_USERNAME:'spendwise_app',MONGO_APP_PASSWORD:randomBytes(32).toString('hex')};
for(const [key,value] of Object.entries(values)) {
  const pattern=new RegExp('^'+key+'=(.*)$','m');
  const match=source.match(pattern);
  if(match?.[1].trim()) continue;
  source=match?source.replace(pattern,key+'='+value):source.trimEnd()+'\n'+key+'='+value+'\n';
}
writeFileSync('.env',source,{mode:0o600});
console.log('MongoDB settings prepared in private .env. Existing nonempty values were preserved.');
