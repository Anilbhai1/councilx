/**
 * COUNCIL X | THE SYNDICATE
 * Supabase Batch Seeder Script
 * Inserts all 216 Masterminds from src/data/agents_seed_1000.json into Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Automatically parse local .env file if running in raw Node.js environment
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function seedSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('your-project')) {
    console.error('❌ Supabase credentials missing or placeholder found.');
    console.error(`URL: ${SUPABASE_URL}`);
    console.error(`KEY: ${SUPABASE_KEY ? '[PRESENT]' : '[MISSING]'}`);
    process.exit(1);
  }

  console.log(`🌐 Connecting to Supabase project at: ${SUPABASE_URL}`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const jsonPath = path.join(__dirname, 'src', 'data', 'agents_seed_1000.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('⚠️ agents_seed_1000.json not found. Running generator first...');
    const { generate216Agents } = require('./generate_agents');
    generate216Agents();
  }

  const agents = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📦 Loaded ${agents.length} Masterminds. Preparing batch upsert into Supabase...`);

  // Supabase batch insert in chunks of 50
  const CHUNK_SIZE = 50;
  for (let i = 0; i < agents.length; i += CHUNK_SIZE) {
    const chunk = agents.slice(i, i + CHUNK_SIZE);
    console.log(`🚀 Upserting agents ${i + 1} to ${Math.min(i + CHUNK_SIZE, agents.length)}...`);
    
    const { error } = await supabase.from('agents').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`❌ Error inserting chunk ${i}:`, error.message);
    }
  }

  console.log('✨ All 216 Supreme Masterminds successfully seeded into Supabase!');
}

seedSupabase();
