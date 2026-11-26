import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { uiSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import StatusBadge from '../../components/StatusBadge';
import PaymentModal from '../../components/PaymentModal';
import { formatMin } from '../../utils/time';
import { COLORS, SHADOWS } from '../../theme';

export default function CustomerBookingsScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [bookings, setBookings] = useState([]);
  const [shop, setShop] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [payAppt, setPayAppt] = useState(null);

  const load = useCallback(async () => {
    try {
      const [bRes, pRes] = await Promise.all([
        api.get('/customer/bookings'),
        api.get('/customer/profile'),
      ]);
      setBookings(bRes.data || []);
      setShop(pRes.data?.shop || null);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancelBooking = async (id) => {
    try {
      const { data } = await api.patch(`/customer/bookings/${id}/cancel`);
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
      load();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('customer.myBookings')} showNotifications />

      <FlatList
        data={bookings}
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
        ListEmptyComponent={<Text style={styles.empty}>{t('customer.noBookings')}</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, SHADOWS.sm]}>
            <View style={styles.top}>
              <Text style={styles.svc}>{item.serviceName}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.meta}>
              📅 {item.date} • ⏰ {formatMin(item.startMin)}
            </Text>
            <View style={styles.bottom}>
              <Text style={styles.price}>₹{item.price || 0}</Text>
              <View style={styles.btns}>
                {!['cancelled', 'rejected'].includes(item.status) && (
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => setPayAppt(item)}
                  >
                    <Ionicons name="wallet-outline" size={14} color={COLORS.white} />
                    <Text style={styles.payTxt}>{t('customer.payNow')}</Text>
                  </TouchableOpacity>
                )}
                {['pending', 'confirmed'].includes(item.status) && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => cancelBooking(item._id)}
                  >
                    <Text style={styles.cancelTxt}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      />

      <PaymentModal
        visible={Boolean(payAppt)}
        onClose={() => setPayAppt(null)}
        appointment={payAppt}
        shop={shop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  empty: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 40 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  svc: { fontSize: 15, fontWeight: '800', color: COLORS.text, flex: 1, paddingRight: 8 },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  price: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  btns: { flexDirection: 'row', gap: 8 },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  payTxt: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  cancelBtn: {
    backgroundColor: COLORS.redBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  cancelTxt: { color: COLORS.red, fontSize: 12, fontWeight: '700' },
});
