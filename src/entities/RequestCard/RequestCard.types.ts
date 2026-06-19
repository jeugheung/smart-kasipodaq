export type RequestStatus = 'pending' | 'resolved';

export type RequestType =
  | 'violation'
  | 'work'
  | 'salary'
  | 'social'
  | 'collective';

export type UserVote = 'like' | 'dislike' | null;

export type RequestItem = {
  updated_at: any;
  comment: any;
  solution: string;
  created_at: any;
  id: string;
  problem: string;
  // description: string;
  status: RequestStatus;
  type: RequestType;
  solution_likes: number
  solution_dislikes: number
  
  comment_likes: number
  comment_dislikes: number
};