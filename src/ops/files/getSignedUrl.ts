import { Storage } from '@google-cloud/storage';
import { ComKey, Item, NotFoundError, PriKey } from '@fjell/core';
import { PathBuilder } from '../../PathBuilder';
import { SignedUrlOptions } from '../../types/Files';
import { Options } from '../../Options';
import GCSLogger from '../../logger';

const logger = GCSLogger.get('ops', 'files', 'getSignedUrl');

/**
 * Get a signed URL for a file attachment
 */
export async function getSignedUrl<
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
  signedUrlOptions: SignedUrlOptions | undefined,
  pathBuilder: PathBuilder,
  options: Options<V, S, L1, L2, L3, L4, L5>
): Promise<string> {
  logger.default('getSignedUrl', { key, label, filename });

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

    // Generate signed URL
    const expirationSeconds = signedUrlOptions?.expirationSeconds || 3600;
    const action = signedUrlOptions?.action || 'read';
    const expires = Date.now() + (expirationSeconds * 1000);

    const [url] = await file.getSignedUrl({
      action,
      expires,
      responseType: signedUrlOptions?.responseContentType,
      promptSaveAs: signedUrlOptions?.contentDisposition
    });

    logger.default('Generated signed URL', { filePath, expires: new Date(expires) });
    return url;
  } catch (error) {
    logger.error('Error generating signed URL', { key, label, filename, error });
    throw error;
  }
}

