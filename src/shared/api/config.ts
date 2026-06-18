export const MAIN_DOMAIN = 'kasipodaq.competence.kz';
// export const API_SOLUTION_SATBAYEV = 'api.solution.satbayev.university';
// export const SATBAYEV_API = 'satbayev.university'

export const API_CONFIG = {
  // Новости
  NEWS_API: `https://${MAIN_DOMAIN}/api/news`,

  LIKE_DISLIKE_API: (category: string, targetType: string, uuid: string, solutionId: string | number, status: 'like' | 'dislike') =>
    `https://competence.kz/site/ajax-like?type=${category}&uuid=${uuid}&solution_id=${solutionId}&status=${status}&type=${targetType}`,

  FAVORITE_TOGGLE_API: (uuid: string, solutionId: string | number) => 
    `https://competence.kz/site/ajax-favorites?uuid=${uuid}&solution_id=${solutionId}`,

  MY_FAVORITES: (uuid: string, lang: string) =>
    `https://${MAIN_DOMAIN}/site/api-my-favorites?uuid=${uuid}&lang=${lang}`,

  CONTACTS_API: `https://${MAIN_DOMAIN}/api/contacts`,

  // Нарушение ТК
  VIOLATION_API_APPROVED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=violation&status=approved`,
  VIOLATION_API_FINISHED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=violation&status=finished`,
  VIOLATION_API: `https://${MAIN_DOMAIN}/api/last-solutions?type_name=violation`,
  VIOLATION_COUNT_API: `https://${MAIN_DOMAIN}/api/solutions-stat?type_name=violation&status=approved`,

  // 	Условия труда
  WORK_API_APPROVED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=work&status=approved`,
  WORK_API_FINISHED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=work&status=finished`,
  WORK_API: `https://${MAIN_DOMAIN}/api/last-solutions?type_name=work`,
  WORK_COUNT_API: `https://${MAIN_DOMAIN}/api/solutions-stat?type_name=work&status=approved`,

  // 	Оплата труда
  SALARY_API_APPROVED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=salary&status=approved`,
  SALARY_API_FINISHED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=salary&status=finished`,
  SALARY_API: `https://${MAIN_DOMAIN}/api/last-solutions?type_name=salary`,
  SALARY_COUNT_API: `https://${MAIN_DOMAIN}/api/solutions-stat?type_name=salary&status=approved`,

  // Социальные льготы
  SOCIAL_API_APPROVED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=social&status=approved`,
  SOCIAL_API_FINISHED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=social&status=finished`,
  SOCIAL_API: `https://${MAIN_DOMAIN}/api/last-solutions?type_name=social`,
  SOCIAL_COUNT_API: `https://${MAIN_DOMAIN}/api/solutions-stat?type_name=social&status=approved`,

   // 	Предложения по коллективному договору
  COLLECTIVE_API_APPROVED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=collective&status=approved`,
  COLLECTIVE_API_FINISHED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=collective&status=finished`,
  COLLECTIVE_API: `https://${MAIN_DOMAIN}/api/last-solutions?type_name=collective`,
  COLLECTIVE_COUNT_API: `https://${MAIN_DOMAIN}/api/solutions-stat?type_name=collective&status=approved`,

  // Справочник
  DIRECTORY_API: `https://${MAIN_DOMAIN}/api/dep`,

  // Отправка
  UPLOAD_FILES_API: `https://${MAIN_DOMAIN}/upload`,
  ADD_SOLUTION_API: `https://${MAIN_DOMAIN}/api/add-solution`,
   // UUID-зависимый API
  MY_SOLUTIONS: (uuid: string) =>
    `https://${MAIN_DOMAIN}/site/api-my-solutions?uuid=${uuid}`,

  FAVORITE_API: `https://${MAIN_DOMAIN}/site/favor`,

  MAPS_API: `https://${MAIN_DOMAIN}/api/buildings`,

  // Version
  VERSION_API: `https://${MAIN_DOMAIN}/api/version`
};