import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';

const fixIndexes = async () => {
  console.log('Connecting to MongoDB Atlas to clean payment indexes and documents...');
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    const db = mongoose.connection.db;

    const collection = db.collection('payments');

    // 1. List existing indexes
    const indexes = await collection.indexes();
    console.log('Existing indexes on payments:', indexes.map((i) => i.name));

    // 2. Drop paymentId_1 index if exists
    if (indexes.some((i) => i.name === 'paymentId_1')) {
      console.log('Dropping legacy paymentId_1 index...');
      await collection.dropIndex('paymentId_1');
      console.log('Successfully dropped paymentId_1 index.');
    }

    // 3. Find documents with null or missing paymentId and assign unique values
    const docs = await collection.find({ $or: [{ paymentId: null }, { paymentId: { $exists: false } }] }).toArray();
    console.log(`Found ${docs.length} payments with missing/null paymentId.`);

    for (const doc of docs) {
      const generated = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      await collection.updateOne({ _id: doc._id }, { $set: { paymentId: generated } });
    }
    console.log('Updated all missing paymentId values.');

    // 4. Create sparse unique index on paymentId
    await collection.createIndex({ paymentId: 1 }, { unique: true, sparse: true });
    console.log('Successfully created sparse unique index on paymentId: 1');

    console.log('✅ Index fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing payment indexes:', error);
    process.exit(1);
  }
};

fixIndexes();
