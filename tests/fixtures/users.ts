import { Item } from '@fjell/core';

export interface User extends Item<'user'> {
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  score: number;
}

export const sampleUsers: User[] = [
  {
    kt: 'user',
    pk: 'user-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    status: 'active',
    createdAt: new Date('2025-01-01'),
    score: 95
  },
  {
    kt: 'user',
    pk: 'user-2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    status: 'active',
    createdAt: new Date('2025-01-02'),
    score: 85
  },
  {
    kt: 'user',
    pk: 'user-3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    status: 'inactive',
    createdAt: new Date('2025-01-03'),
    score: 60
  },
  {
    kt: 'user',
    pk: 'user-4',
    name: 'Diana Prince',
    email: 'diana@example.com',
    status: 'pending',
    createdAt: new Date('2025-01-04'),
    score: 75
  }
];

