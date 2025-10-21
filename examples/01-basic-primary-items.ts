/**
 * Example 1: Basic CRUD operations with primary items
 *
 * This example demonstrates:
 * - Creating a primary item library
 * - Creating, reading, updating, and deleting items
 * - Listing all items
 */

import { createPrimaryGCSLibrary } from '../src/primary/GCSLibrary';
import { Storage } from '@google-cloud/storage';
import { Item } from '@fjell/core';

interface User extends Item<'user'> {
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

async function main() {
  // Initialize GCS Storage
  const storage = new Storage({
    projectId: 'my-project',
    // keyFilename: '/path/to/credentials.json' // Optional
  });

  // Create library for User items
  const userLib = createPrimaryGCSLibrary<User, 'user'>(
    'user',           // Key type
    'users',          // Directory name in bucket
    'my-app-bucket',  // Bucket name
    storage
  );

  console.log('Example 1: Basic CRUD Operations\n');

  // CREATE
  console.log('1. Creating user...');
  const user = await userLib.operations.create({
    name: 'Alice Johnson',
    email: 'alice@example.com',
    status: 'active'
  });
  console.log(`   Created user: ${user.pk}`);
  console.log(`   Name: ${user.name}\n`);

  // GET
  console.log('2. Getting user...');
  const found = await userLib.operations.get({
    kt: 'user',
    pk: user.pk
  });
  console.log(`   Found: ${found?.name}\n`);

  // UPDATE
  console.log('3. Updating user...');
  const updated = await userLib.operations.update(
    { kt: 'user', pk: user.pk },
    { name: 'Alice Smith' }
  );
  console.log(`   Updated name: ${updated.name}\n`);

  // UPSERT (update or create)
  console.log('4. Upserting user...');
  const upserted = await userLib.operations.upsert(
    { kt: 'user', pk: 'user-123' },
    { name: 'Bob Wilson', email: 'bob@example.com', status: 'active' }
  );
  console.log(`   Upserted: ${upserted.name}\n`);

  // LIST ALL
  console.log('5. Listing all users...');
  const allUsers = await userLib.operations.all();
  console.log(`   Total users: ${allUsers.length}\n`);

  // REMOVE
  console.log('6. Removing user...');
  const removed = await userLib.operations.remove({
    kt: 'user',
    pk: user.pk
  });
  console.log(`   Removed: ${removed?.name}\n`);

  console.log('Example complete!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };

