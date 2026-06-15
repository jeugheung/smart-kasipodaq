export const MAIN_DOMAIN = 'kasipodaq.competence.kz/';
// export const API_SOLUTION_SATBAYEV = 'api.solution.satbayev.university';
// export const SATBAYEV_API = 'satbayev.university'

export const API_CONFIG = {
  // Новости
  // NEWS_API: `https://${MAIN_DOMAIN}/api/news?limit=10`,
  // NEWS_API: `https://${SATBAYEV_API}/api/news?limit=20`,
  NEWS_API: `https://${MAIN_DOMAIN}/api/news`,
  EVENTS_API: `https://${MAIN_DOMAIN}/api/events`,

  LIKE_DISLIKE_API: (category: string, targetType: string, uuid: string, solutionId: string | number, status: 'like' | 'dislike') =>
    `https://competence.kz/site/ajax-like?type=${category}&uuid=${uuid}&solution_id=${solutionId}&status=${status}&type=${targetType}`,

  FAVORITE_TOGGLE_API: (uuid: string, solutionId: string | number) => 
    `https://competence.kz/site/ajax-favorites?uuid=${uuid}&solution_id=${solutionId}`,

  MY_FAVORITES: (uuid: string, lang: string) =>
    `https://${MAIN_DOMAIN}/site/api-my-favorites?uuid=${uuid}&lang=${lang}`,

  CONTACTS_API: `https://${MAIN_DOMAIN}/api/contacts`,

  // Идеи
  IDEA_API_APPROVED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=idea&status=approved`,
  IDEA_API_FINISHED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=idea&status=finished`,
  IDEA_API: `https://${MAIN_DOMAIN}/api/last-solutions?type_name=idea`,
  IDEA_COUNT_API: `https://${MAIN_DOMAIN}/api/solutions-stat?type_name=idea&status=approved`,

  // Management / count
  MANAGEMENT_API_APPROVED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=org&status=approved`,
  MANAGEMENT_API_FINISHED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=org&status=finished`,
  MANAGEMENT_API: `https://${MAIN_DOMAIN}/api/last-solutions?type_name=org`,
  MANAGEMENT_COUNT_API: `https://${MAIN_DOMAIN}/api/solutions-stat?type_name=org&status=approved`,

  // Academic / count
  ACADEMIC_API_APPROVED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=academic&status=approved`,
  ACADEMIC_API_FINISHED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=academic&status=finished`,
  ACADEMIC_API: `https://${MAIN_DOMAIN}/api/last-solutions?type_name=academic`,
  ACADEMIC_COUNT_API: `https://${MAIN_DOMAIN}/api/solutions-stat?type_name=academic&status=approved`,

  // Service / count
  SERVICE_API_APPROVED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=inf&status=approved`,
  SERVICE_API_FINISHED: `https://${MAIN_DOMAIN}/site/apisolutions?type_name=inf&status=finished`,
  SERVICE_API: `https://${MAIN_DOMAIN}/api/last-solutions?type_name=inf`,
  SERVICE_COUNT_API: `https://${MAIN_DOMAIN}/api/solutions-stat?type_name=inf&status=approved`,

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