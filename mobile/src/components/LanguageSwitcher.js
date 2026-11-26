import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useTranslation } from '../i18n';
import { uiSlice } from '../redux/store';
import { COLORS, SHADOWS } from '../theme';

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang, t } = useTranslation();
  const dispatch = useDispatch();

  const handleSelect = async (next) => {
    if (next === lang) return;
    await setLang(next);
    dispatch(uiSlice.actions.setMsg({ type: 'ok', text: next === 'mr' ? 'भाषा मराठीमध्ये बदलली' : 'Language changed to English' }));
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={() => handleSelect(lang === 'en' ? 'mr' : 'en')}
        style={styles.compactPill}
        activeOpacity={0.8}
      >
        <Ionicons name="language" size={14} color={COLORS.amberDark} />
        <Text style={styles.compactText}>{lang === 'en' ? 'मराठी' : 'EN'}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, SHADOWS.sm]}>
      <View style={styles.header}>
        <Ionicons name="language" size={20} color={COLORS.amberDark} />
        <View>
          <Text style={styles.title}>{t('common.language')}</Text>
          <Text style={styles.sub}>{t('common.selectLanguage')}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => handleSelect('en')}
          style={[styles.optBtn, lang === 'en' && styles.optActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.optText, lang === 'en' && styles.optTextActive]}>
            🇺🇸 {t('common.english')}
          </Text>
          {lang === 'en' && <Ionicons name="checkmark-circle" size={18} color={COLORS.amberDark} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSelect('mr')}
          style={[styles.optBtn, lang === 'mr' && styles.optActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.optText, lang === 'mr' && styles.optTextActive]}>
            🇮🇳 {t('common.marathi')}
          </Text>
          {lang === 'mr' && <Ionicons name="checkmark-circle" size={18} color={COLORS.amberDark} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.amberBg,
    borderWidth: 1,
    borderColor: COLORS.amberLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.amberDark,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted },
  row: { flexDirection: 'row', gap: 10 },
  optBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  optActive: {
    borderColor: COLORS.amber,
    backgroundColor: COLORS.amberBg,
  },
  optText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  optTextActive: { color: COLORS.dark, fontWeight: '700' },
});
