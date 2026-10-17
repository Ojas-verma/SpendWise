import 'dotenv/config';
export const database=process.env.MONGO_DATABASE || 'spendwise';
export function mongoUri(container=false) {
  const user=process.env.MONGO_APP_USERNAME;
  const password=process.env.MONGO_APP_PASSWORD;
  if(!user || !password) throw new Error('Run npm run setup:mongodb first.');
  const host=container?'mongodb:27017':`127.0.0.1:${process.env.MONGO_HOST_PORT||27018}`;
  return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${encodeURIComponent(database)}?authSource=${encodeURIComponent(database)}&w=majority&journal=true&serverSelectionTimeoutMS=5000`;
}
