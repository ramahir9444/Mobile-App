const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME   = process.env.DB_NAME || 'oda_class';

let client;
let db;
let useLocalFallback = false;
const fallbackFilePath = path.join(__dirname, 'local_db.json');

// Ensure fallback file exists or initialize it
if (!fs.existsSync(fallbackFilePath)) {
  fs.writeFileSync(fallbackFilePath, JSON.stringify({ homepage_configs: [] }, null, 2), 'utf8');
}

class MockCollection {
  constructor(name, filePath) {
    this.name = name;
    this.filePath = filePath;
  }

  _read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return {};
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading mock DB:', e);
      return {};
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing mock DB:', e);
    }
  }

  async findOne(query) {
    const data = this._read();
    const list = data[this.name] || [];
    return list.find(item => {
      for (let k in query) {
        if (item[k] !== query[k]) return false;
      }
      return true;
    }) || null;
  }

  async find(query = {}) {
    const data = this._read();
    const list = data[this.name] || [];
    const results = list.filter(item => {
      for (let k in query) {
        if (item[k] !== query[k]) return false;
      }
      return true;
    });
    return {
      toArray: async () => results
    };
  }

  async findOneAndUpdate(query, update, options = {}) {
    const data = this._read();
    if (!data[this.name]) data[this.name] = [];
    const list = data[this.name];
    
    let index = list.findIndex(item => {
      for (let k in query) {
        if (item[k] !== query[k]) return false;
      }
      return true;
    });

    let doc;
    if (index !== -1) {
      doc = list[index];
    } else {
      if (options.upsert) {
        doc = { ...query };
        list.push(doc);
        index = list.length - 1;
      } else {
        return null;
      }
    }

    if (update.$set) {
      Object.assign(doc, update.$set);
    } else {
      Object.assign(doc, update);
    }
    
    doc.updatedAt = new Date().toISOString();
    this._write(data);
    return doc;
  }

  async deleteMany(query) {
    const data = this._read();
    const list = data[this.name] || [];
    data[this.name] = list.filter(item => {
      for (let k in query) {
        if (item[k] !== query[k]) return true; // keep
      }
      return false; // delete
    });
    this._write(data);
    return { deletedCount: list.length - data[this.name].length };
  }

  async insertMany(docs) {
    const data = this._read();
    if (!data[this.name]) data[this.name] = [];
    data[this.name].push(...docs);
    this._write(data);
    return { insertedCount: docs.length };
  }

  async insertOne(doc) {
    const data = this._read();
    if (!data[this.name]) data[this.name] = [];
    data[this.name].push(doc);
    this._write(data);
    return { insertedId: doc._id || Date.now().toString() };
  }

  async countDocuments(query = {}) {
    const data = this._read();
    const list = data[this.name] || [];
    if (Object.keys(query).length === 0) return list.length;
    return list.filter(item => {
      for (let k in query) {
        if (item[k] !== query[k]) return false;
      }
      return true;
    }).length;
  }
}

async function connectDB() {
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`✅ MongoDB connected → database: "${DB_NAME}"`);
    return db;
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB Atlas:', err.message);
    console.log('⚠️ Falling back to local file database at:', fallbackFilePath);
    useLocalFallback = true;
    
    // Create an emulation database object
    db = {
      collection: (name) => new MockCollection(name, fallbackFilePath),
      createCollection: async () => {}
    };
    return db;
  }
}

function getDB() {
  if (!db) {
    // If not connected yet but called, initialize mock db directly
    console.log('⚠️ getDB() called before connectDB completed, using local file DB fallback');
    db = {
      collection: (name) => new MockCollection(name, fallbackFilePath),
      createCollection: async () => {}
    };
  }
  return db;
}

module.exports = { connectDB, getDB };
