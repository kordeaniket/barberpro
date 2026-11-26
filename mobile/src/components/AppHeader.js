import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authSlice, notificationsSlice } from '../redux/store';
import { useTranslation } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';
import { COLORS } from '../theme';

export default function AppHeader({ title, showNotifications = false }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { items, unreadCount } = useSelector((s) => s.notifications);
  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <SafeAreaView edges={['top']} style={styles.safeTop}>
      <View style={styles.bar}>
        <View style={styles.left}>
          <View style={styles.brandIcon}>
            <Ionicons name="cut" size={18} color={COLORS.dark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {title || user?.shop?.name || t('common.appName')}
            </Text>
            <Text style={styles.roleSub} numberOfLines={1}>
              {user?.name} • {t(`roles.${user?.role}`)}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          <LanguageSwitcher compact />
          {showNotifications ? (
            <TouchableOpacity
              onPress={() => {
                setNotifOpen(true);
                dispatch(notificationsSlice.actions.markAllAsRead());
              }}
              style={styles.iconBtn}
            >
              <Ionicons name="notifications-outline" size={21} color={COLORS.text} />
              {unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => setLogoutOpen(true)} style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={21} color={COLORS.red} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal visible={notifOpen} animationType="slide" transparent onRequestClose={() => setNotifOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('notifications.title')}</Text>
              <TouchableOpacity onPress={() => setNotifOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item, idx) => item.id || String(idx)}
              ListEmptyComponent={<Text style={styles.emptyNotif}>{t('notifications.empty')}</Text>}
              renderItem={({ item }) => (
                <View style={styles.notifItem}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifMsg}>{item.message}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={logoutOpen} transparent animationType="fade" onRequestClose={() => setLogoutOpen(false)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmBox}>
            <Ionicons name="log-out-outline" size={34} color={COLORS.red} />
            <Text style={styles.confirmTitle}>{t('common.logoutConfirmTitle')}</Text>
            <Text style={styles.confirmMsg}>{t('common.logoutConfirmMsg')}</Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setLogoutOpen(false)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  setLogoutOpen(false);
                  dispatch(authSlice.actions.logout());
                }}
              >
                <Text style={styles.logoutText}>{t('common.logout')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeTop: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  roleSub: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 6, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.red,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '75%',
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  emptyNotif: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 30 },
  notifItem: {
    padding: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  notifTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  notifMsg: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  confirmTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginTop: 10 },
  confirmMsg: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 6 },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 18, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: { fontWeight: '700', color: COLORS.text },
  logoutBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: COLORS.red,
    alignItems: 'center',
  },
  logoutText: { fontWeight: '700', color: COLORS.white },
});
