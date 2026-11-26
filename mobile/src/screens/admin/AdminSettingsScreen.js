import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { authSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ChangePasswordCard from '../../components/ChangePasswordCard';
import { COLORS, SHADOWS } from '../../theme';

export default function AdminSettingsScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  return (
    <View style={styles.container}>
      <AppHeader title={t('nav.settings')} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.profileCard, SHADOWS.sm]}>
          <View style={styles.avatar}>
            <Ionicons name="shield-checkmark" size={28} color={COLORS.dark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name || 'Super Admin'}</Text>
            <Text style={styles.sub}>
              {user?.mobile} • {t('roles.superadmin')}
            </Text>
          </View>
        </View>

        <LanguageSwitcher />
        <ChangePasswordCard />

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => dispatch(authSlice.actions.logout())}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
          <Text style={styles.logoutTxt}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 14, paddingBottom: 30 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.red,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  logoutTxt: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});
