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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { uiSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../theme';

export default function BarberServicesScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const refreshTrigger = useSelector((s) => s.ui.refreshTrigger);

  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [svcModal, setSvcModal] = useState(false);
  const [svcId, setSvcId] = useState(null);
  const [svcName, setSvcName] = useState('');
  const [svcPrice, setSvcPrice] = useState('');
  const [svcDuration, setSvcDuration] = useState('30');
  const [svcDesc, setSvcDesc] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/barber/services');
      setServices((data || []).filter((x) => x.active !== false));
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  const openAdd = () => {
    setSvcId(null);
    setSvcName('');
    setSvcPrice('');
    setSvcDuration('30');
    setSvcDesc('');
    setSvcModal(true);
  };

  const openEdit = (s) => {
    setSvcId(s._id);
    setSvcName(s.name || '');
    setSvcPrice(String(s.price || ''));
    setSvcDuration(String(s.duration || '30'));
    setSvcDesc(s.description || '');
    setSvcModal(true);
  };

  const saveService = async () => {
    if (!svcName.trim() || !svcPrice) {
      return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
    }
    try {
      const body = {
        name: svcName.trim(),
        price: Number(svcPrice),
        duration: Number(svcDuration || 30),
        description: svcDesc.trim(),
        active: true,
      };
      if (svcId) await api.patch(`/barber/services/${svcId}`, body);
      else await api.post('/barber/services', body);
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: t('common.done') }));
      setSvcModal(false);
      load();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  const deleteService = async (id) => {
    try {
      await api.delete(`/barber/services/${id}`);
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: t('common.done') }));
      load();
    } catch {}
  };

  const filtered = services.filter((s) => {
    if (!search.trim()) return true;
    return (s.name || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AppHeader title={t('barber.servicesTab')} showNotifications />

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
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={22} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        removeClippedSubviews
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
            <View style={styles.iconBox}>
              <Ionicons name="cut" size={18} color={COLORS.amberDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.sub}>
                ₹{item.price} • {item.duration} {t('common.mins')}
              </Text>
              {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconAct}>
              <Ionicons name="create-outline" size={20} color={COLORS.amberDark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteService(item._id)} style={styles.iconAct}>
              <Ionicons name="trash-outline" size={20} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={svcModal} transparent animationType="slide" onRequestClose={() => setSvcModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {svcId ? t('barber.editService') : t('barber.addService')}
              </Text>
              <TouchableOpacity onPress={() => setSvcModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder={t('barber.serviceName')} value={svcName} onChangeText={setSvcName} />
            <TextInput style={styles.input} placeholder={t('barber.price')} keyboardType="numeric" value={svcPrice} onChangeText={setSvcPrice} />
            <TextInput style={styles.input} placeholder={t('barber.durationMin')} keyboardType="numeric" value={svcDuration} onChangeText={setSvcDuration} />
            <TextInput style={styles.input} placeholder={t('barber.description')} value={svcDesc} onChangeText={setSvcDesc} />
            <TouchableOpacity style={styles.saveBtn} onPress={saveService}>
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.amberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sub: { fontSize: 13, color: COLORS.amberDark, fontWeight: '600', marginTop: 2 },
  desc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  iconAct: { padding: 6 },
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
  saveBtnText: { fontWeight: '800', color: COLORS.dark, fontSize: 15 },
});
