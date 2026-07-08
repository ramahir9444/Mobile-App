require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'oda_class';
const localDbPath = path.join(__dirname, 'db', 'local_db.json');

async function run() {
  console.log("Starting sync from local JSON fallback to MongoDB Atlas...");
  
  if (!fs.existsSync(localDbPath)) {
    console.log("❌ No local fallback database found at:", localDbPath);
    return;
  }

  let localData;
  try {
    localData = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
  } catch (e) {
    console.log("❌ Failed to parse local database file:", e.message);
    return;
  }

  const configs = localData.homepage_configs || [];
  if (configs.length === 0) {
    console.log("ℹ️ Local database has 0 homepage configurations. Nothing to sync.");
    return;
  }

  console.log(`Found ${configs.length} configurations locally. Connecting to Atlas...`);
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas successfully!");
    const db = client.db(DB_NAME);
    const collection = db.collection('homepage_configs');

    let updatedCount = 0;
    for (const config of configs) {
      // Remove mongo _id if it's a string to prevent cast errors
      const query = { classId: config.classId };
      const updateDoc = { ...config };
      delete updateDoc._id; 
      updateDoc.updatedAt = new Date();

      await collection.findOneAndUpdate(
        query,
        { $set: updateDoc },
        { upsert: true }
      );
      updatedCount++;
      console.log(`   Synced: ${config.classId}`);
    }

    console.log(`\n🎉 Success! Successfully synchronized ${updatedCount} configurations to MongoDB Atlas!`);
  } catch (err) {
    console.error("\n❌ Connection to MongoDB Atlas failed:", err.message);
    console.log("\n⚠️ Please ensure that your current IP address is whitelisted in your MongoDB Atlas Network Access console.");
    console.log("   Once whitelisted, run this command to sync: node sync-to-atlas.js");
  } finally {
    await client.close();
  }
}

run();
