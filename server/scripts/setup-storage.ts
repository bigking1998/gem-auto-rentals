/**
 * Setup script to create the Supabase storage bucket for documents
 *
 * Run this script after adding SUPABASE_SERVICE_ROLE_KEY to your .env file:
 *   pnpm tsx scripts/setup-storage.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const BUCKET_NAME = 'documents';

async function setupStorage() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL is not set in .env');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env');
    console.log('\nTo get your service role key:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Settings > API');
    console.log('4. Copy the "service_role" key (not the anon key)');
    console.log('5. Add it to server/.env as SUPABASE_SERVICE_ROLE_KEY="your-key"');
    process.exit(1);
  }

  console.log('🔧 Setting up Supabase Storage...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Check if bucket already exists
  console.log(`📦 Checking if bucket "${BUCKET_NAME}" exists...`);
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Failed to list buckets:', listError.message);
    process.exit(1);
  }

  const existingBucket = buckets?.find(b => b.name === BUCKET_NAME);

  if (existingBucket) {
    console.log(`✅ Bucket "${BUCKET_NAME}" already exists`);
  } else {
    // Create the bucket
    console.log(`📦 Creating bucket "${BUCKET_NAME}"...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    });

    if (createError) {
      console.error('❌ Failed to create bucket:', createError.message);
      process.exit(1);
    }

    console.log(`✅ Bucket "${BUCKET_NAME}" created successfully`);
  }

  // Note about RLS policies
  console.log('\n📋 Storage bucket setup complete!');
  console.log('\n⚠️  Important: You may need to set up Row Level Security (RLS) policies');
  console.log('   for the storage.objects table in your Supabase Dashboard.');
  console.log('\n   Recommended policies for the "documents" bucket:');
  console.log('   - Users can upload to their own folder: bucket_id = \'documents\' AND (storage.foldername(name))[1] = auth.uid()');
  console.log('   - Users can view their own documents');
  console.log('   - Staff can view all documents');
  console.log('\n   See supabase/migrations/005_storage_buckets.sql for example policies.');

  // Test upload capability
  console.log('\n🧪 Testing storage access...');
  const testPath = `_test_${Date.now()}.txt`;
  const testContent = new Blob(['test'], { type: 'text/plain' });

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(testPath, testContent);

  if (uploadError) {
    console.log('⚠️  Test upload failed:', uploadError.message);
    console.log('   This may be expected if RLS policies are not yet configured.');
  } else {
    console.log('✅ Test upload successful');

    // Clean up test file
    await supabase.storage.from(BUCKET_NAME).remove([testPath]);
    console.log('✅ Test file cleaned up');
  }

  console.log('\n🎉 Storage setup complete!\n');
}

setupStorage().catch(console.error);
