import { Item } from "@fjell/types";

export interface Comment extends Item<'comment', 'post', 'user'> {
  text: string;
  authorId: string;
  rating: number;
  createdAt: Date;
}

export const sampleComments: Comment[] = [
  {
    kt: 'comment',
    pk: 'comment-1',
    loc: [
      { kt: 'user', lk: 'user-1' },
      { kt: 'post', lk: 'post-1' }
    ],
    text: 'Great article! Very helpful.',
    authorId: 'user-2',
    rating: 5,
    createdAt: new Date('2025-01-07')
  },
  {
    kt: 'comment',
    pk: 'comment-2',
    loc: [
      { kt: 'user', lk: 'user-1' },
      { kt: 'post', lk: 'post-1' }
    ],
    text: 'Thanks for sharing!',
    authorId: 'user-3',
    rating: 5,
    createdAt: new Date('2025-01-08')
  },
  {
    kt: 'comment',
    pk: 'comment-3',
    loc: [
      { kt: 'user', lk: 'user-2' },
      { kt: 'post', lk: 'post-3' }
    ],
    text: 'Could use more examples.',
    authorId: 'user-4',
    rating: 3,
    createdAt: new Date('2025-01-09')
  }
];

