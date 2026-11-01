import mongoose from 'mongoose';

/**
 * Global cache for MongoDB connection across serverless invocations.
 * This prevents creating duplicate connection pools on every cold/warm start.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB(uri = process.env.MONGODB_URI) {
  const targetUri = uri || 'mongodb://127.0.0.1:27017/autonear';

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    cached.promise = mongoose.connect(targetUri, opts).then((mongooseInstance) => {
      console.log(`[Database] MongoDB connected successfully to ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      console.error('[Database] MongoDB connection error:', err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export async function disconnectDB() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('[Database] MongoDB disconnected cleanly');
  }
}

