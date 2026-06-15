import { API_CONFIG } from './config';
import { apiClient } from './client';

export type AddSolutionPayload = {
  type_name: string;

  solution: string;
  uuid: string;
  phone?: string;
  files?: any[];
};

export const addSolution = async (payload: AddSolutionPayload) => {
  return apiClient(API_CONFIG.ADD_SOLUTION_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
};
