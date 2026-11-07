import rawTranslations from './translations.json';

export type LanguageCode = 'en' | 'es' | 'zh' | 'ar' | 'hi' | 'ru' | 'el' | 'system';

export interface LanguageOption {
  code: LanguageCode;
  displayName: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', displayName: 'English', nativeName: 'English' },
  { code: 'es', displayName: 'Spanish', nativeName: 'Español' },
  { code: 'zh', displayName: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'ar', displayName: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', displayName: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ru', displayName: 'Russian', nativeName: 'Русский' },
  { code: 'el', displayName: 'Greek', nativeName: 'Ελληνικά' },
];

const STORAGE_LANG_KEY = 'mh_language_v1';

const translations = rawTranslations as Record<string, Record<string, string>>;

export function getStoredLanguage(): LanguageCode {
  const saved = localStorage.getItem(STORAGE_LANG_KEY) as LanguageCode;
  if (saved && (saved === 'system' || translations[saved])) {
    return saved;
  }
  return 'en';
}

export function saveStoredLanguage(lang: LanguageCode) {
  localStorage.setItem(STORAGE_LANG_KEY, lang);
}

export function translate(key: string, lang: LanguageCode = 'en', ...args: (string | number)[]): string {
  const activeLang = lang === 'system' ? 'en' : lang;
  let text = translations[activeLang]?.[key] || translations['en']?.[key] || key;

  // Replace %1$s, %2$s, %s, %d with args
  if (args.length > 0) {
    args.forEach((val, i) => {
      text = text.replace(new RegExp(`%${i + 1}\\$s`, 'g'), String(val));
      text = text.replace(new RegExp(`%${i + 1}\\$d`, 'g'), String(val));
      text = text.replace(/%s/, String(val));
      text = text.replace(/%d/, String(val));
    });
  }

  return text;
}
