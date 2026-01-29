import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://pub-xxxx.r2.dev

// Check if storage is configured
const isConfigured = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);

if (!isConfigured) {
  console.warn('R2 storage is not configured. File upload/download features will be disabled.');
  console.warn('Required env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
}

// Create S3 client configured for Cloudflare R2
const s3Client = isConfigured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

// Storage bucket names (these need to be created in Cloudflare R2 dashboard)
export const BUCKETS = {
  DOCUMENTS: 'gem-documents',   // Private - customer verification docs
  VEHICLES: 'gem-vehicles',     // Public - vehicle images
  AVATARS: 'gem-avatars',       // Public - user profile pictures
  CONTRACTS: 'gem-contracts',   // Private - rental agreements
  LOGOS: 'gem-logos',           // Public - company logos
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

// Legacy export for backwards compatibility
export const DOCUMENTS_BUCKET = BUCKETS.DOCUMENTS;

// Helper to check if storage is configured
export function isStorageConfigured(): boolean {
  return isConfigured && s3Client !== null;
}

// Get public URL for a file in a public bucket
export function getPublicUrl(bucket: BucketName, filePath: string): string | null {
  if (!R2_PUBLIC_URL) {
    console.warn('R2_PUBLIC_URL is not set');
    return null;
  }

  // Public buckets are served via R2's public access URL
  // Format: https://pub-xxxx.r2.dev/bucket-name/file-path
  // Or if using custom domain: https://cdn.example.com/bucket-name/file-path
  return `${R2_PUBLIC_URL}/${bucket}/${filePath}`;
}

// Get signed URL for private files (with expiry)
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600,
  bucket: BucketName = BUCKETS.DOCUMENTS
): Promise<string | null> {
  if (!s3Client) {
    console.warn('Storage not configured');
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });

    const signedUrl = await getS3SignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
}

// Get signed URL for download (with content-disposition header)
export async function getSignedDownloadUrl(
  filePath: string,
  fileName: string,
  expiresIn: number = 300,
  bucket: BucketName = BUCKETS.DOCUMENTS
): Promise<string | null> {
  if (!s3Client) {
    console.warn('Storage not configured');
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: filePath,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    });

    const signedUrl = await getS3SignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error creating download URL:', error);
    return null;
  }
}

// Upload a file to a bucket
export async function uploadFile(
  bucket: BucketName,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ path: string } | { error: string }> {
  if (!s3Client) {
    return { error: 'Storage is not configured' };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return { path: filePath };
  } catch (error) {
    console.error(`Error uploading to ${bucket}:`, error);
    return { error: error instanceof Error ? error.message : 'Upload failed' };
  }
}

// Delete a file from a bucket
export async function deleteFile(
  bucket: BucketName,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  if (!s3Client) {
    return { success: false, error: 'Storage is not configured' };
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting from ${bucket}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
  }
}
