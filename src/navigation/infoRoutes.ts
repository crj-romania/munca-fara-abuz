import type { Href } from 'expo-router';

export function buildInfoHref(segments: string[]): Href {
  return `/info/${segments.map(encodeURIComponent).join('/')}` as Href;
}
