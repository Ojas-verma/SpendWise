// Runs once on an empty MongoDB volume. Credentials come from Docker environment.
const database = process.env.MONGO_DATABASE || 'spendwise';
const appDb = db.getSiblingDB(database);
appDb.createUser({ user: process.env.MONGO_APP_USERNAME, pwd: process.env.MONGO_APP_PASSWORD, roles: [{ role: 'readWrite', db: database }] });
const schema = {
  bsonType: 'object',
  required: ['id','amount','currency','category','description','date','originalMessage','createdAt'],
  additionalProperties: false,
  properties: {
    _id: { bsonType: 'objectId' },
    id: { bsonType: 'string', pattern: '^[a-zA-Z0-9-]{16,80}$' },
    amount: { bsonType: ['double','int','long','decimal'], minimum: 0.01, maximum: 10000000 },
    currency: { enum: ['INR'] },
    category: { enum: ['Food & drinks','Transport','Groceries','Shopping','Bills & utilities','Health','Entertainment','Other'] },
    description: { bsonType: 'string', minLength: 1, maxLength: 160 },
    date: { bsonType: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    originalMessage: { bsonType: 'string', minLength: 1, maxLength: 2000 },
    createdAt: { bsonType: 'string' }
  }
};
for (const name of ['expenses','expense_integration_tests']) {
  appDb.createCollection(name, { validator: { $jsonSchema: schema }, validationLevel: 'strict', validationAction: 'error' });
  appDb.getCollection(name).createIndex({ id: 1 }, { unique: true, name: 'unique_request_id' });
  appDb.getCollection(name).createIndex({ date: -1, category: 1 }, { name: 'date_category' });
}
