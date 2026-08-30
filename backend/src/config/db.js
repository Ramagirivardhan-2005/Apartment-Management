import mongoose from 'mongoose';

export const connectDB = async (retries = 10, delay = 3000) => {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('[Database Error] DATABASE_URL is not defined in environment variables');
    throw new Error('DATABASE_URL missing');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Database] Connecting to MongoDB Atlas (attempt ${attempt}/${retries})...`);

      const conn = await mongoose.connect(dbUrl, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });

      console.log(`[Database] ✅ MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`[Database Error] Atlas connection attempt ${attempt} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`[Database] Retrying connection to Atlas in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error('[Database Error] Could not connect to MongoDB Atlas after maximum retries.');
        throw error;
      }
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database Warning] MongoDB Atlas disconnected. Reconnecting...');
  setTimeout(() => {
    if (mongoose.connection.readyState === 0) {
      connectDB().catch((err) => console.error('[Database Error] Auto-reconnect failed:', err.message));
    }
  }, 3000);
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] ✅ MongoDB Atlas reconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error] MongoDB Atlas runtime error:', err.message);
});
