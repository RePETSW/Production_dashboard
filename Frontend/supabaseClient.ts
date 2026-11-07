import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xczcdzdowzoszigtvvdm.supabase.co';
const supabaseAnonKey = 'sb_publishable_gr3lgFp4gZBrLMimsaaFfA_rohG9aqd';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});