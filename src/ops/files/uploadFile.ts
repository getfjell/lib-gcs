import { Storage } from '@google-cloud/storage';
import { ComKey, Item, PriKey } from '@fjell/core';
import { PathBuilder } from '../../PathBuilder';
import { FileProcessor } from '../../FileProcessor';
import { FileReference, UploadFileOptions } from '../../types/Files';
import { Options } from '../../Options';
import { get } from '../get';
import { update } from '../update';
import GCSLogger from '../../logger';
import { createHash } from 'crypto';

const logger = GCSLogger.get('ops', 'files', 'uploadFile');

/**
 * Upload a file attachment for an item
 */
export async function uploadFile<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  storage: Storage,
  bucketName: string,
  key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
  label: string,
  filename: string,
  content: Buffer,
  uploadOptions: UploadFileOptions | undefined,
  pathBuilder: PathBuilder,
  fileProcessor: FileProcessor,
  coordinate: any,
  options: Options<V, S, L1, L2, L3, L4, L5>
): Promise<FileReference> {
  logger.default('uploadFile', { key, label, filename, size: content.length });

  try {
    const filesDir = options.files?.directory || '_files';
    
    // Validate file size
    if (options.files?.maxFileSize && content.length > options.files.maxFileSize) {
      throw new Error(
        `File size (${content.length} bytes) exceeds maximum allowed size (${options.files.maxFileSize} bytes)`
      );
    }

    // Validate content type
    const contentType = uploadOptions?.contentType || 'application/octet-stream';
    if (options.files?.allowedContentTypes && options.files.allowedContentTypes.length > 0) {
      const allowed = options.files.allowedContentTypes.some(pattern => {
        return contentType.match(new RegExp(pattern));
      });
      if (!allowed) {
        throw new Error(
          `Content type ${contentType} not allowed. Allowed types: ${options.files.allowedContentTypes.join(', ')}`
        );
      }
    }

    // Build file path
    const filePath = pathBuilder.buildFilePath(key, label, filename, filesDir);
    logger.default('Built file path', { filePath });

    // Compute checksum if enabled
    let checksum: string | undefined;
    if (uploadOptions?.computeChecksum ?? options.files?.computeChecksums ?? true) {
      checksum = createHash('md5').update(content).digest('base64');
    }

    // Upload to GCS
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    
    await file.save(content, {
      contentType,
      metadata: {
        ...uploadOptions?.metadata,
        label,
        originalFilename: filename
      }
    });

    logger.default('Uploaded file', { filePath, size: content.length });

    // Create file reference
    const fileReference: FileReference = {
      name: filename,
      label,
      size: content.length,
      contentType,
      uploadedAt: new Date(),
      checksum,
      metadata: uploadOptions?.metadata
    };

    // Update item JSON if configured
    const shouldUpdateMetadata = options.files?.includeMetadataInItem ?? true;
    const canUpdateMetadata = options.mode !== 'files-only';
    
    if (shouldUpdateMetadata && canUpdateMetadata) {
      // Get existing item
      const item = await get<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        key,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );

      if (item) {
        // Update files property
        const files = (item as any).files || {};
        const labelFiles = files[label] || [];
        
        // Add or update file reference
        const existingIndex = labelFiles.findIndex((f: FileReference) => f.name === filename);
        if (existingIndex >= 0) {
          labelFiles[existingIndex] = fileReference;
        } else {
          labelFiles.push(fileReference);
        }
        
        files[label] = labelFiles;

        // Update item
        await update<V, S, L1, L2, L3, L4, L5>(
          storage,
          bucketName,
          key,
          { files } as any,
          { mergeStrategy: 'deep' },
          pathBuilder,
          fileProcessor,
          coordinate,
          options
        );
      }
    }

    return fileReference;
  } catch (error) {
    logger.error('Error uploading file', { key, label, filename, error });
    throw error;
  }
}

