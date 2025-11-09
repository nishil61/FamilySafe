import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Decode a base64 string to Uint8Array
 * This is more robust than atob for binary data
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  // Create a binary string from base64
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * Convert Uint8Array to a blob with proper MIME type
 */
export function uint8ArrayToBlob(data: Uint8Array, mimeType: string = 'application/octet-stream'): Blob {
  return new Blob([data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer], { type: mimeType });
}

/**
 * Create an object URL from base64 data
 */
export function base64ToObjectURL(base64: string, mimeType: string = 'application/octet-stream'): string {
  try {
    const bytes = base64ToUint8Array(base64);
    const blob = uint8ArrayToBlob(bytes, mimeType);
    return URL.createObjectURL(blob);
  } catch (error) {
    throw new Error('Failed to create blob from data');
  }
}

/**
 * Format file size in bytes to human readable format (KB, MB, GB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Safely validate a redirect URL to prevent open redirect vulnerabilities
 * Only allows relative URLs starting with / or absolute URLs matching the app domain
 */
export function isValidRedirect(url: string | null): boolean {
  if (!url) return false;
  
  // Must be a string
  if (typeof url !== 'string') return false;
  
  // Don't allow protocol-relative URLs or absolute URLs to different domains
  if (url.startsWith('//')) return false;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002');
      return urlObj.hostname === appUrl.hostname;
    } catch {
      return false;
    }
  }
  
  // Allow relative URLs starting with /
  if (url.startsWith('/')) return true;
  
  return false;
}

/**
 * Get a safe redirect URL with fallback to default
 */
export function getSafeRedirectUrl(url: string | null, defaultUrl: string = '/dashboard'): string {
  if (isValidRedirect(url)) {
    return url as string;
  }
  return defaultUrl;
}
