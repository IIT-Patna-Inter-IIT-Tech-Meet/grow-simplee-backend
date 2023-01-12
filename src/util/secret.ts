import fs from 'fs';
import { config } from 'dotenv';

if (!fs.existsSync('.env')) {
  console.error("[+] .env file doesn't seem to exist!");
}

// Get Environment Variables
config();

export const ENVIRONMENT = process.env.NODE_ENV;
export const __prod__ = ENVIRONMENT === 'production';
export const PORT = Number(process.env.PORT) || 5000;
export const CLIENT_URL = process.env.CLIENT_URL;
export const SESSION_SECRET = process.env.SESSION_SECRET || 'random_secret';
