import Constants from 'expo-constants';

// Which EAS build profile produced this binary: development, preview (the test
// APK) or production (Google Play). Every build except production is a test
// build and shows the TEST banner.
export const APP_ENV = (process.env.EXPO_PUBLIC_APP_ENV ?? '').trim() || 'development';
export const IS_TEST_BUILD = APP_ENV !== 'production';

export const APP_VERSION = Constants.expoConfig?.version ?? '';
// Shown in Settings, e.g. "0.2.0" in production and "0.2.0 (preview)" in test builds.
export const APP_VERSION_LABEL = IS_TEST_BUILD && APP_VERSION ? `${APP_VERSION} (${APP_ENV})` : APP_VERSION;

function httpsUrl(value: string | undefined): string {
  const url = (value ?? '').trim();
  return /^https:\/\/[^\s<>]+$/i.test(url) ? url : '';
}

// Feedback link for testers (a form or a WhatsApp group), only in test builds.
export const FEEDBACK_URL = IS_TEST_BUILD ? httpsUrl(process.env.EXPO_PUBLIC_FEEDBACK_URL) : '';
