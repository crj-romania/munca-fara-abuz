import { reloadAppAsync } from 'expo';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { I18nManager, Platform } from 'react-native';

import { loadBundledContent } from '@/src/content/bundledContent';
import {
  loadCachedContent,
  refreshRemoteContent,
  selectNewestLocalContent,
} from '@/src/content/contentCache';
import i18n, {
  initializeI18n,
  replaceI18nResources,
} from '@/src/i18n/i18n';
import { getSavedLanguage, saveLanguage } from '@/src/storage/preferences';
import type { ContentBundle, LanguageDefinition } from '@/src/types/content';

type ContentContextValue = {
  content: ContentBundle;
  selectedLanguage: string | null;
  currentLanguage: LanguageDefinition;
  applyLanguage: (languageCode: string) => Promise<boolean>;
};

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: PropsWithChildren) {
  const [content, setContent] = useState<ContentBundle | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const bundled = loadBundledContent();
      const [cached, savedLanguage] = await Promise.all([
        loadCachedContent(),
        getSavedLanguage(),
      ]);
      const initialContent = selectNewestLocalContent(bundled, cached);
      const savedLanguageIsAvailable = initialContent.index.languages.some(
        ({ code }) => code === savedLanguage,
      );
      const initialLanguage = savedLanguageIsAvailable ? savedLanguage : null;

      await initializeI18n(
        initialContent.strings,
        initialLanguage ?? 'en',
      );

      if (!active) {
        return;
      }
      setContent(initialContent);
      setSelectedLanguage(initialLanguage);

      const refreshed = await refreshRemoteContent(
        initialContent.index.contentVersion,
      );
      if (!active || !refreshed) {
        return;
      }

      replaceI18nResources(refreshed.strings);
      setContent(refreshed);
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const applyLanguage = useCallback(
    async (languageCode: string): Promise<boolean> => {
      if (!content) {
        return false;
      }

      const language = content.index.languages.find(
        ({ code }) => code === languageCode,
      );
      if (!language) {
        throw new Error('Unknown language.');
      }

      await i18n.changeLanguage(languageCode);
      await saveLanguage(languageCode);
      setSelectedLanguage(languageCode);

      // The web shim does not implement the native layout-direction APIs.
      // Web layout follows `currentLanguage.rtl` through component styles instead.
      const directionChanged =
        Platform.OS !== 'web' && I18nManager.isRTL !== language.rtl;
      if (directionChanged) {
        I18nManager.allowRTL(true);
        I18nManager.swapLeftAndRightInRTL(true);
        I18nManager.forceRTL(language.rtl);
        await reloadAppAsync('language-direction-changed');
      }

      return directionChanged;
    },
    [content],
  );

  const value = useMemo<ContentContextValue | null>(() => {
    if (!content) {
      return null;
    }
    const currentLanguage =
      content.index.languages.find(
        ({ code }) => code === (selectedLanguage ?? 'en'),
      ) ?? content.index.languages[0];

    if (!currentLanguage) {
      return null;
    }

    return {
      content,
      selectedLanguage,
      currentLanguage,
      applyLanguage,
    };
  }, [applyLanguage, content, selectedLanguage]);

  if (!value) {
    return null;
  }

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
}

export function useContent(): ContentContextValue {
  const value = useContext(ContentContext);
  if (!value) {
    throw new Error('useContent must be used inside ContentProvider.');
  }
  return value;
}
