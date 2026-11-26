import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme';

export default function StatCard({ title, value, subtitle, icon, color = COLORS.amber, bg = COLORS.amberBg }) {
  return (
    <View style={[styles.card, SHADOWS.sm]}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          <Ionicons name={icon || 'stats-chart'} size={18} color={color} />
        </View>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sub: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  title: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
});
