import { LanguageAbbreviation } from '@/constants/common';
import storage from '@/utils/authorization-util';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-tw';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translation_en from './en';
import translation_zh from './zh-traditional';

export const supportedLanguages = [
  {
    code: LanguageAbbreviation.ZhTraditional,
    locale: new Intl.Locale('zh-Hant'),
    displayName: '繁體中文',
  },
  {
    code: LanguageAbbreviation.En,
    locale: new Intl.Locale('en'),
    displayName: 'English',
  },
];

export const DEFAULT_LANGUAGE_CODE = LanguageAbbreviation.ZhTraditional;

export function normalizeLanguage(lng: string): LanguageAbbreviation {
  return supportedLanguages.some(({ code }) => code === lng)
    ? (lng as LanguageAbbreviation)
    : DEFAULT_LANGUAGE_CODE;
}

i18n.use(initReactI18next).init({
  lng: normalizeLanguage(storage.getLanguage() || DEFAULT_LANGUAGE_CODE),
  supportedLngs: supportedLanguages.map(({ code }) => code),
  resources: {
    [LanguageAbbreviation.En]: translation_en,
    [LanguageAbbreviation.ZhTraditional]: translation_zh,
  },
  fallbackLng: LanguageAbbreviation.En,
  interpolation: { escapeValue: false },
});

export const changeLanguageAsync = async (
  lng: string,
  options: { persist?: boolean } = {},
): Promise<void> => {
  const normalizedLng = normalizeLanguage(lng);
  if (options.persist !== false) storage.setLanguage(normalizedLng);
  document.documentElement.lang = normalizedLng;
  document.documentElement.dir = 'ltr';
  dayjs.locale(
    normalizedLng === LanguageAbbreviation.ZhTraditional ? 'zh-tw' : 'en',
  );
  await i18n.changeLanguage(normalizedLng);
};

export const initLanguage = async (): Promise<void> => {
  await changeLanguageAsync(storage.getLanguage() || DEFAULT_LANGUAGE_CODE);
};

export default i18n;
