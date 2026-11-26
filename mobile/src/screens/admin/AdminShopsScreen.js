import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { uiSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import StatusBadge from '../../components/StatusBadge';
import { COLORS, SHADOWS } from '../../theme';

export default function AdminShopsScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/super/shops');
      setShops(data || []);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createShop = async () => {
    if (!name.trim() || !ownerName.trim() || !mobile.trim()) {
      return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
    }
    try {
      const { data } = await api.post('/super/shops', {
        name: name.trim(),
        ownerName: ownerName.trim(),
        mobile: mobile.trim(),
        city: city.trim(),
      });
      Alert.alert(t('common.done'), data.message);
      setModalOpen(false);
      setName('');
      setOwnerName('');
      setMobile('');
      setCity('');
      load();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  const toggleStatus = async (shop) => {
    const next = shop.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/super/shops/${shop._id}`, { status: next });
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: `${shop.name}: ${next}` }));
      load();
    } catch {}
  };

  const resetPw = (shop) => {
    Alert.alert(t('admin.resetPassword'), t('admin.resetPwConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: async () => {
          try {
            const { data } = await api.post(`/super/shops/${shop._id}/reset-password`);
            Alert.alert(t('admin.resetPassword'), data.message);
          } catch {}
        },
      },
    ]);
  };

  const filtered = shops.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.ownerName || '').toLowerCase().includes(q) ||
      (s.mobile || '').includes(q) ||
      (s.shopCode || '').toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      <AppHeader title={t('nav.shops')} />
      <View style={styles.topRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search')}
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Ionicons name="add" size={22} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={COLORS.amber}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('common.noData')}</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, SHADOWS.sm]}>
            <View style={styles.top}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>
                  {item.ownerName} • {item.mobile} • #{item.shopCode}
                </Text>
                {item.city ? <Text style={styles.city}>📍 {item.city}</Text> : null}
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actBtn, { backgroundColor: COLORS.surface }]}
                onPress={() => toggleStatus(item)}
              >
                <Text style={styles.actTxt}>
                  {item.status === 'active' ? t('status.inactive') : t('status.active')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actBtn, { backgroundColor: COLORS.amberBg }]}
                onPress={() => resetPw(item)}
              >
                <Text style={[styles.actTxt, { color: COLORS.amberDark }]}>
                  {t('admin.resetPassword')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('admin.createShop')}</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder={t('barber.shopName')} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder={t('barber.ownerName')} value={ownerName} onChangeText={setOwnerName} />
            <TextInput style={styles.input} placeholder={t('auth.mobileNumber')} keyboardType="phone-pad" maxLength={10} value={mobile} onChangeText={setMobile} />
            <TextInput style={styles.input} placeholder={t('auth.city')} value={city} onChangeText={setCity} />
            <TouchableOpacity style={styles.saveBtn} onPress={createShop}>
              <Text style={styles.saveBtnTxt}>{t('admin.createShop')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: COLORS.text },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.amber, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 40 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  city: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  actTxt: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 10,
  },
  saveBtn: { backgroundColor: COLORS.amber, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 6 },
  saveBtnTxt: { fontWeight: '800', color: COLORS.dark, fontSize: 15 },
});
