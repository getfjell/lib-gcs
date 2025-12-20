import { Item } from "@fjell/types";

export interface Post extends Item<'post', 'user'> {
  title: string;
  content: string;
  authorId: string;
  status: 'draft' | 'published';
  views: number;
  likes: number;
  publishedAt?: Date;
}

export const samplePosts: Post[] = [
  {
    kt: 'post',
    pk: 'post-1',
    loc: [{ kt: 'user', lk: 'user-1' }],
    title: 'Getting Started with GCS',
    content: 'Learn how to use Google Cloud Storage effectively...',
    authorId: 'user-1',
    status: 'published',
    views: 150,
    likes: 25,
    publishedAt: new Date('2025-01-05')
  },
  {
    kt: 'post',
    pk: 'post-2',
    loc: [{ kt: 'user', lk: 'user-1' }],
    title: 'Advanced GCS Patterns',
    content: 'Explore advanced patterns for cloud storage...',
    authorId: 'user-1',
    status: 'draft',
    views: 0,
    likes: 0
  },
  {
    kt: 'post',
    pk: 'post-3',
    loc: [{ kt: 'user', lk: 'user-2' }],
    title: 'Building Scalable Apps',
    content: 'How to build scalable applications with GCS...',
    authorId: 'user-2',
    status: 'published',
    views: 300,
    likes: 45,
    publishedAt: new Date('2025-01-06')
  }
];

