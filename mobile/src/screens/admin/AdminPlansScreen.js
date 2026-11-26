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
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { uiSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../theme';

export default function AdminPlansScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [plans, setPlans] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cycle, setCycle] = useState('monthly');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/super/plans');
      setPlans(data || []);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createPlan = async () => {
    if (!name.trim()) {
      return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
    }
    try {
      await api.post('/super/plans', {
        name: name.trim(),
        price: Number(price || 0),
        cycle: cycle.trim() || 'monthly',
      });
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: t('common.done') }));
      setModalOpen(false);
      setName('');
      setPrice('');
      load();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('admin.subscriptionPlans')} />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Ionicons name="add-circle-outline" size={18} color={COLORS.dark} />
          <Text style={styles.addTxt}>{t('admin.createPlan')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={plans}
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
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.cycle}>{String(item.cycle || 'monthly').toUpperCase()}</Text>
            </View>
            <Text style={styles.price}>₹{item.price || 0}</Text>
          </View>
        )}
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('admin.createPlan')}</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder={t('admin.planName')} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder={t('admin.planPrice')} keyboardType="numeric" value={price} onChangeText={setPrice} />
            <TextInput style={styles.input} placeholder={t('admin.planCycle')} value={cycle} onChangeText={setCycle} />
            <TouchableOpacity style={styles.saveBtn} onPress={createPlan}>
              <Text style={styles.saveBtnTxt}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { padding: 12, paddingBottom: 4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.amber,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addTxt: { fontSize: 14, fontWeight: '800', color: COLORS.dark },
  empty: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  cycle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  price: { fontSize: 18, fontWeight: '800', color: COLORS.emerald },
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
