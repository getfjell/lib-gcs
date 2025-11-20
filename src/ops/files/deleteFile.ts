import { Storage } from '@google-cloud/storage';
import { ComKey, Item, PriKey } from '@fjell/core';
import { PathBuilder } from '../../PathBuilder';
import { FileProcessor } from '../../FileProcessor';
import { Options } from '../../Options';
import { get } from '../get';
import { update } from '../update';
import GCSLogger from '../../logger';

const logger = GCSLogger.get('ops', 'files', 'deleteFile');

/**
 * Delete a file attachment for an item
 */
export async function deleteFile<
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
  fileProcessor: FileProcessor,
  coordinate: any,
  options: Options<V, S, L1, L2, L3, L4, L5>
): Promise<void> {
  logger.default('deleteFile', { key, label, filename });

  try {
    const filesDir = options.files?.directory || '_files';
    const filePath = pathBuilder.buildFilePath(key, label, filename, filesDir);
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    // Delete file from GCS
    await file.delete();
    logger.default('Deleted file from GCS', { filePath });

    // Update item JSON to remove file reference
    if ((options.files?.includeMetadataInItem ?? true) && options.mode !== 'files-only') {
      const item = await get<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        key,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );

      if (item && (item as any).files) {
        const files = (item as any).files;
        const labelFiles = files[label] || [];
        
        // Remove file reference
        const filtered = labelFiles.filter((f: any) => f.name !== filename);
        
        if (filtered.length === 0) {
          // No more files in this label, remove the label
          delete files[label];
        } else {
          files[label] = filtered;
        }

        // Update item (undefined defaults to deep merge)
        await update<V, S, L1, L2, L3, L4, L5>(
          storage,
          bucketName,
          key,
          { files } as any,
          undefined, // eslint-disable-line no-undefined
          pathBuilder,
          fileProcessor,
          coordinate,
          options
        );
      }
    }
  } catch (error) {
    logger.error('Error deleting file', { key, label, filename, error });
    throw error;
  }
}

