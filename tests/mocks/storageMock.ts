/**
 * Mock GCS Storage for fast unit tests
 */
export class MockStorage {
  private files: Map<string, Buffer> = new Map();
  private buckets: Map<string, MockBucket> = new Map();

  bucket(name: string): MockBucket {
    if (!this.buckets.has(name)) {
      this.buckets.set(name, new MockBucket(name, this.files));
    }
    return this.buckets.get(name)!;
  }

  clear(): void {
    this.files.clear();
  }

  getFiles(): Map<string, Buffer> {
    return this.files;
  }
}

export class MockBucket {
  constructor(
    private bucketName: string,
    private files: Map<string, Buffer>
  ) {}

  file(path: string): MockFile {
    return new MockFile(path, this.files);
  }

  async getFiles(options?: any): Promise<[MockFile[], any, any]> {
    const prefix = options?.prefix || '';
    const mockFiles: MockFile[] = [];

    for (const [path] of this.files.entries()) {
      if (path.startsWith(prefix)) {
        mockFiles.push(new MockFile(path, this.files));
      }
    }

    return [mockFiles, null, null];
  }

  async exists(): Promise<[boolean]> {
    return [true];
  }
}

export class MockFile {
  constructor(
    public name: string,
    private files: Map<string, Buffer>
  ) {}

  async exists(): Promise<[boolean]> {
    return [this.files.has(this.name)];
  }

  async download(): Promise<[Buffer]> {
    const content = this.files.get(this.name);
    if (!content) {
      throw { code: 404, message: 'File not found' };
    }
    return [content];
  }

  async save(content: Buffer | string): Promise<void> {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    this.files.set(this.name, buffer);
  }

  async delete(): Promise<void> {
    this.files.delete(this.name);
  }

  async getSignedUrl(): Promise<[string]> {
    return [`https://storage.googleapis.com/signed-url/${this.name}`];
  }

  async getMetadata(): Promise<[any]> {
    const content = this.files.get(this.name);
    return [{
      size: content ? String(content.length) : '0',
      contentType: 'application/octet-stream',
      timeCreated: new Date().toISOString(),
      md5Hash: 'mock-md5-hash',
      metadata: {}
    }];
  }
}

/**
 * Create a mock storage instance for testing
 */
export function createMockStorage(): MockStorage {
  return new MockStorage();
}

