/**
 * Centralized File Upload Safety & Validation Utility
 * - Validates file size, MIME type, and extension
 * - Prevents oversized uploads and unsupported file formats
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateImageFile(file: File): FileValidationResult {
  const MAX_SIZE_MB = 5;
  const maxSizeInBytes = MAX_SIZE_MB * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `Image size exceeds the maximum limit of ${MAX_SIZE_MB}MB. Please upload a smaller image.`,
    };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/x-icon'];
  const fileType = file.type.toLowerCase();

  // Also check extension as fallback
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'ico'];

  if (!allowedTypes.includes(fileType) && !allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: 'Invalid image format. Supported formats: JPG, PNG, WEBP, SVG, GIF.',
    };
  }

  return { isValid: true };
}

export function validateSpreadsheetFile(file: File): FileValidationResult {
  const MAX_SIZE_MB = 10;
  const maxSizeInBytes = MAX_SIZE_MB * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `Spreadsheet size exceeds the maximum limit of ${MAX_SIZE_MB}MB.`,
    };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedExtensions = ['csv', 'xlsx', 'xls'];

  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: 'Invalid file format. Please upload a valid CSV or Excel spreadsheet (.csv, .xlsx, .xls).',
    };
  }

  return { isValid: true };
}
