/**
 * Example 2: Working with contained items
 *
 * This example demonstrates:
 * - Creating contained item libraries
 * - Working with location hierarchies
 * - Listing items within specific locations
 */

import { createPrimaryGCSLibrary } from '../src/primary/GCSLibrary';
import { createContainedGCSLibrary } from '../src/contained/GCSLibrary';
import { Storage } from '@google-cloud/storage';
import { Item } from '@fjell/core';

interface Post extends Item<'post'> {
  title: string;
  content: string;
}

interface Comment extends Item<'comment', 'post'> {
  text: string;
  author: string;
  rating: number;
}

async function main() {
  const storage = new Storage({ projectId: 'my-project' });

  // Create library for posts
  const postLib = createPrimaryGCSLibrary<Post, 'post'>(
    'post',
    'posts',
    'my-blog-bucket',
    storage
  );

  // Create library for comments (contained in posts)
  const commentLib = createContainedGCSLibrary<Comment, 'comment', 'post'>(
    'comment',                    // Item key type
    'post',                       // Parent key type
    ['comments', 'posts'],        // Directory paths
    'my-blog-bucket',
    storage
  );

  console.log('Example 2: Contained Items\n');

  // Step 1: Create a post
  console.log('1. Creating post...');
  const post = await postLib.operations.create({
    title: 'Getting Started with GCS',
    content: 'This is a guide to using Google Cloud Storage...'
  });
  console.log(`   Created post: ${post.pk}\n`);

  // Step 2: Create comments on the post
  console.log('2. Creating comments...');
  
  const comment1 = await commentLib.operations.create(
    {
      text: 'Great article!',
      author: 'Bob',
      rating: 5
    },
    {
      locations: [{ kt: 'post', lk: post.pk }]
    }
  );
  console.log(`   Created comment 1: ${comment1.pk}`);

  const comment2 = await commentLib.operations.create(
    {
      text: 'Very helpful, thanks!',
      author: 'Charlie',
      rating: 5
    },
    {
      locations: [{ kt: 'post', lk: post.pk }]
    }
  );
  console.log(`   Created comment 2: ${comment2.pk}\n`);

  // Step 3: List all comments on the post
  console.log('3. Listing comments on post...');
  const postComments = await commentLib.operations.all(
    {},
    [{ kt: 'post', lk: post.pk }]  // Filter by location
  );
  console.log(`   Found ${postComments.length} comments\n`);

  // Step 4: Get a specific comment
  console.log('4. Getting specific comment...');
  const retrieved = await commentLib.operations.get({
    kt: 'comment',
    pk: comment1.pk,
    loc: [{ kt: 'post', lk: post.pk }]
  });
  console.log(`   Retrieved: "${retrieved?.text}"\n`);

  // Step 5: Update a comment
  console.log('5. Updating comment...');
  const updated = await commentLib.operations.update(
    {
      kt: 'comment',
      pk: comment1.pk,
      loc: [{ kt: 'post', lk: post.pk }]
    },
    { rating: 4 }
  );
  console.log(`   Updated rating: ${updated.rating}\n`);

  console.log('Example complete!');
  console.log('\nStorage structure:');
  console.log(`  Post:      gs://my-blog-bucket/post/${post.pk}.json`);
  console.log(`  Comment 1: gs://my-blog-bucket/post/${post.pk}/comment/${comment1.pk}.json`);
  console.log(`  Comment 2: gs://my-blog-bucket/post/${post.pk}/comment/${comment2.pk}.json`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };

