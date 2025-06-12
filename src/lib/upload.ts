/**
 * Client-side file upload utility for AWS S3
 */

export interface UploadResult {
  fileUrl: string;
  s3Key: string;
  success: boolean;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload file to S3 using presigned URL
 */
export async function uploadFile(
  file: File, 
  type: 'resume' | 'profile',
  userId?: string
): Promise<UploadResult> {
  try {
    // Step 1: Get presigned URL from our API
    const presignedResponse = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadType: type,
        userId
      })
    });

    if (!presignedResponse.ok) {
      const error = await presignedResponse.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const { data } = await presignedResponse.json();
    const { presignedUrl, fileUrl, s3Key } = data;

    // Step 2: Upload directly to S3 using presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
        'Content-Length': file.size.toString(),
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.statusText}`);
    }

    return {
      fileUrl,
      s3Key,
      success: true
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      fileUrl: '',
      s3Key: '',
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Upload file with XMLHttpRequest for progress tracking
 */
export async function uploadFileWithProgress(
  file: File, 
  type: 'resume' | 'profile',
  userId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Get presigned URL
    const presignedResponse = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadType: type,
        userId
      })
    });

    if (!presignedResponse.ok) {
      const error = await presignedResponse.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const { data } = await presignedResponse.json();
    const { presignedUrl, fileUrl, s3Key } = data;

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          };
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve({
            fileUrl,
            s3Key,
            success: true
          });
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

  } catch (error) {
    console.error('Upload with progress error:', error);
    return {
      fileUrl: '',
      s3Key: '',
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, type: 'resume' | 'profile'): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = {
    resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    profile: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  };

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_SIZE / 1024 / 1024}MB`
    };
  }

  if (!ALLOWED_TYPES[type].includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type for ${type}. Allowed: ${ALLOWED_TYPES[type].join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Get file preview URL (for images)
 */
export function getFilePreview(file: File): string {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return '';
}

/**
 * Clean up object URLs to prevent memory leaks
 */
export function cleanupFilePreview(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}