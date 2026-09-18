// i18n/config.ts
export const defaultLocale = "fr";
export const supportedLocales = ["fr", "en", "es", "de", "it", "pt"] as const;
export type Locale = (typeof supportedLocales)[number];
