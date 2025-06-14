import dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load local environment variables if available
if (existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}

const required = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET'
];

const missing = required.filter(name => !process.env[name]);

if (missing.length) {
  console.error('\u274c Missing required environment variables:');
  for (const name of missing) {
    console.error(`  - ${name}`);
  }
  console.error('Create or update your .env.local file with these values.');
  process.exit(1);
}

console.log('\u2705 Environment variables loaded');
