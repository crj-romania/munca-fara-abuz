import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ROMANIAN_COUNTIES } from '@/src/complaint/counties';
import { AppButton } from '@/src/components/AppButton';
import { AppText } from '@/src/components/AppText';
import { MonthYearInput } from '@/src/components/MonthYearInput';
import { useContent } from '@/src/content/ContentProvider';
import { colors } from '@/src/theme/colors';
import { fontFamilyForText } from '@/src/theme/fonts';
import { spacing } from '@/src/theme/spacing';
import type { ComplaintField } from '@/src/types/content';

type ComplaintFieldInputProps = {
  field: ComplaintField;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

type Choice = {
  value: string;
  label: string;
};

export function ComplaintFieldInput({
  field,
  value,
  error,
  onChange,
}: ComplaintFieldInputProps) {
  const { t } = useTranslation();
  const { currentLanguage } = useContent();
  const [modalVisible, setModalVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const choices = useMemo<Choice[]>(() => {
    if (field.type === 'county') {
      const counties = ROMANIAN_COUNTIES.map(({ code, name }) => ({
        value: code,
        label: name,
      }));
      return field.allowUnknown
        ? [{ value: 'unknown', label: t('complaint.form.unknownCounty') }, ...counties]
        : counties;
    }
    return (field.options ?? []).map((option) => ({
      value: option.value,
      label: /^\d{4}$/.test(option.labelKey) ? option.labelKey : t(option.labelKey),
    }));
  }, [field.options, field.type, field.allowUnknown, t]);
  const selectedLabel =
    choices.find((choice) => choice.value === value)?.label ?? '';

  return (
    <View style={styles.field}>
      <View style={[styles.labelRow, { flexDirection: currentLanguage.rtl ? 'row-reverse' : 'row' }]}>
        <AppText style={styles.label} variant="label">
          {t(field.labelKey)}
          {field.required ? ' *' : ''}
        </AppText>
        {field.infoKey ? (
          <Pressable
            accessibilityLabel={t('complaint.form.moreInfo')}
            accessibilityRole="button"
            accessibilityState={{ expanded: infoVisible }}
            hitSlop={12}
            onPress={() => setInfoVisible((visible) => !visible)}
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}
          >
            <Ionicons
              color={colors.primary}
              name={infoVisible ? 'information-circle' : 'information-circle-outline'}
              size={26}
            />
          </Pressable>
        ) : null}
      </View>
      {field.infoKey && infoVisible ? (
        <View style={styles.info}>
          <AppText>{t(field.infoKey)}</AppText>
        </View>
      ) : null}
      {field.hintKey ? (
        <AppText style={styles.hint} variant="caption">
          {t(field.hintKey)}
        </AppText>
      ) : null}

      {field.type === 'monthYear' ? (
        <MonthYearInput field={field} value={value} onChange={onChange} />
      ) : field.type === 'select' || field.type === 'county' ? (
        <>
          <Pressable
            accessibilityLabel={t(field.labelKey)}
            accessibilityRole="button"
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [
              styles.select,
              {
                flexDirection: currentLanguage.rtl ? 'row-reverse' : 'row',
              },
              error ? styles.inputError : undefined,
              pressed ? styles.pressed : undefined,
            ]}
          >
            <AppText style={selectedLabel ? undefined : styles.placeholder}>
              {selectedLabel || t('complaint.form.choose')}
            </AppText>
            <Ionicons
              color={colors.primary}
              name="chevron-down"
              size={22}
            />
          </Pressable>
          <Modal
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
            visible={modalVisible}
          >
            <SafeAreaView style={styles.modal}>
              <View style={styles.modalContent}>
                <AppText variant="title">{t(field.labelKey)}</AppText>
                <FlatList
                  data={choices}
                  keyExtractor={(choice) => choice.value}
                  renderItem={({ item }) => (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        onChange(item.value);
                        setModalVisible(false);
                      }}
                      style={({ pressed }) => [
                        styles.option,
                        item.value === value && styles.optionSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppText
                        variant={item.value === value ? 'label' : 'body'}
                      >
                        {item.label}
                      </AppText>
                    </Pressable>
                  )}
                />
                <AppButton
                  label={t('common.cancel')}
                  onPress={() => setModalVisible(false)}
                  variant="secondary"
                />
              </View>
            </SafeAreaView>
          </Modal>
        </>
      ) : (
        <TextInput
          keyboardType={field.validation === 'phone' ? 'phone-pad'
            : field.validation === 'email' ? 'email-address'
            : field.validation === 'cnp' ? 'number-pad' : 'default'}
          autoCapitalize={field.validation === 'email' ? 'none' : 'sentences'}
          autoCorrect={!field.validation && field.id !== 'idNumber'}
          accessibilityLabel={t(field.labelKey)}
          maxLength={field.type === 'freetext' ? 1000 : undefined}
          multiline={field.type === 'freetext'}
          onChangeText={onChange}
          placeholder={t('complaint.form.enter')}
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            field.type === 'freetext' && styles.multiline,
            error ? styles.inputError : undefined,
            {
              fontFamily: fontFamilyForText(value, false),
              textAlign: field.validation ? 'left' : currentLanguage.rtl ? 'right' : 'left',
              writingDirection: field.validation ? 'ltr' : currentLanguage.rtl ? 'rtl' : 'ltr',
            },
          ]}
          value={value}
        />
      )}

      {error ? (
        <AppText style={styles.error} variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  labelRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flexShrink: 1,
  },
  // A callout, deliberately unlike an input box.
  info: {
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: 8,
    backgroundColor: '#E6EEF5',
  },
  hint: {
    color: colors.muted,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: 17,
  },
  multiline: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  select: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  placeholder: {
    color: colors.muted,
  },
  pressed: {
    opacity: 0.72,
  },
  error: {
    color: colors.danger,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  option: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.surface,
  },
});
