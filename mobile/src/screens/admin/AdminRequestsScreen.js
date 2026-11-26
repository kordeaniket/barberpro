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
import StatusBadge from '../../components/StatusBadge';
import { COLORS, SHADOWS } from '../../theme';

export default function AdminRequestsScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [refreshing, setRefreshing] = useState(false);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/super/shop-requests?status=${filter}`);
      setRequests(data || []);
    } catch {}
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id) => {
    try {
      const { data } = await api.post(`/super/shop-requests/${id}/approve`, {});
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
      load();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    try {
      const { data } = await api.post(`/super/shop-requests/${rejectTarget._id}/reject`, {
        reason: reason.trim() || undefined,
      });
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
      setRejectTarget(null);
      setReason('');
      load();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('admin.shopRequests')} />

      <View style={styles.filterRow}>
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}
          >
            <Text style={[styles.chipTxt, filter === f && styles.chipTxtActive]}>
              {f === 'all' ? t('common.all') : t(`status.${f}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={requests}
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
                <Text style={styles.name}>{item.shopName}</Text>
                <Text style={styles.sub}>
                  {item.ownerName} • {item.mobile}
                </Text>
                {item.city ? <Text style={styles.city}>📍 {item.city}</Text> : null}
              </View>
              <StatusBadge status={item.status} />
            </View>

            {item.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: COLORS.emerald }]}
                  onPress={() => approve(item._id)}
                >
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  <Text style={styles.btnTxt}>{t('admin.approve')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: COLORS.red }]}
                  onPress={() => setRejectTarget(item)}
                >
                  <Ionicons name="close" size={16} color={COLORS.white} />
                  <Text style={styles.btnTxt}>{t('admin.reject')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={Boolean(rejectTarget)} transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('admin.rejectionReason')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('admin.rejectionReason')}
              value={reason}
              onChangeText={setReason}
              multiline
            />
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: COLORS.surface }]}
                onPress={() => setRejectTarget(null)}
              >
                <Text style={[styles.btnTxt, { color: COLORS.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.red }]} onPress={submitReject}>
                <Text style={styles.btnTxt}>{t('admin.reject')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.surface, alignItems: 'center' },
  chipActive: { backgroundColor: COLORS.dark },
  chipTxt: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  chipTxtActive: { color: COLORS.amber },
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
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnTxt: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: COLORS.white, borderRadius: 18, padding: 18 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    padding: 12,
    minHeight: 70,
    fontSize: 14,
  },
});
