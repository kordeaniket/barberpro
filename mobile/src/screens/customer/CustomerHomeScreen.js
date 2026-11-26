import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { notificationsSlice, uiSlice, authSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import StatusBadge from '../../components/StatusBadge';
import PaymentModal from '../../components/PaymentModal';
import SalonPickerModal from '../../components/SalonPickerModal';
import { formatMin, todayStr } from '../../utils/time';
import { COLORS, SHADOWS } from '../../theme';

export default function CustomerHomeScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const refreshTrigger = useSelector((s) => s.ui.refreshTrigger);

  const [shop, setShop] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [payAppt, setPayAppt] = useState(null);
  const [activeShops, setActiveShops] = useState([]);
  const [salonModalOpen, setSalonModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profRes, bookRes, notifRes, shopsRes] = await Promise.all([
        api.get('/customer/profile'),
        api.get('/customer/bookings'),
        api.get('/customer/notifications', { skipGlobalLoader: true }),
        api.get('/customer/shops', { skipGlobalLoader: true }),
      ]);
      const profShop = profRes.data?.shop || null;
      setShop(profShop);
      setBookings(bookRes.data || []);
      dispatch(notificationsSlice.actions.setNotifications(notifRes.data || []));
      setActiveShops(shopsRes.data?.activeShops || []);
      if (profShop?.shopCode) {
        api
          .get(`/customer/public/shop/${profShop.shopCode}`, { skipGlobalLoader: true })
          .then((r) => setServices(r.data?.services || []))
          .catch(() => {});
      }
    } catch { }
  }, [dispatch]);

  const handleSwitchSalon = async (chosen) => {
    try {
      const { data } = await api.post('/customer/switch-shop', { shopId: chosen._id });
      dispatch(authSlice.actions.updateUser({ shopId: data.shopId, shop: data.shop }));
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
      await load();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  const cancelBooking = async (id) => {
    try {
      const { data } = await api.patch(`/customer/bookings/${id}/cancel`);
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
      load();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  const today = todayStr();
  const todayAppt = bookings.find(
    (b) => b.date === today && ['pending', 'confirmed', 'in_progress'].includes(b.status)
  );

  return (
    <View style={styles.container}>
      <AppHeader title={shop?.name} showNotifications />
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
        {/* Shop Hero Card */}
        <View style={[styles.heroCard, SHADOWS.md]}>
          <View style={styles.heroRow}>
            {shop?.logoUrl ? (
              <Image source={{ uri: shop.logoUrl }} style={styles.shopLogo} />
            ) : (
              <View style={styles.shopLogoFallback}>
                <Ionicons name="cut" size={26} color={COLORS.dark} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.helloTxt}>
                {t('customer.welcome')}, {user?.name}!
              </Text>
              <Text style={styles.shopName}>{shop?.name || 'BarberPro Salon'}</Text>
              {shop?.city ? <Text style={styles.shopCity}>📍 {shop.city}</Text> : null}
            </View>
            {/* <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => setSalonModalOpen(true)}
            >
              <Ionicons name="swap-horizontal" size={14} color={COLORS.dark} />
              <Text style={styles.switchBtnTxt}>{t('auth.switchSalon')}</Text>
            </TouchableOpacity> */}
          </View>

          <TouchableOpacity style={styles.bookCta} onPress={() => navigation.navigate('Book')}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.dark} />
            <Text style={styles.bookCtaText}>{t('customer.bookNow')}</Text>
          </TouchableOpacity>

          {shop?.ownerMobile ? (
            <View style={styles.contactRow}>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL(`tel:${shop.ownerMobile}`)}
              >
                <Ionicons name="call-outline" size={15} color={COLORS.amberLight} />
                <Text style={styles.contactTxt}>{shop.ownerMobile}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL(`https://wa.me/91${String(shop.ownerMobile).replace(/\D/g, '').slice(-10)}`)}
              >
                <Ionicons name="logo-whatsapp" size={15} color={COLORS.emerald} />
                <Text style={styles.contactTxt}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Popular Services Preview */}
        {services.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>{t('barber.servicesTab')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {services.slice(0, 8).map((sv) => (
                <TouchableOpacity
                  key={sv._id}
                  style={[styles.svcPill, SHADOWS.sm]}
                  onPress={() => navigation.navigate('Book')}
                >
                  <Text style={styles.svcPillName}>{sv.name}</Text>
                  <Text style={styles.svcPillMeta}>₹{sv.price} • {sv.duration}m</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Today's Appointment */}
        <Text style={styles.sectionTitle}>{t('customer.todaysAppt')}</Text>
        {todayAppt ? (
          <View style={[styles.apptCard, SHADOWS.sm]}>
            <View style={styles.apptTop}>
              <Text style={styles.apptSvc}>{todayAppt.serviceName}</Text>
              <StatusBadge status={todayAppt.status} />
            </View>
            <Text style={styles.apptMeta}>
              ⏰ {formatMin(todayAppt.startMin)} • ₹{todayAppt.price}
            </Text>
            <View style={styles.apptBtns}>
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => setPayAppt(todayAppt)}
              >
                <Ionicons name="wallet-outline" size={16} color={COLORS.white} />
                <Text style={styles.payBtnTxt}>{t('customer.payOnline')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => cancelBooking(todayAppt._id)}
              >
                <Text style={styles.cancelBtnTxt}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyCard, SHADOWS.sm]}>
            <Ionicons name="calendar-clear-outline" size={30} color={COLORS.textLight} />
            <Text style={styles.emptyTxt}>{t('customer.noUpcomingToday')}</Text>
          </View>
        )}
      </ScrollView>

      <PaymentModal
        visible={Boolean(payAppt)}
        onClose={() => setPayAppt(null)}
        appointment={payAppt}
        shop={shop}
      />

      <SalonPickerModal
        visible={salonModalOpen}
        onClose={() => setSalonModalOpen(false)}
        shops={activeShops}
        selectedShopId={user?.shopId}
        onSelect={handleSwitchSalon}
        title={t('auth.switchSalon')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 14, paddingBottom: 30 },
  heroCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  shopLogo: { width: 56, height: 56, borderRadius: 14 },
  shopLogoFallback: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helloTxt: { color: COLORS.amberLight, fontSize: 12, fontWeight: '600' },
  shopName: { color: COLORS.white, fontSize: 19, fontWeight: '800', marginTop: 2 },
  shopCity: { color: COLORS.textLight, fontSize: 12, marginTop: 2 },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.amberLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  switchBtnTxt: { fontSize: 11, fontWeight: '800', color: COLORS.dark },
  bookCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.amber,
    paddingVertical: 13,
    borderRadius: 14,
  },
  bookCtaText: { fontSize: 14, fontWeight: '800', color: COLORS.dark },
  contactRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  contactTxt: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  svcPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  svcPillName: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  svcPillMeta: { fontSize: 11, fontWeight: '700', color: COLORS.amberDark, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  apptCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  apptTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  apptSvc: { fontSize: 16, fontWeight: '800', color: COLORS.text, flex: 1, paddingRight: 8 },
  apptMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: 6, fontWeight: '600' },
  apptBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.emerald,
    paddingVertical: 11,
    borderRadius: 12,
  },
  payBtnTxt: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: COLORS.redBg,
    justifyContent: 'center',
  },
  cancelBtnTxt: { color: COLORS.red, fontWeight: '700', fontSize: 13 },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTxt: { color: COLORS.textMuted, fontSize: 13 },
});
