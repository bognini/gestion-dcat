/**
 * File upload security utilities.
 * Validates file types, sizes, and sanitizes filenames.
 */

/** Allowed MIME types for document uploads */
const ALLOWED_DOCUMENT_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
]);

/** Allowed MIME types for image uploads */
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

/** Dangerous file extensions that should always be blocked */
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.sh', '.bash', '.csh', '.ksh',
  '.php', '.php3', '.php4', '.php5', '.phtml',
  '.jsp', '.asp', '.aspx',
  '.py', '.rb', '.pl',
  '.js', '.ts', '.mjs',
  '.htaccess', '.htpasswd',
]);

/** Max file size: 20MB */
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** Max image file size: 10MB */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an uploaded file for documents (PDF, Word, Excel, etc.)
 */
export function validateDocumentUpload(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Le fichier est trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` };
  }

  const ext = getExtension(file.name);
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return { valid: false, error: 'Type de fichier non autorisé' };
  }

  // Allow documents and images
  if (!ALLOWED_DOCUMENT_MIMES.has(file.type) && !ALLOWED_IMAGE_MIMES.has(file.type)) {
    return { valid: false, error: `Type de fichier non autorisé: ${file.type}` };
  }

  return { valid: true };
}

/**
 * Validate an uploaded file for images only
 */
export function validateImageUpload(file: File): FileValidationResult {
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `L'image est trop volumineuse (max ${MAX_IMAGE_SIZE / 1024 / 1024}MB)` };
  }

  if (!ALLOWED_IMAGE_MIMES.has(file.type)) {
    return { valid: false, error: 'Seules les images (JPEG, PNG, GIF, WebP) sont autorisées' };
  }

  return { valid: true };
}

/**
 * Sanitize a filename to prevent path traversal and special character attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = filename.split(/[/\\]/).pop() || 'file';
  // Remove special characters, keep only alphanumeric, dots, hyphens, underscores
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200);
}

function getExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return '.' + parts.pop()!.toLowerCase();
}
