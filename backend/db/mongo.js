const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME   = process.env.DB_NAME || 'oda_class';

let client;
let db;

async function connectDB() {
  client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`✅ MongoDB connected → database: "${DB_NAME}"`);
  return db;
}

function getDB() {
  if (!db) throw new Error('Database not initialised — call connectDB() first');
  return db;
}

module.exports = { connectDB, getDB };
