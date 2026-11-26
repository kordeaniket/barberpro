import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { uiSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import StatusBadge from '../../components/StatusBadge';
import { formatMin, todayStr } from '../../utils/time';
import { COLORS, SHADOWS } from '../../theme';

export default function BarberAppointmentsScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const refreshTrigger = useSelector((s) => s.ui.refreshTrigger);

  const [appointments, setAppointments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // New Booking Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const loadAppointments = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: '20',
          sort: '-createdAt',
          paginate: 'true',
        });
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (search.trim()) params.set('search', search.trim());
        const { data } = await api.get(`/barber/appointments?${params.toString()}`, {
          skipGlobalLoader: append,
        });
        const list = Array.isArray(data) ? data : data.appointments || [];
        setPage(pageNum);
        setTotalPages(data.totalPages || 1);
        setAppointments((prev) => (append ? [...prev, ...list] : list));
      } catch {}
    },
    [statusFilter, search]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAppointments(1, false);
    }, 200);
    return () => clearTimeout(timer);
  }, [loadAppointments, refreshTrigger]);

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await loadAppointments(page + 1, true);
    setLoadingMore(false);
  };

  const openNewModal = async () => {
    setModalOpen(true);
    setSelectedCustomerId('');
    setClientName('');
    setClientMobile('');
    setSelectedServiceIds([]);
    setSelectedSlot(null);
    setDate(todayStr());
    try {
      const [svcRes, custRes] = await Promise.all([
        api.get('/barber/services'),
        api.get('/barber/customers'),
      ]);
      setServices((svcRes.data || []).filter((x) => x.active !== false));
      setCustomers(custRes.data || []);
    } catch {}
  };

  useEffect(() => {
    if (!modalOpen || !date || selectedServiceIds.length === 0) {
      setSlots([]);
      return;
    }
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    api
      .get(`/barber/slots?date=${date}&serviceIds=${selectedServiceIds.join(',')}&nowMin=${nowMin}&clientDate=${todayStr()}`, {
        skipGlobalLoader: true,
      })
      .then((res) => setSlots(res.data || []))
      .catch(() => setSlots([]));
  }, [modalOpen, date, selectedServiceIds]);

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/barber/appointments/${id}`, { status });
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message || 'Updated' }));
      loadAppointments();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  const sendReminder = async (id) => {
    try {
      await api.post(`/barber/appointments/${id}/send-reminder`);
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: t('barber.reminderSent') }));
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  const createAppointment = async () => {
    if (selectedServiceIds.length === 0 || selectedSlot === null) {
      return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
    }
    if (!selectedCustomerId && (!clientName.trim() || !clientMobile.trim())) {
      return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
    }
    try {
      const body = {
        date,
        startMin: selectedSlot,
        serviceIds: selectedServiceIds,
        ...(selectedCustomerId
          ? { customerId: selectedCustomerId }
          : { clientName: clientName.trim(), clientMobile: clientMobile.trim() }),
      };
      const { data } = await api.post('/barber/appointments', body);
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
      setModalOpen(false);
      loadAppointments();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  const filtered = appointments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const cName = (a.customerId?.name || '').toLowerCase();
      const cMob = (a.customerId?.mobile || '').toLowerCase();
      const svc = (a.serviceName || '').toLowerCase();
      if (!cName.includes(q) && !cMob.includes(q) && !svc.includes(q)) return false;
    }
    return true;
  });

  const toggleService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSelectedSlot(null);
  };

  return (
    <View style={styles.container}>
      <AppHeader showNotifications />

      <View style={styles.topControls}>
        <View style={styles.searchRow}>
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
          <TouchableOpacity style={styles.addBtn} onPress={openNewModal}>
            <Ionicons name="add" size={22} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => setStatusFilter(st)}
              style={[styles.chip, statusFilter === st && styles.chipActive]}
            >
              <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>
                {st === 'all' ? t('common.all') : t(`status.${st}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator size="small" color={COLORS.amber} style={{ paddingVertical: 14 }} /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadAppointments(1, false);
              setRefreshing(false);
            }}
            tintColor={COLORS.amber}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('common.noData')}</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, SHADOWS.sm]}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.custName}>{item.customerId?.name || 'Walk-In'}</Text>
                <Text style={styles.custMob}>{item.customerId?.mobile || ''}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {item.customerId?.mobile ? (
                  <>
                    <TouchableOpacity
                      style={styles.quickIconBtn}
                      onPress={() => Linking.openURL(`tel:${item.customerId.mobile}`)}
                    >
                      <Ionicons name="call-outline" size={15} color={COLORS.dark} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickIconBtn, { backgroundColor: COLORS.emeraldBg }]}
                      onPress={() => Linking.openURL(`https://wa.me/91${item.customerId.mobile.replace(/\D/g, '').slice(-10)}`)}
                    >
                      <Ionicons name="logo-whatsapp" size={15} color={COLORS.emerald} />
                    </TouchableOpacity>
                  </>
                ) : null}
                <StatusBadge status={item.status} />
              </View>
            </View>

            <Text style={styles.serviceTxt}>{item.serviceName}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaTxt}>
                📅 {item.date} • ⏰ {formatMin(item.startMin)}
              </Text>
              <Text style={styles.priceTxt}>₹{item.price || 0}</Text>
            </View>

            <View style={styles.actionsRow}>
              {item.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.actBtn, { backgroundColor: COLORS.blueBg }]}
                  onPress={() => updateStatus(item._id, 'confirmed')}
                >
                  <Text style={[styles.actText, { color: COLORS.blue }]}>
                    {t('barber.confirmBooking')}
                  </Text>
                </TouchableOpacity>
              )}
              {(item.status === 'pending' || item.status === 'confirmed') && (
                <TouchableOpacity
                  style={[styles.actBtn, { backgroundColor: COLORS.purpleBg }]}
                  onPress={() => updateStatus(item._id, 'in_progress')}
                >
                  <Text style={[styles.actText, { color: COLORS.purple }]}>
                    {t('barber.startService')}
                  </Text>
                </TouchableOpacity>
              )}
              {['pending', 'confirmed', 'in_progress'].includes(item.status) && (
                <>
                  <TouchableOpacity
                    style={[styles.actBtn, { backgroundColor: COLORS.emeraldBg }]}
                    onPress={() => updateStatus(item._id, 'completed')}
                  >
                    <Text style={[styles.actText, { color: COLORS.emerald }]}>
                      {t('barber.completeService')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actBtn, { backgroundColor: COLORS.amberBg }]}
                    onPress={() => sendReminder(item._id)}
                  >
                    <Text style={[styles.actText, { color: COLORS.amberDark }]}>
                      {t('barber.sendReminder')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actBtn, { backgroundColor: COLORS.redBg }]}
                    onPress={() => updateStatus(item._id, 'cancelled')}
                  >
                    <Text style={[styles.actText, { color: COLORS.red }]}>
                      {t('barber.cancelBooking')}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {['confirmed', 'in_progress', 'completed'].includes(item.status) && (
                <TouchableOpacity
                  style={[styles.actBtn, { backgroundColor: COLORS.dark }]}
                  onPress={() => navigation.navigate('Billing')}
                >
                  <Text style={[styles.actText, { color: COLORS.amber }]}>
                    {t('barber.generateBill')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {/* New Appointment Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('barber.walkInBooking')}</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.lbl}>{t('barber.selectCustomer')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                <TouchableOpacity
                  onPress={() => setSelectedCustomerId('')}
                  style={[styles.pill, !selectedCustomerId && styles.pillActive]}
                >
                  <Text style={[styles.pillTxt, !selectedCustomerId && styles.pillTxtActive]}>
                    + {t('barber.orNewClient')}
                  </Text>
                </TouchableOpacity>
                {customers.slice(0, 20).map((c) => (
                  <TouchableOpacity
                    key={c._id}
                    onPress={() => setSelectedCustomerId(c._id)}
                    style={[styles.pill, selectedCustomerId === c._id && styles.pillActive]}
                  >
                    <Text style={[styles.pillTxt, selectedCustomerId === c._id && styles.pillTxtActive]}>
                      {c.name} ({c.mobile})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {!selectedCustomerId && (
                <View style={styles.newCustBox}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('barber.clientName')}
                    placeholderTextColor={COLORS.textLight}
                    value={clientName}
                    onChangeText={setClientName}
                  />
                  <TextInput
                    style={[styles.input, { marginTop: 8 }]}
                    placeholder={t('barber.clientMobile')}
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={clientMobile}
                    onChangeText={setClientMobile}
                  />
                </View>
              )}

              <Text style={styles.lbl}>{t('barber.selectServices')}</Text>
              <View style={styles.svcWrap}>
                {services.map((s) => {
                  const active = selectedServiceIds.includes(s._id);
                  return (
                    <TouchableOpacity
                      key={s._id}
                      onPress={() => toggleService(s._id)}
                      style={[styles.svcChip, active && styles.svcChipActive]}
                    >
                      <Text style={[styles.svcChipTxt, active && styles.svcChipTxtActive]}>
                        {s.name} • ₹{s.price} ({s.duration}m)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.lbl}>{t('barber.selectDate')}</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.lbl}>{t('barber.selectSlot')}</Text>
              {slots.length === 0 ? (
                <Text style={styles.noSlots}>{t('barber.noSlots')}</Text>
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
                          disabled && styles.slotBtnDisabled,
                          active && styles.slotBtnActive,
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
                        {disabled ? <Text style={styles.bookedTag}>{t('customer.bookedSlot')}</Text> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity style={styles.submitBtn} onPress={createAppointment}>
                <Text style={styles.submitBtnText}>{t('barber.createBooking')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topControls: { backgroundColor: COLORS.white, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
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
  chips: { gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.dark },
  chipText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  chipTextActive: { color: COLORS.amber },
  empty: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 40 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  quickIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  custName: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  custMob: { fontSize: 12, color: COLORS.textMuted },
  serviceTxt: { fontSize: 13, fontWeight: '600', color: COLORS.amberDark, marginTop: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  metaTxt: { fontSize: 12, color: COLORS.textMuted },
  priceTxt: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  actBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actText: { fontSize: 11, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  lbl: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginTop: 12, marginBottom: 6 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.surface, marginRight: 8 },
  pillActive: { backgroundColor: COLORS.dark },
  pillTxt: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  pillTxtActive: { color: COLORS.amber },
  newCustBox: { marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  svcWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  svcChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  svcChipActive: { backgroundColor: COLORS.amberBg, borderColor: COLORS.amber },
  svcChipTxt: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  svcChipTxtActive: { color: COLORS.dark, fontWeight: '700' },
  noSlots: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotBtnActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  slotBtnDisabled: { backgroundColor: COLORS.surface, borderColor: COLORS.border, opacity: 0.65 },
  slotTxt: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  slotTxtActive: { color: COLORS.amber },
  slotTxtDisabled: { textDecorationLine: 'line-through', color: COLORS.textLight },
  bookedTag: { fontSize: 9, fontWeight: '700', color: COLORS.red, textAlign: 'center', marginTop: 1 },
  submitBtn: {
    backgroundColor: COLORS.amber,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
});
