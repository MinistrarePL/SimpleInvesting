import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Ręczne parsowanie .env dla pewności
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars['PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Brak kluczy Supabase w pliku .env!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Sprawdzam połączenie z Supabase...');
  
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError && authError.message !== 'Auth session missing!') {
       console.error('❌ Błąd połączenia:', authError.message);
    } else {
       console.log('✅ Połączenie z Supabase nawiązane pomyślnie!');
       console.log('URL Twojego projektu to:', supabaseUrl);
    }
  } catch (err) {
    console.error('❌ Wystąpił nieoczekiwany błąd:', err);
  }
}

testConnection();
