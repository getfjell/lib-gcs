/**
 * Example 5: Working with File Attachments
 *
 * This example demonstrates:
 * - Uploading files to items
 * - Downloading files
 * - Listing files by label
 * - Generating signed URLs for direct browser access
 * - Deleting files
 * - Managing file metadata
 */

import { createPrimaryGCSLibrary } from '../src/primary/GCSLibrary';
import { Storage } from '@google-cloud/storage';
import { Item } from '@fjell/core';

interface Recording extends Item<'recording'> {
  title: string;
  artist: string;
  duration: number;
  files?: {
    [label: string]: Array<{
      name: string;
      size: number;
      contentType: string;
      uploadedAt: Date;
      checksum?: string;
    }>;
  };
}

async function main() {
  // Initialize GCS Storage
  const storage = new Storage({
    projectId: 'my-project',
    // keyFilename: '/path/to/credentials.json' // Optional
  });

  // Create library for Recording items
  const recordingLib = createPrimaryGCSLibrary<Recording, 'recording'>(
    'recording',
    'recordings',
    'my-audio-bucket',
    storage,
    {
      // File configuration options
      files: {
        directory: '_files',           // Directory name for files (default: '_files')
        maxFileSize: 100 * 1024 * 1024, // 100MB limit
        allowedContentTypes: [
          'audio/*',                    // Any audio type
          'image/*',                    // Any image type
          'application/pdf'             // PDFs for liner notes
        ],
        includeMetadataInItem: true,   // Store file metadata in item JSON
        computeChecksums: true         // Compute MD5 checksums for integrity
      }
    }
  );

  console.log('Example 5: File Attachments\n');

  // ============================================================================
  // Step 1: Create a recording item
  // ============================================================================
  console.log('1. Creating recording item...');
  const recording = await recordingLib.operations.create({
    title: 'Symphony No. 5',
    artist: 'Orchestra',
    duration: 3600 // seconds
  }, {
    key: { kt: 'recording', pk: 'rec-beethoven-5' }
  });
  console.log(`   Created: ${recording.title} (${recording.pk})\n`);

  // ============================================================================
  // Step 2: Upload files with different labels
  // ============================================================================
  console.log('2. Uploading audio files...');

  // Upload master audio file
  const masterAudio = Buffer.from('...master audio data...'); // Simulated
  const masterFile = await recordingLib.files.uploadFile(
    { kt: 'recording', pk: recording.pk },
    'master',                          // Label for organization
    '0.wav',                           // Filename
    masterAudio,
    {
      contentType: 'audio/wav',
      metadata: {
        bitrate: '1411kbps',
        sampleRate: '44.1kHz',
        channels: '2'
      }
    }
  );
  console.log(`   Uploaded master: ${masterFile.name} (${masterFile.size} bytes)`);

  // Upload final mixed audio
  const finalAudio = Buffer.from('...final audio data...'); // Simulated
  const finalFile = await recordingLib.files.uploadFile(
    { kt: 'recording', pk: recording.pk },
    'final',
    'output.mp3',
    finalAudio,
    {
      contentType: 'audio/mpeg',
      metadata: {
        bitrate: '320kbps',
        encoder: 'LAME 3.100'
      }
    }
  );
  console.log(`   Uploaded final: ${finalFile.name} (${finalFile.size} bytes)`);

  // Upload album cover
  const coverImage = Buffer.from('...image data...'); // Simulated
  const coverFile = await recordingLib.files.uploadFile(
    { kt: 'recording', pk: recording.pk },
    'artwork',
    'cover.jpg',
    coverImage,
    {
      contentType: 'image/jpeg',
      metadata: {
        dimensions: '3000x3000',
        dpi: '300'
      }
    }
  );
  console.log(`   Uploaded artwork: ${coverFile.name} (${coverFile.size} bytes)\n`);

  // ============================================================================
  // Step 3: List all files for the recording
  // ============================================================================
  console.log('3. Listing all files...');
  const allFiles = await recordingLib.files.listFiles({
    kt: 'recording',
    pk: recording.pk
  });
  console.log(`   Found ${allFiles.length} total files:`);
  allFiles.forEach(file => {
    console.log(`   - [${file.label}] ${file.name} (${file.contentType}, ${file.size} bytes)`);
  });
  console.log();

  // ============================================================================
  // Step 4: List files by specific label
  // ============================================================================
  console.log('4. Listing files by label...');
  const masterFiles = await recordingLib.files.listFiles(
    { kt: 'recording', pk: recording.pk },
    'master'  // Only list "master" files
  );
  console.log(`   Master files (${masterFiles.length}):`);
  masterFiles.forEach(file => {
    console.log(`   - ${file.name}`);
    console.log(`     Uploaded: ${file.uploadedAt.toISOString()}`);
    console.log(`     Checksum: ${file.checksum}`);
  });
  console.log();

  // ============================================================================
  // Step 5: Download a file
  // ============================================================================
  console.log('5. Downloading file...');
  const downloadedContent = await recordingLib.files.downloadFile(
    { kt: 'recording', pk: recording.pk },
    'final',
    'output.mp3'
  );
  console.log(`   Downloaded: ${downloadedContent.length} bytes\n`);

  // ============================================================================
  // Step 6: Generate signed URL for direct browser access
  // ============================================================================
  console.log('6. Generating signed URL...');
  const signedUrl = await recordingLib.files.getSignedUrl(
    { kt: 'recording', pk: recording.pk },
    'final',
    'output.mp3',
    {
      expirationSeconds: 3600,        // Valid for 1 hour
      action: 'read',                  // read, write, or delete
      responseContentType: 'audio/mpeg',
      contentDisposition: 'attachment; filename="symphony-5.mp3"'
    }
  );
  console.log(`   Signed URL (expires in 1 hour):`);
  console.log(`   ${signedUrl.substring(0, 80)}...\n`);

  // ============================================================================
  // Step 7: Check item metadata
  // ============================================================================
  console.log('7. Checking item metadata...');
  const updatedRecording = await recordingLib.operations.get({
    kt: 'recording',
    pk: recording.pk
  });
  console.log(`   Files metadata stored in item:`);
  if (updatedRecording?.files) {
    Object.entries(updatedRecording.files).forEach(([label, files]) => {
      console.log(`   - ${label}: ${files.length} file(s)`);
    });
  }
  console.log();

  // ============================================================================
  // Step 8: Delete a file
  // ============================================================================
  console.log('8. Deleting file...');
  await recordingLib.files.deleteFile(
    { kt: 'recording', pk: recording.pk },
    'master',
    '0.wav'
  );
  console.log(`   Deleted: master/0.wav\n`);

  // ============================================================================
  // Step 9: Verify deletion
  // ============================================================================
  console.log('9. Verifying deletion...');
  const remainingFiles = await recordingLib.files.listFiles(
    { kt: 'recording', pk: recording.pk }
  );
  console.log(`   Remaining files: ${remainingFiles.length}`);
  remainingFiles.forEach(file => {
    console.log(`   - [${file.label}] ${file.name}`);
  });
  console.log();

  // ============================================================================
  // Storage Structure
  // ============================================================================
  console.log('Storage structure in GCS:');
  console.log(`  Item JSON:  gs://my-audio-bucket/recording/${recording.pk}.json`);
  console.log(`  Files:`);
  console.log(`    - gs://my-audio-bucket/recording/${recording.pk}/_files/master/0.wav (deleted)`);
  console.log(`    - gs://my-audio-bucket/recording/${recording.pk}/_files/final/output.mp3`);
  console.log(`    - gs://my-audio-bucket/recording/${recording.pk}/_files/artwork/cover.jpg`);
  console.log();

  console.log('Example complete!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };

