import { NextRequest } from 'next/server';
import { withErrorHandling, errorResponse, successResponse, validateRequestBody } from '@/lib/api/error-handler';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = {
  resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  profile: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
};

interface UploadRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadType: 'resume' | 'profile';
  userId?: string; // Optional for organizing files
}

/**
 * POST /api/upload
 * Generate presigned URL for direct S3 upload
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Validate request body
  const validation = await validateRequestBody<UploadRequest>(request, [
    'fileName', 'fileType', 'fileSize', 'uploadType'
  ]);
  
  if (!validation.isValid) {
    return errorResponse(validation.error!, 400);
  }
  
  const { fileName, fileType, fileSize, uploadType, userId } = validation.data!;

  // Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    return errorResponse(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`, 400);
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES[uploadType].includes(fileType)) {
    return errorResponse(`Invalid file type for ${uploadType}. Allowed: ${ALLOWED_FILE_TYPES[uploadType].join(', ')}`, 400);
  }

  // Generate unique file key
  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const s3Key = `${uploadType}s/${userId || 'anonymous'}/${uniqueFileName}`;

  // Create presigned URL for upload
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: fileType,
    ContentLength: fileSize,
    Metadata: {
      originalName: fileName,
      uploadType,
      userId: userId || 'anonymous',
      uploadedAt: new Date().toISOString()
    }
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300, // 5 minutes
  });

  // Construct the final file URL (public access)
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

  return successResponse({
    presignedUrl,
    fileUrl,
    s3Key,
    expiresIn: 300
  });
});

/**
 * DELETE /api/upload
 * Delete file from S3 (for cleanup)
 */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const s3Key = searchParams.get('key');

  if (!s3Key) {
    return errorResponse('S3 key is required', 400);
  }

  // TODO: Add authorization check here
  // Ensure user can only delete their own files

  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  
  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  }));

  return successResponse({
    message: 'File deleted successfully'
  });
});