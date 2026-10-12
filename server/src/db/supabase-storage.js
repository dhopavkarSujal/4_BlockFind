
import { createClient } from '@supabase/supabase-js';

let storageClient;

export function getSupabaseStorage() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const secretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !secretKey) {
    const error = new Error('Supabase private storage is not configured');
    error.code = 'STORAGE_NOT_CONFIGURED';
    throw error;
  }

  if (!storageClient) {
    storageClient = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return storageClient;
}

export function getEvidenceBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'claim-evidence';
}
