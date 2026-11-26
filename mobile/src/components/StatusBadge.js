import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';
import { useTranslation } from '../i18n';

const STATUS_STYLES = {
  pending: { bg: '#fef3c7', text: '#b45309' },
  confirmed: { bg: '#dbeafe', text: '#1d4ed8' },
  in_progress: { bg: '#ede9fe', text: '#6d28d9' },
  completed: { bg: '#d1fae5', text: '#047857' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c' },
  rejected: { bg: '#fee2e2', text: '#b91c1c' },
  no_show: { bg: '#f5f5f4', text: '#57534e' },
  active: { bg: '#d1fae5', text: '#047857' },
  inactive: { bg: '#fee2e2', text: '#b91c1c' },
  approved: { bg: '#d1fae5', text: '#047857' },
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const key = String(status || 'pending').toLowerCase();
  const style = STATUS_STYLES[key] || { bg: COLORS.surface, text: COLORS.textMuted };

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.label, { color: style.text }]}>{t(`status.${key}`, status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
