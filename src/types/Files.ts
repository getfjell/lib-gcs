/**
 * Metadata for a file attachment
 */
export interface FileReference {
  /** File name (e.g., "0.wav", "cover.jpg") */
  name: string;
  
  /** Label/category (e.g., "master", "final", "thumbnail") */
  label: string;
  
  /** File size in bytes */
  size: number;
  
  /** MIME type (e.g., "audio/wav", "image/jpeg") */
  contentType: string;
  
  /** Upload timestamp */
  uploadedAt: Date;
  
  /** MD5 checksum for integrity verification */
  checksum?: string;
  
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * File collection organized by label
 */
export type FileCollection = {
  [label: string]: FileReference[];
};

/**
 * Options for file upload
 */
export interface UploadFileOptions {
  /** MIME type (auto-detected if not provided) */
  contentType?: string;
  
  /** Custom metadata */
  metadata?: Record<string, any>;
  
  /** Whether to compute checksum (default: true) */
  computeChecksum?: boolean;
}

/**
 * Options for signed URL generation
 */
export interface SignedUrlOptions {
  /** Expiration in seconds (default: 3600 = 1 hour) */
  expirationSeconds?: number;
  
  /** Action type (default: 'read') */
  action?: 'read' | 'write' | 'delete';
  
  /** Response content type override */
  responseContentType?: string;
  
  /** Content disposition (e.g., "attachment; filename=file.wav") */
  contentDisposition?: string;
}

/**
 * Options for file deletion
 */
export interface DeleteFileOptions {
  /** Whether to update item JSON (default: true) */
  updateItemMetadata?: boolean;
}

