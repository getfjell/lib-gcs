import { Storage } from '@google-cloud/storage';
import { ComKey, Item, PriKey } from '@fjell/types';
import { NotFoundError } from '@fjell/core';
import { PathBuilder } from '../../PathBuilder';
import { Options } from '../../Options';
import GCSLogger from '../../logger';

const logger = GCSLogger.get('ops', 'files', 'downloadFile');

/**
 * Download a file attachment for an item
 */
export async function downloadFile<
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
  pathBuilder: PathBuilder,
  options: Options<V, S, L1, L2, L3, L4, L5>
): Promise<Buffer> {
  logger.default('downloadFile', { key, label, filename });

  try {
    const filesDir = options.files?.directory || '_files';
    const filePath = pathBuilder.buildFilePath(key, label, filename, filesDir);
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new NotFoundError(
        `File not found: ${filename}`,
        'file',
        { key, label, filename }
      );
    }

    // Download file
    const [content] = await file.download();
    logger.default('Downloaded file', { filePath, size: content.length });

    return content;
  } catch (error) {
    logger.error('Error downloading file', { key, label, filename, error });
    throw error;
  }
}

