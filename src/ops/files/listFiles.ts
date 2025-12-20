import { Storage } from '@google-cloud/storage';
import { ComKey, Item, PriKey } from '@fjell/types';
import { PathBuilder } from '../../PathBuilder';
import { FileReference } from '../../types/Files';
import { Options } from '../../Options';
import GCSLogger from '../../logger';

const logger = GCSLogger.get('ops', 'files', 'listFiles');

/**
 * List file attachments for an item
 */
export async function listFiles<
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
  label: string | undefined,
  pathBuilder: PathBuilder,
  options: Options<V, S, L1, L2, L3, L4, L5>
): Promise<FileReference[]> {
  logger.default('listFiles', { key, label });

  try {
    const filesDir = options.files?.directory || '_files';
    
    // Build prefix based on whether label is provided
    const prefix = label
      ? pathBuilder.buildLabelDirectory(key, label, filesDir)
      : pathBuilder.buildFilesDirectory(key, filesDir);

    const bucket = storage.bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix });

    logger.default('Listed files', { prefix, count: files.length });

    // Convert to FileReference objects
    const references: FileReference[] = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata();
        const parsed = pathBuilder.parseFilePath(file.name, filesDir);
        
        return {
          name: parsed?.filename || file.name.split('/').pop() || file.name,
          label: parsed?.label || label || 'unknown',
          size: parseInt(metadata.size as string, 10),
          contentType: metadata.contentType || 'application/octet-stream',
          uploadedAt: new Date(metadata.timeCreated as string),
          checksum: metadata.md5Hash,
          metadata: metadata.metadata as Record<string, any> | undefined
        };
      })
    );

    return references;
  } catch (error) {
    logger.error('Error listing files', { key, label, error });
    throw error;
  }
}

