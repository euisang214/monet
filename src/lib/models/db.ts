import mongoose from 'mongoose';

// MONGODB_URI may be loaded via dotenv in scripts before connectDB is called
let MONGODB_URI: string | undefined = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB Atlas and returns the mongoose connection
 * Uses connection pooling and caching for optimal performance
 */
export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  // Read env at call time in case dotenv loaded after module import
  if (!MONGODB_URI) {
    MONGODB_URI = process.env.MONGODB_URI;
  }
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ Connected to MongoDB Atlas');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Disconnects from MongoDB (mainly for testing)
 */
export async function disconnectDB() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('📴 Disconnected from MongoDB');
  }
}

/**
 * Helper to ensure DB connection in API routes
 */
export async function withDB<T>(
  handler: () => Promise<T> | T
): Promise<T> {
  await connectDB();
  return handler();
}