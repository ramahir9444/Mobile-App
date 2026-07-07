const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://ramahir9444_db_user:RXWlVVxYNVWq8svj@ac-99bwgj9-shard-00-00.rd2apqe.mongodb.net:27017,ac-99bwgj9-shard-00-01.rd2apqe.mongodb.net:27017,ac-99bwgj9-shard-00-02.rd2apqe.mongodb.net:27017/?ssl=true&replicaSet=atlas-5403ys-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('oda_class');
    const students = await db.collection('students').find({}).toArray();
    console.log('All Students in DB:', JSON.stringify(students, null, 2));
    
    const orders = await db.collection('orders').find({}).toArray();
    console.log('All Orders in DB:', JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

run();
