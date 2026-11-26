import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { notificationsSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { COLORS, SHADOWS } from '../../theme';

export default function BarberDashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [period, setPeriod] = useState('daily');
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dashRes, notifRes] = await Promise.all([
        api.get(`/barber/dashboard?period=${period}`),
        api.get('/barber/notifications', { skipGlobalLoader: true }),
      ]);
      setData(dashRes.data);
      dispatch(notificationsSlice.actions.setNotifications(notifRes.data || []));
    } catch {}
  }, [period, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const s = data?.summary || {};
  const snap = data?.todaySnapshot || {};

  return (
    <View style={styles.container}>
      <AppHeader showNotifications />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.amber} />}
      >
        {/* Period Filter */}
        <View style={styles.periodRow}>
          {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, period === p && styles.periodActive]}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {t(`barber.${p}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Snapshot Banner */}
        <View style={[styles.snapCard, SHADOWS.md]}>
          <View style={styles.snapHeader}>
            <Text style={styles.snapTitle}>{t('barber.todaySnapshot')}</Text>
            <Text style={styles.snapRev}>₹{snap.todayRevenue || 0}</Text>
          </View>
          <View style={styles.snapStats}>
            <View style={styles.snapCol}>
              <Text style={styles.snapNum}>{snap.todayTotal || 0}</Text>
              <Text style={styles.snapLbl}>{t('barber.bookings')}</Text>
            </View>
            <View style={styles.snapCol}>
              <Text style={[styles.snapNum, { color: COLORS.emerald }]}>{snap.todayCompleted || 0}</Text>
              <Text style={styles.snapLbl}>{t('barber.completed')}</Text>
            </View>
            <View style={styles.snapCol}>
              <Text style={[styles.snapNum, { color: COLORS.amber }]}>{snap.todayPending || 0}</Text>
              <Text style={styles.snapLbl}>{t('barber.pending')}</Text>
            </View>
          </View>
        </View>

        {/* KPI Grid */}
        <View style={styles.grid}>
          <StatCard
            title={t('barber.totalRevenue')}
            value={`₹${s.totalRevenue || 0}`}
            icon="cash-outline"
            color={COLORS.emerald}
            bg={COLORS.emeraldBg}
          />
          <StatCard
            title={t('barber.bookings')}
            value={s.totalAppointments || 0}
            subtitle={`${s.completedAppointments || 0} ✓`}
            icon="calendar-outline"
            color={COLORS.blue}
            bg={COLORS.blueBg}
          />
          <StatCard
            title={t('barber.clients')}
            value={s.totalCustomers || 0}
            subtitle={`+${s.newCustomers || 0}`}
            icon="people-outline"
            color={COLORS.purple}
            bg={COLORS.purpleBg}
          />
          <StatCard
            title={t('barber.avgTicket')}
            value={`₹${s.avgTicketSize || 0}`}
            subtitle={`${s.repeatCustomerRate || 0}% ${t('barber.repeatRate')}`}
            icon="trending-up-outline"
            color={COLORS.amberDark}
            bg={COLORS.amberBg}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => navigation.navigate('Appointments')}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.dark} />
            <Text style={styles.quickText}>{t('barber.newAppointment')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: COLORS.dark }]}
            onPress={() => navigation.navigate('Billing')}
          >
            <Ionicons name="receipt-outline" size={20} color={COLORS.amber} />
            <Text style={[styles.quickText, { color: COLORS.white }]}>{t('barber.generateBill')}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Appointments */}
        <Text style={styles.sectionTitle}>{t('barber.recentBookings')}</Text>
        {(data?.recentAppointments || []).length === 0 ? (
          <Text style={styles.empty}>{t('common.noData')}</Text>
        ) : (
          (data?.recentAppointments || []).map((a) => (
            <View key={a._id || a.id} style={[styles.recentCard, SHADOWS.sm]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentName}>{a.customerId?.name || a.customer || 'Walk-In'}</Text>
                <Text style={styles.recentSub}>
                  {a.serviceName} • {a.date}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.recentPrice}>₹{a.price || 0}</Text>
                <StatusBadge status={a.status} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 14, paddingBottom: 30 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  periodActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  periodText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  periodTextActive: { color: COLORS.amber },
  snapCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  snapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  snapTitle: { color: COLORS.amberLight, fontSize: 13, fontWeight: '700' },
  snapRev: { color: COLORS.amber, fontSize: 20, fontWeight: '800' },
  snapStats: { flexDirection: 'row', justifyContent: 'space-around' },
  snapCol: { alignItems: 'center' },
  snapNum: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
  snapLbl: { color: COLORS.textLight, fontSize: 11, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.amber,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickText: { fontSize: 13, fontWeight: '800', color: COLORS.dark },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  empty: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 20 },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  recentName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  recentSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  recentPrice: { fontSize: 14, fontWeight: '800', color: COLORS.text },
});
