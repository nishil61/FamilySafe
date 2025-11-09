/**
 * API Constraints
 * Protects against DoS attacks and resource exhaustion
 */

// Maximum request body size: 10MB for file uploads
export const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB

// Maximum JSON body size: 1MB
export const MAX_JSON_SIZE = 1 * 1024 * 1024; // 1MB

// API timeout in milliseconds: 30 seconds
export const API_TIMEOUT = 30000; // 30 seconds

// Maximum file upload size: 50MB
export const MAX_FILE_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB

// Allowed file types for upload
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function validateFileSize(size: number, maxSize: number = MAX_FILE_UPLOAD_SIZE): boolean {
  return size > 0 && size <= maxSize;
}

export function validateFileType(mimeType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(mimeType);
}

export function validateEmailAddress(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}
