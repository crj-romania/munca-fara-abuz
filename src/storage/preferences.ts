import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = '@munca-fara-abuz/language';

export async function getSavedLanguage(): Promise<string | null> {
  return AsyncStorage.getItem(LANGUAGE_KEY);
}

export async function saveLanguage(languageCode: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
}

