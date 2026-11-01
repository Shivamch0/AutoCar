import dotenv from 'dotenv';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

dotenv.config();

/**
 * Vercel Serverless Function entry point.
 * Ensures MongoDB connection is established (or reused from global cache)
 * without calling app.listen().
 */
export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('[Vercel Serverless Entry] Database initialization failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed in serverless function',
      error: error.message
    });
  }
}

