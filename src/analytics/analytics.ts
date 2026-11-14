import Aptabase, { trackEvent } from '@aptabase/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { APP_ENV, APP_VERSION, IS_TEST_BUILD } from '@/src/config/build';

// Anonymous usage statistics (Aptabase, EU region), only after explicit consent.
// Never send names, field values, free text, document data, the residence
// situation or anything else that could identify a person: every event and
// property below is a fixed identifier chosen by the app, not typed by the user.

const APP_KEY = (process.env.EXPO_PUBLIC_APTABASE_APP_KEY ?? '').trim();
const CONSENT_KEY = '@munca-fara-abuz/analytics-consent';
// Test builds report e.g. "0.2.0-preview", so their events can be filtered out
// of the real usage figures in the Aptabase dashboard.
const ANALYTICS_APP_VERSION = IS_TEST_BUILD && APP_VERSION ? `${APP_VERSION}-${APP_ENV}` : APP_VERSION;

export type AnalyticsConsent = 'granted' | 'denied' | 'unset';

type AnalyticsEvents = {
  app_open: undefined;
  language_selected: { lang: string };
  info_item_viewed: { categoryId: string; itemId: string };
  complaint_started: { categoryId: string };
  complaint_generated: { categoryId: string; action: 'email' | 'saved'; mode: 'test' | 'live' };
  mt_used: { engine: 'mlkit' | 'manual' };
  emergency_opened: undefined;
  emergency_call: { contactId: string };
  contact_opened: undefined;
  data_deleted: undefined;
};

let consent: AnalyticsConsent = 'unset';
let loaded = false;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

// The statistics option exists only in builds that have an Aptabase key, and
// never on web (the web build is used only for previews).
export const analyticsAvailable = /^A-(EU|US|SH)-[A-Za-z0-9-]+$/.test(APP_KEY) && Platform.OS !== 'web';

function ensureInitialized() {
  if (initialized || !analyticsAvailable || consent !== 'granted') return;
  try {
    Aptabase.init(APP_KEY, ANALYTICS_APP_VERSION ? { appVersion: ANALYTICS_APP_VERSION } : undefined);
    initialized = true;
  } catch {
    // Statistics must never break the app.
  }
}

export async function loadAnalyticsConsent(): Promise<AnalyticsConsent> {
  if (!loaded) {
    try {
      const stored = await AsyncStorage.getItem(CONSENT_KEY);
      consent = stored === 'granted' || stored === 'denied' ? stored : 'unset';
    } catch {
      consent = 'unset';
    }
    loaded = true;
    ensureInitialized();
    emit();
  }
  return consent;
}

export async function setAnalyticsConsent(value: 'granted' | 'denied'): Promise<void> {
  consent = value;
  loaded = true;
  emit();
  ensureInitialized();
  try {
    await AsyncStorage.setItem(CONSENT_KEY, value);
  } catch {
    // The in-memory choice still applies for this session.
  }
}

export function track<E extends keyof AnalyticsEvents>(
  event: E,
  ...props: AnalyticsEvents[E] extends undefined ? [] : [AnalyticsEvents[E]]
): void {
  if (!analyticsAvailable || consent !== 'granted' || !initialized) return;
  try {
    void trackEvent(event, props[0] as Record<string, string | number | boolean> | undefined);
  } catch {
    // Statistics must never break the app.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useAnalyticsConsent(): { consent: AnalyticsConsent; loaded: boolean } {
  const current = useSyncExternalStore(subscribe, () => `${loaded ? 1 : 0}:${consent}`);
  const [isLoaded, value] = current.split(':') as ['0' | '1', AnalyticsConsent];
  return { consent: value, loaded: isLoaded === '1' };
}
