import { useTranslation } from 'react-i18next';

export type AppLanguage = 'ru' | 'en' | 'kk';

export const useChangeLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: AppLanguage) => {
    i18n.changeLanguage(lang);
  };

  return {
    language: (i18n.resolvedLanguage || i18n.language || 'ru') as AppLanguage,
    changeLanguage,
  };
};