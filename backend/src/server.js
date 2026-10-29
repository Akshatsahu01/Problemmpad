import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './app.js';

dotenv.config({path:['../.env','.env']});
const port = process.env.PORT || 4000;
if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
process.env.GEMINI_API_KEY ||= process.env.GOOGLE_API_KEY;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(port, '0.0.0.0', () => console.log(`ProblemPad API listening on ${port}`)))
  .catch((error) => { console.error('MongoDB connection failed:', error.name); process.exit(1); });
