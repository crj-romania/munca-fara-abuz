import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans/400Regular';
import { NotoSansArabic_400Regular } from '@expo-google-fonts/noto-sans-arabic/400Regular';
import { NotoSansBengali_400Regular } from '@expo-google-fonts/noto-sans-bengali/400Regular';
import { NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari/400Regular';
import { NotoSansSinhala_400Regular } from '@expo-google-fonts/noto-sans-sinhala/400Regular';
import { NotoSansTamil_400Regular } from '@expo-google-fonts/noto-sans-tamil/400Regular';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// Embed bundled fonts in native PDF HTML: no external font CDN or complaint upload.
// Include each script present, including mixed-language names and the original annex.
const sources = [
  { name: 'ComplaintLatin', asset: NotoSans_400Regular, pattern: /[\s\S]/u },
  { name: 'ComplaintDevanagari', asset: NotoSansDevanagari_400Regular, pattern: /[\u0900-\u097f]/u },
  { name: 'ComplaintArabic', asset: NotoSansArabic_400Regular, pattern: /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/u },
  { name: 'ComplaintBengali', asset: NotoSansBengali_400Regular, pattern: /[\u0980-\u09ff]/u },
  { name: 'ComplaintSinhala', asset: NotoSansSinhala_400Regular, pattern: /[\u0d80-\u0dff]/u },
  { name: 'ComplaintTamil', asset: NotoSansTamil_400Regular, pattern: /[\u0b80-\u0bff]/u },
];

export async function getPdfFontCss(text: string): Promise<string> {
  if (Platform.OS === 'web') return '';
  return (await Promise.all(sources.filter(({ pattern }) => pattern.test(text)).map(async ({ name, asset }) => {
    const file = await Asset.fromModule(asset).downloadAsync();
    if (!file.localUri) throw new Error('PDF font is unavailable.');
    const data = await FileSystem.readAsStringAsync(file.localUri, { encoding: FileSystem.EncodingType.Base64 });
    return `@font-face { font-family: ${name}; src: url(data:font/ttf;base64,${data}) format('truetype'); font-weight: normal; }`;
  }))).join('\n');
}
