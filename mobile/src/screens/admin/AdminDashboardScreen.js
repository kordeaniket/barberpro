import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import api from '../../services/api';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { COLORS, SHADOWS } from '../../theme';

export default function AdminDashboardScreen() {
  const { t } = useTranslation();
  const [selectedShopId, setSelectedShopId] = useState('all');
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const q = selectedShopId !== 'all' ? `?shopId=${selectedShopId}` : '';
      const res = await api.get(`/super/dashboard${q}`);
      setData(res.data);
    } catch {}
  }, [selectedShopId]);

  useEffect(() => {
    load();
  }, [load]);

  const s = data?.stats || {};
  const allShops = data?.allShops || [];

  return (
    <View style={styles.container}>
      <AppHeader title={t('admin.platformOverview')} />
      <ScrollView
        contentContainerStyle={styles.scroll}
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
      >
        {/* Shop Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <TouchableOpacity
            onPress={() => setSelectedShopId('all')}
            style={[styles.chip, selectedShopId === 'all' && styles.chipActive]}
          >
            <Text style={[styles.chipTxt, selectedShopId === 'all' && styles.chipTxtActive]}>
              {t('admin.allShops')}
            </Text>
          </TouchableOpacity>
          {allShops.map((sh) => (
            <TouchableOpacity
              key={sh._id}
              onPress={() => setSelectedShopId(sh._id)}
              style={[styles.chip, selectedShopId === sh._id && styles.chipActive]}
            >
              <Text style={[styles.chipTxt, selectedShopId === sh._id && styles.chipTxtActive]}>
                {sh.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sales Banner */}
        <View style={[styles.salesCard, SHADOWS.md]}>
          <View>
            <Text style={styles.salesLbl}>{t('admin.totalSales')}</Text>
            <Text style={styles.salesVal}>₹{s.totalSales || 0}</Text>
          </View>
          <View style={styles.salesRight}>
            <Text style={styles.salesSub}>
              {t('admin.todaySales')}: <Text style={{ color: COLORS.amber, fontWeight: '800' }}>₹{s.todaySales || 0}</Text>
            </Text>
            <Text style={styles.salesSub}>
              {t('admin.monthSales')}: <Text style={{ color: COLORS.white, fontWeight: '800' }}>₹{s.monthSales || 0}</Text>
            </Text>
          </View>
        </View>

        {/* KPI Grid */}
        <View style={styles.grid}>
          {selectedShopId === 'all' && (
            <StatCard
              title={t('admin.totalShops')}
              value={s.shops || 0}
              subtitle={`${s.active || 0} ${t('status.active')}`}
              icon="storefront-outline"
              color={COLORS.amberDark}
              bg={COLORS.amberBg}
            />
          )}
          <StatCard
            title={t('admin.totalBarbers')}
            value={s.barbers || 0}
            icon="cut-outline"
            color={COLORS.purple}
            bg={COLORS.purpleBg}
          />
          <StatCard
            title={t('admin.totalCustomers')}
            value={s.customers || 0}
            icon="people-outline"
            color={COLORS.blue}
            bg={COLORS.blueBg}
          />
          <StatCard
            title={t('admin.totalBookings')}
            value={s.bookings ?? s.totalBookings ?? 0}
            subtitle={`${s.completionRate || 0}% ✓`}
            icon="calendar-outline"
            color={COLORS.emerald}
            bg={COLORS.emeraldBg}
          />
          {selectedShopId === 'all' && (
            <StatCard
              title={t('admin.pendingRequests')}
              value={s.pendingShopRequests || 0}
              icon="time-outline"
              color={COLORS.red}
              bg={COLORS.redBg}
            />
          )}
        </View>

        {/* Per Shop Performance */}
        {data?.perShop?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('admin.perShopPerf')}</Text>
            {data.perShop.map((p) => (
              <View key={p._id} style={[styles.shopRow, SHADOWS.sm]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>{p.name || 'Shop'}</Text>
                  <Text style={styles.shopMeta}>
                    {p.bookings || 0} {t('barber.bookings')}
                  </Text>
                </View>
                <Text style={styles.shopRev}>₹{p.sales || 0}</Text>
              </View>
            ))}
          </>
        )}

        {/* Store Mode Recent Bookings */}
        {data?.recentBookings?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('barber.recentBookings')}</Text>
            {data.recentBookings.map((b) => (
              <View key={b.id} style={[styles.shopRow, SHADOWS.sm]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>{b.customer}</Text>
                  <Text style={styles.shopMeta}>
                    {b.service} • {b.date} {b.time}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.shopRev}>₹{b.price}</Text>
                  <StatusBadge status={b.status} />
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 14, paddingBottom: 30 },
  chips: { gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  chipTxt: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  chipTxtActive: { color: COLORS.amber },
  salesCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.dark,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  salesLbl: { color: COLORS.amberLight, fontSize: 12, fontWeight: '600' },
  salesVal: { color: COLORS.white, fontSize: 26, fontWeight: '800', marginTop: 4 },
  salesRight: { alignItems: 'flex-end', gap: 4 },
  salesSub: { color: COLORS.textLight, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  shopName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  shopMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  shopRev: { fontSize: 15, fontWeight: '800', color: COLORS.emerald },
});
