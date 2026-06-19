export type RequestStatus = 'pending' | 'resolved';

export type RequestType =
  | 'violation'
  | 'work'
  | 'salary'
  | 'social'
  | 'collective';

export type UserVote = 'like' | 'dislike' | null;

export interface RequestItem {
  id: string;
  tag: string;
  date: string;
  problem: string;
  solution: string;
  comment?: string;
  status: RequestStatus;
  likes: number;
  dislikes: number;
  userVote: UserVote;
}