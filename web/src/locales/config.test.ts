import dayjs from 'dayjs';
import i18n, {
  changeLanguageAsync,
  initLanguage,
  supportedLanguages,
} from './config';

beforeEach(() => localStorage.clear());

it('offers only Traditional Chinese and English', () => {
  expect(supportedLanguages.map(({ code }) => code)).toEqual(['zh-Hant', 'en']);
});

it('replaces a removed saved locale and updates document and date formatting', async () => {
  localStorage.setItem('lng', 'ar');
  await initLanguage();
  expect(i18n.language).toBe('zh-Hant');
  expect(localStorage.getItem('lng')).toBe('zh-Hant');
  expect(document.documentElement.lang).toBe('zh-Hant');
  expect(document.documentElement.dir).toBe('ltr');
  expect(dayjs.locale()).toBe('zh-tw');
});

it('supports temporary embedded English without overwriting the saved preference', async () => {
  await changeLanguageAsync('zh-Hant');
  await changeLanguageAsync('en', { persist: false });
  expect(i18n.language).toBe('en');
  expect(document.documentElement.lang).toBe('en');
  expect(dayjs.locale()).toBe('en');
  expect(localStorage.getItem('lng')).toBe('zh-Hant');
});

it('falls back to English for untranslated Traditional Chinese keys', async () => {
  await changeLanguageAsync('zh-Hant');
  expect(i18n.t('admin.loginTitle')).toBe('Admin console');
});
