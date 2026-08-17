import { Children, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useContent } from '@/src/content/ContentProvider';
import { fontFamilyForText } from '@/src/theme/fonts';
import { colors } from '@/src/theme/colors';

type TextVariant = 'body' | 'title' | 'subtitle' | 'label' | 'caption';

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: TextVariant;
    languageCode?: string;
  }
>;

const variantStyles: Record<TextVariant, TextStyle> = {
  body: { fontSize: 17, lineHeight: 25 },
  title: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  subtitle: { fontSize: 21, lineHeight: 29, fontWeight: '700' },
  label: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  caption: { fontSize: 14, lineHeight: 20 },
};

export function AppText({
  children,
  variant = 'body',
  languageCode,
  style,
  ...props
}: AppTextProps) {
  const { content, currentLanguage } = useContent();
  const displayLanguage = languageCode
    ? content.index.languages.find(({ code }) => code === languageCode) ?? currentLanguage
    : currentLanguage;
  const bold = variant === 'title' || variant === 'subtitle' || variant === 'label';
  const text = flattenText(children);

  return (
    <Text
      {...props}
      style={[
        styles.base,
        variantStyles[variant],
        {
          fontFamily: fontFamilyForText(text, bold),
          textAlign: displayLanguage.rtl ? 'right' : 'left',
          writingDirection: displayLanguage.rtl ? 'rtl' : 'ltr',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

function flattenText(value: ReactNode): string {
  return Children.toArray(value)
    .map((child) =>
      typeof child === 'string' || typeof child === 'number' ? String(child) : '',
    )
    .join('');
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
});
