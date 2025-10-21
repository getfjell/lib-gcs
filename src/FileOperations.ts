import { ComKey, Coordinate, Item, PriKey } from '@fjell/core';
import { Storage } from '@google-cloud/storage';
import { PathBuilder } from './PathBuilder';
import { FileProcessor } from './FileProcessor';
import { Options } from './Options';
import { FileReference, SignedUrlOptions, UploadFileOptions } from './types/Files';
import * as fileOps from './ops/files';
import GCSLogger from './logger';

const logger = GCSLogger.get('FileOperations');

/**
 * File operations interface
 */
export interface FileOperations<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  uploadFile(
    key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    label: string,
    filename: string,
    content: Buffer,
    options?: UploadFileOptions
  ): Promise<FileReference>;
  
  downloadFile(
    key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    label: string,
    filename: string
  ): Promise<Buffer>;
  
  deleteFile(
    key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    label: string,
    filename: string
  ): Promise<void>;
  
  listFiles(
    key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    label?: string
  ): Promise<FileReference[]>;
  
  getSignedUrl(
    key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    label: string,
    filename: string,
    options?: SignedUrlOptions
  ): Promise<string>;
}

/**
 * Create file operations implementation
 */
export function createFileOperations<
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
  pathBuilder: PathBuilder,
  fileProcessor: FileProcessor,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
  options: Options<V, S, L1, L2, L3, L4, L5>
): FileOperations<V, S, L1, L2, L3, L4, L5> {
  logger.default('createFileOperations', { bucketName });

  return {
    uploadFile: async (key, label, filename, content, uploadOptions) => {
      return fileOps.uploadFile<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        key,
        label,
        filename,
        content,
        uploadOptions,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );
    },

    downloadFile: async (key, label, filename) => {
      return fileOps.downloadFile<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        key,
        label,
        filename,
        pathBuilder,
        options
      );
    },

    deleteFile: async (key, label, filename) => {
      return fileOps.deleteFile<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        key,
        label,
        filename,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );
    },

    listFiles: async (key, label) => {
      return fileOps.listFiles<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        key,
        label,
        pathBuilder,
        options
      );
    },

    getSignedUrl: async (key, label, filename, signedUrlOptions) => {
      return fileOps.getSignedUrl<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        key,
        label,
        filename,
        signedUrlOptions,
        pathBuilder,
        options
      );
    }
  };
}

