import { API_CONFIG } from './config';
import { apiClient } from './client';

export type AddSolutionPayload = {
  type_name: string;

  solution: string;
  uuid: string;
  phone?: string;
  files?: any[];
};

export const getNews = async (page = 1): Promise<any[]> => {
  const url = `${API_CONFIG.NEWS_API}?page=${page}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    // 1. ПОЛУЧАЕМ ТЕКСТ
    const text = await response.text();

    // 2. ВЫВОДИМ ЕГО В КОНСОЛЬ (ПЕРВЫЕ 2000 СИМВОЛОВ)
    console.log("------------------------------------------");
    console.warn("🔍 ВОТ ЧТО ПРИСЛАЛ СЕРВЕР НА САМОМ ДЕЛЕ:");
    console.log(text.substring(0, 2000)); 
    console.log("------------------------------------------");

    // 3. ТОЛЬКО ТЕПЕРЬ ПЫТАЕМСЯ ПАРСИТЬ
    try {
      const data = JSON.parse(text);
      return Array.isArray(data.news) ? data.news : [];
    } catch (parseError) {
      console.error("❌ Ошибка при попытке прочитать этот текст как JSON");
      return [];
    }

  } catch (networkError) {
    console.error("❌ Ошибка сети:", networkError);
    return [];
  }
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
