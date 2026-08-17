export const fonts = {
  latin: {
    regular: 'NotoSans_400Regular',
    bold: 'NotoSans_700Bold',
  },
  devanagari: {
    regular: 'NotoSansDevanagari_400Regular',
    bold: 'NotoSansDevanagari_700Bold',
  },
  arabic: {
    regular: 'NotoSansArabic_400Regular',
    bold: 'NotoSansArabic_700Bold',
  },
  sinhala: {
    regular: 'NotoSansSinhala_400Regular',
    bold: 'NotoSansSinhala_700Bold',
  },
  tamil: {
    regular: 'NotoSansTamil_400Regular',
    bold: 'NotoSansTamil_700Bold',
  },
  bengali: {
    regular: 'NotoSansBengali_400Regular',
    bold: 'NotoSansBengali_700Bold',
  },
} as const;

export function fontFamilyForText(text: string, bold: boolean): string {
  const family = /[\u0900-\u097f]/u.test(text)
    ? fonts.devanagari
    : /[\u0d80-\u0dff]/u.test(text)
      ? fonts.sinhala
      : /[\u0b80-\u0bff]/u.test(text)
        ? fonts.tamil
        : /[\u0980-\u09ff]/u.test(text)
          ? fonts.bengali
          : /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/u.test(text)
            ? fonts.arabic
            : fonts.latin;
  return bold ? family.bold : family.regular;
}
