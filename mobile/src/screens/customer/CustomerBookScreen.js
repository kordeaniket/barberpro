import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { uiSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import PaymentModal from '../../components/PaymentModal';
import { formatMin, getNextDays, todayStr } from '../../utils/time';
import { COLORS, SHADOWS } from '../../theme';

export default function CustomerBookScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const shopCode = user?.shop?.shopCode;

  const [shop, setShop] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookedSummary, setBookedSummary] = useState(null);
  const [payAppt, setPayAppt] = useState(null);

  const days = getNextDays(14);

  const loadShop = useCallback(async () => {
    if (!shopCode) return;
    try {
      const { data } = await api.get(`/customer/public/shop/${shopCode}`);
      setShop(data.shop);
      setServices(data.services || []);
    } catch {}
  }, [shopCode]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  useEffect(() => {
    if (!shopCode || !date || selectedIds.length === 0) {
      setSlots([]);
      return;
    }
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    api
      .get(`/customer/public/slots?code=${shopCode}&date=${date}&serviceIds=${selectedIds.join(',')}&nowMin=${nowMin}&clientDate=${todayStr()}`, {
        skipGlobalLoader: true,
      })
      .then((res) => setSlots(res.data || []))
      .catch(() => setSlots([]));
  }, [shopCode, date, selectedIds]);

  const toggleService = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSelectedSlot(null);
  };

  const selectedSvcs = services.filter((s) => selectedIds.includes(s._id));
  const totalPrice = selectedSvcs.reduce((sum, s) => sum + (s.price || 0), 0);
  const totalDuration = selectedSvcs.reduce((sum, s) => sum + (s.duration || 30), 0);

  const confirmBooking = async () => {
    if (selectedIds.length === 0 || selectedSlot === null) {
      return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
    }
    try {
      const { data } = await api.post('/customer/bookings', {
        serviceIds: selectedIds,
        date,
        startMin: selectedSlot,
      });
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message || t('customer.bookingSuccess') }));
      setSelectedIds([]);
      setSelectedSlot(null);
      if (data.data) {
        setBookedSummary(data.data);
      } else {
        navigation.navigate('Home');
      }
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={shop?.name} showNotifications />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.stepTitle}>{t('customer.chooseServices')}</Text>
        {services.map((s) => {
          const active = selectedIds.includes(s._id);
          return (
            <TouchableOpacity
              key={s._id}
              onPress={() => toggleService(s._id)}
              style={[styles.svcCard, active && styles.svcActive, SHADOWS.sm]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.svcName}>{s.name}</Text>
                <Text style={styles.svcMeta}>
                  {s.duration} {t('common.mins')}
                </Text>
              </View>
              <Text style={styles.svcPrice}>₹{s.price}</Text>
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={active ? COLORS.amberDark : COLORS.textLight}
              />
            </TouchableOpacity>
          );
        })}

        <Text style={styles.stepTitle}>{t('customer.chooseDate')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
          {days.map((d) => {
            const active = date === d.value;
            return (
              <TouchableOpacity
                key={d.value}
                onPress={() => {
                  setDate(d.value);
                  setSelectedSlot(null);
                }}
                style={[styles.dayCard, active && styles.dayActive]}
              >
                <Text style={[styles.dayName, active && { color: COLORS.amber }]}>{d.dayName}</Text>
                <Text style={[styles.dayNum, active && { color: COLORS.white }]}>{d.dayNum}</Text>
                <Text style={[styles.dayMonth, active && { color: COLORS.textLight }]}>{d.month}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.stepTitle}>{t('customer.chooseTime')}</Text>
        {selectedIds.length === 0 ? (
          <Text style={styles.hint}>{t('customer.chooseServices')}</Text>
        ) : slots.length === 0 ? (
          <Text style={styles.hint}>{t('barber.noSlots')}</Text>
        ) : (
          <View style={styles.slotGrid}>
            {slots.map((sl) => {
              const disabled = sl.available === false;
              const active = selectedSlot === sl.startMin && !disabled;
              return (
                <TouchableOpacity
                  key={sl.startMin}
                  disabled={disabled}
                  onPress={() => setSelectedSlot(sl.startMin)}
                  style={[
                    styles.slotBtn,
                    disabled && styles.slotDisabled,
                    active && styles.slotActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotTxt,
                      disabled && styles.slotTxtDisabled,
                      active && styles.slotTxtActive,
                    ]}
                  >
                    {formatMin(sl.startMin)}
                  </Text>
                  {disabled ? (
                    <Text style={styles.bookedTag}>{t('customer.bookedSlot')}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {selectedIds.length > 0 && (
          <View style={[styles.summaryBox, SHADOWS.md]}>
            <View>
              <Text style={styles.sumLbl}>
                {selectedIds.length} {t('customer.totalSelected')} • {totalDuration} {t('common.mins')}
              </Text>
              <Text style={styles.sumPrice}>₹{totalPrice}</Text>
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmBooking}>
              <Text style={styles.confirmTxt}>{t('customer.confirmBookingBtn')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Booking Confirmation Popup Modal */}
      <Modal
        visible={Boolean(bookedSummary)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setBookedSummary(null);
          navigation.navigate('Home');
        }}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark-circle" size={44} color={COLORS.emerald} />
            </View>
            <Text style={styles.confirmTitle}>{t('customer.bookingConfirmedTitle')}</Text>
            <Text style={styles.confirmSvc}>{bookedSummary?.serviceName}</Text>
            <View style={styles.confirmMetaBox}>
              <Text style={styles.confirmMeta}>
                📅 {bookedSummary?.date} • ⏰ {formatMin(bookedSummary?.startMin)}
              </Text>
              <Text style={styles.confirmPrice}>₹{bookedSummary?.price || 0}</Text>
            </View>

            {shop?.acceptOnlinePayment ? (
              <TouchableOpacity
                style={styles.modalPayBtn}
                onPress={() => {
                  const appt = bookedSummary;
                  setBookedSummary(null);
                  setPayAppt(appt);
                }}
              >
                <Ionicons name="wallet-outline" size={18} color={COLORS.white} />
                <Text style={styles.modalPayTxt}>{t('customer.payOnline')}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.modalHomeBtn}
              onPress={() => {
                setBookedSummary(null);
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.modalHomeTxt}>{t('customer.goToDashboard')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalHistBtn}
              onPress={() => {
                setBookedSummary(null);
                navigation.navigate('History');
              }}
            >
              <Text style={styles.modalHistTxt}>{t('customer.viewBookings')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PaymentModal
        visible={Boolean(payAppt)}
        onClose={() => {
          setPayAppt(null);
          navigation.navigate('Home');
        }}
        appointment={payAppt}
        shop={shop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 14, paddingBottom: 30 },
  stepTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginTop: 12, marginBottom: 10 },
  svcCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  svcActive: { borderColor: COLORS.amber, backgroundColor: COLORS.amberBg },
  svcName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  svcMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  svcPrice: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  dayCard: {
    width: 62,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dayActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  dayName: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  dayNum: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginVertical: 2 },
  dayMonth: { fontSize: 10, color: COLORS.textMuted },
  hint: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  slotDisabled: { backgroundColor: COLORS.surface, borderColor: COLORS.border, opacity: 0.65 },
  slotTxt: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  slotTxtActive: { color: COLORS.amber },
  slotTxtDisabled: { textDecorationLine: 'line-through', color: COLORS.textLight },
  bookedTag: { fontSize: 9, fontWeight: '700', color: COLORS.red, textAlign: 'center', marginTop: 2 },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.emeraldBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: { fontSize: 19, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  confirmSvc: { fontSize: 14, fontWeight: '700', color: COLORS.amberDark, marginTop: 6, textAlign: 'center' },
  confirmMetaBox: {
    width: '100%',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmMeta: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  confirmPrice: { fontSize: 20, fontWeight: '800', color: COLORS.dark, marginTop: 4 },
  modalPayBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.emerald,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 16,
  },
  modalPayTxt: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  modalHomeBtn: {
    width: '100%',
    backgroundColor: COLORS.amber,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  modalHomeTxt: { color: COLORS.dark, fontWeight: '800', fontSize: 14 },
  modalHistBtn: { paddingVertical: 10, marginTop: 4 },
  modalHistTxt: { color: COLORS.textMuted, fontWeight: '700', fontSize: 13 },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  sumLbl: { color: COLORS.amberLight, fontSize: 12, fontWeight: '600' },
  sumPrice: { color: COLORS.white, fontSize: 20, fontWeight: '800', marginTop: 2 },
  confirmBtn: {
    backgroundColor: COLORS.amber,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmTxt: { color: COLORS.dark, fontWeight: '800', fontSize: 14 },
});
