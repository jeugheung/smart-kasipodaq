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

// Нарушение ТК
export const getViolationSolutions = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.VIOLATION_API);
  return Array.isArray(response.solutions) ? response.solutions : [];
};

export const getViolationApproved = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.VIOLATION_API_APPROVED);
  return Array.isArray(response.data?.solutions) ? response.data.solutions : [];
};

export const getViolationFinished = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.VIOLATION_API_FINISHED);
  return Array.isArray(response.data?.solutions) ? response.data.solutions : [];
};

export const getViolationCount = async (): Promise<number> => {
  const response = await apiClient<any>(API_CONFIG.VIOLATION_COUNT_API);
  return typeof response.count === 'number' ? response.count : 0;
};

// Условия труда
export const getWorkSolutions = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.WORK_API);
  return Array.isArray(response.solutions) ? response.solutions : [];
};

export const getWorkApproved = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.WORK_API_APPROVED);
  return Array.isArray(response.data?.solutions) ? response.data.solutions : [];
};

export const getWorkFinished = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.WORK_API_FINISHED);
  return Array.isArray(response.data?.solutions) ? response.data.solutions : [];
};

export const getWorkCount = async (): Promise<number> => {
  const response = await apiClient<any>(API_CONFIG.WORK_COUNT_API);
  return typeof response.count === 'number' ? response.count : 0;
};

// Оплата труда
export const getSalarySolutions = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.SALARY_API);
  return Array.isArray(response.solutions) ? response.solutions : [];
};

export const getSalaryApproved = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.SALARY_API_APPROVED);
  return Array.isArray(response.data?.solutions) ? response.data.solutions : [];
};

export const getSalaryFinished = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.SALARY_API_FINISHED);
  return Array.isArray(response.data?.solutions) ? response.data.solutions : [];
};

export const getSalaryCount = async (): Promise<number> => {
  const response = await apiClient<any>(API_CONFIG.SALARY_COUNT_API);
  return typeof response.count === 'number' ? response.count : 0;
};

// Социальные льготы
export const getSocialSolutions = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.SOCIAL_API);
  return Array.isArray(response.solutions) ? response.solutions : [];
};

export const getSocialApproved = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.SOCIAL_API_APPROVED);
  return Array.isArray(response.data?.solutions) ? response.data.solutions : [];
};

export const getSocialFinished = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.SOCIAL_API_FINISHED);
  return Array.isArray(response.data?.solutions) ? response.data.solutions : [];
};

export const getSocialCount = async (): Promise<number> => {
  const response = await apiClient<any>(API_CONFIG.SOCIAL_COUNT_API);
  return typeof response.count === 'number' ? response.count : 0;
};

// Предложения по коллективному договору
export const getCollectiveSolutions = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.COLLECTIVE_API);
  return Array.isArray(response.solutions) ? response.solutions : [];
};

export const getCollectiveApproved = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.COLLECTIVE_API_APPROVED);
  return Array.isArray(response.data?.solutions) ? response.data.solutions : [];
};

export const getCollectiveFinished = async (): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.COLLECTIVE_API_FINISHED);
  return Array.isArray(response.data?.solutions) ? response.data.solutions : [];
};

export const getCollectiveCount = async (): Promise<number> => {
  const response = await apiClient<any>(API_CONFIG.COLLECTIVE_COUNT_API);
  return typeof response.count === 'number' ? response.count : 0;
};

export const getAppVersion = async (): Promise<string> => {
  const url = API_CONFIG.VERSION_API;
  console.log("🔍 [VERSION-CHECK] Стучимся по адресу:", url);

  try {
    // Используем обычный fetch, чтобы прочитать ответ как ТЕКСТ
    const response = await fetch(url);
    const contentType = response.headers.get("content-type");
    
    console.log("📡 [VERSION-CHECK] Статус ответа:", response.status);
    console.log("📄 [VERSION-CHECK] Тип контента:", contentType);

    const rawText = await response.text();

    // Если ответ начинается с < — это HTML (ошибка сервера)
    if (rawText.trim().startsWith('<')) {
      console.error("🛑 [CRITICAL] Сервер вернул HTML вместо JSON!");
      console.log("📋 [HTML-CONTENT]:", rawText.substring(0, 500)); // Печатаем первые 500 символов ошибки
      return '';
    }

    const data = JSON.parse(rawText);
    console.log("✅ [VERSION-CHECK] Успешно получено:", data);
    return data.version || '';
    
  } catch (e: any) {
    console.error('❌ [VERSION-CHECK] Ошибка парсинга или сети:', e.message);
    return ''; 
  }
};

export const getMySolutions = async (uuid: string): Promise<any[]> => {
  const response = await apiClient<any>(API_CONFIG.MY_SOLUTIONS(uuid));

  // Проверяем, что есть data.solutions
  if (response.success && Array.isArray(response.data?.solutions)) {
    return response.data.solutions;
  }

  return [];
};


export const sendFavorites = async (favourites: number[] | string[]) => {
  try {
    const response = await apiClient(API_CONFIG.FAVORITE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ favourites }),
    });
    return response;
  } catch (e) {
    console.error('Ошибка при отправке избранного', e);
    throw e;
  }
}

export const toggleFavoriteApi = async (uuid: string, solutionId: string | number) => {
  try {
    const url = API_CONFIG.FAVORITE_TOGGLE_API(uuid, solutionId);
    const response = await apiClient<any>(url, {
      method: 'GET',
    });
    return response;
  } catch (e) {
    console.error('Ошибка при добавлении в избранное API', e);
    throw e;
  }
};

export const getMyFavoritesList = async (uuid: string, lang: string): Promise<any[]> => {
  try {
    const url = API_CONFIG.MY_FAVORITES(uuid, lang);
    const response = await apiClient<any>(url, { method: 'GET' });

    // В зависимости от того, как именно бэк отдает JSON, 
    // скорее всего это response.data.solutions (как в других твоих апишках)
    if (response.success && Array.isArray(response.data?.solutions)) {
      return response.data.solutions;
    }
    
    // Фолбэк на случай, если массив лежит прямо в корне
    if (Array.isArray(response)) {
      return response;
    }

    return [];
  } catch (error) {
    console.error('Ошибка при загрузке списка избранного с сервера:', error);
    return [];
  }
};

export const sendLikeDislike = async (
  category: string,   // 'idea', 'org', etc.
  targetType: string, // 'solution', 'comment', etc.
  uuid: string,
  id: string | number,
  status: 'like' | 'dislike'
) => {
  try {
    const url = API_CONFIG.LIKE_DISLIKE_API(category, targetType, uuid, id, status);
    
    // Если бэкенд на PHP (Yii/Laravel), они часто используют GET для таких аяксов,
    // но если перешли на POST — просто поменяй метод здесь.
    const response = await apiClient<any>(url, {
      method: 'POST', 
    });
    return response;
  } catch (e) {
    console.error(`❌ Ошибка при отправке ${status} для ${targetType}`, e);
    throw e;
  }
};