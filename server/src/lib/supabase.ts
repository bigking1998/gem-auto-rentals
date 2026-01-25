import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn('SUPABASE_URL is not set. Storage features will be disabled.');
}

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Storage features will be disabled.');
}

// Create a single supabase client for interacting with storage
// Using service role key for server-side operations
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Storage bucket names
export const BUCKETS = {
  DOCUMENTS: 'documents',  // Private - customer verification docs
  VEHICLES: 'vehicles',    // Public - vehicle images
  AVATARS: 'avatars',      // Public - user profile pictures
  CONTRACTS: 'contracts',  // Private - rental agreements
  LOGOS: 'logos',          // Public - company logos
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

// Legacy export for backwards compatibility
export const DOCUMENTS_BUCKET = BUCKETS.DOCUMENTS;

// Helper to check if storage is configured
export function isStorageConfigured(): boolean {
  return supabase !== null;
}

// Get public URL for a file in a public bucket
export function getPublicUrl(bucket: BucketName, filePath: string): string | null {
  if (!supabase) return null;

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Get signed URL for private files (with expiry)
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600,
  bucket: BucketName = BUCKETS.DOCUMENTS
): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

// Upload a file to a bucket
export async function uploadFile(
  bucket: BucketName,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ path: string } | { error: string }> {
  if (!supabase) return { error: 'Storage is not configured' };

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    console.error(`Error uploading to ${bucket}:`, error);
    return { error: error.message };
  }

  return { path: filePath };
}

// Delete a file from a bucket
export async function deleteFile(
  bucket: BucketName,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Storage is not configured' };

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error(`Error deleting from ${bucket}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
