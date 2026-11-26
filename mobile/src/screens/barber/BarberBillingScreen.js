import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { uiSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import { COLORS, SHADOWS } from '../../theme';

export default function BarberBillingScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const refreshTrigger = useSelector((s) => s.ui.refreshTrigger);

  const [tab, setTab] = useState('invoices'); // 'invoices' | 'services'
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [billableAppts, setBillableAppts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Service modal
  const [svcModal, setSvcModal] = useState(false);
  const [svcId, setSvcId] = useState(null);
  const [svcName, setSvcName] = useState('');
  const [svcPrice, setSvcPrice] = useState('');
  const [svcDuration, setSvcDuration] = useState('30');
  const [svcDesc, setSvcDesc] = useState('');

  // Bill modal
  const [billModal, setBillModal] = useState(false);
  const [billMode, setBillMode] = useState('appointment'); // 'appointment' | 'direct'
  const [selectedApptId, setSelectedApptId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [discount, setDiscount] = useState('0');
  const [taxPct, setTaxPct] = useState('0');
  const [method, setMethod] = useState('cash');

  // Receipt Modal
  const [receipt, setReceipt] = useState(null);

  const load = useCallback(async () => {
    try {
      const [sRes, iRes, aRes, cRes] = await Promise.all([
        api.get('/barber/services'),
        api.get('/barber/invoices'),
        api.get('/barber/appointments?all=true'),
        api.get('/barber/customers'),
      ]);
      setServices((sRes.data || []).filter((x) => x.active !== false));
      const invList = iRes.data || [];
      setInvoices(invList);
      setCustomers(cRes.data || []);

      const billedApptIds = new Set(
        invList.map((inv) => inv.appointmentId?._id || inv.appointmentId).filter(Boolean).map(String)
      );
      const appts = Array.isArray(aRes.data) ? aRes.data : aRes.data?.appointments || [];
      setBillableAppts(
        appts.filter(
          (a) =>
            ['confirmed', 'in_progress', 'completed'].includes(a.status) &&
            !billedApptIds.has(String(a._id))
        )
      );
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  const openAddSvc = () => {
    setSvcId(null);
    setSvcName('');
    setSvcPrice('');
    setSvcDuration('30');
    setSvcDesc('');
    setSvcModal(true);
  };

  const openEditSvc = (s) => {
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

  const liveSubtotal = useMemo(() => {
    if (billMode === 'appointment') {
      const a = billableAppts.find((x) => x._id === selectedApptId);
      return Number(a?.price || 0);
    }
    return services
      .filter((s) => selectedServiceIds.includes(s._id))
      .reduce((sum, s) => sum + Number(s.price || 0), 0);
  }, [billMode, billableAppts, selectedApptId, services, selectedServiceIds]);

  const liveFinalTotal = useMemo(() => {
    const disc = Math.max(0, Number(discount || 0));
    const tax = Math.max(0, Number(taxPct || 0));
    return Math.max(0, Math.round((liveSubtotal - disc) * (1 + tax / 100)));
  }, [liveSubtotal, discount, taxPct]);

  const generateBill = async () => {
    const payload = {
      discount: Number(discount || 0),
      taxPct: Number(taxPct || 0),
      method,
    };

    if (billMode === 'appointment') {
      if (!selectedApptId) {
        return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
      }
      payload.appointmentId = selectedApptId;
    } else {
      if (!selectedCustomerId || selectedServiceIds.length === 0) {
        return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
      }
      payload.customerId = selectedCustomerId;
      payload.serviceIds = selectedServiceIds;
    }

    try {
      const { data } = await api.post('/barber/invoices', payload);
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
      setBillModal(false);
      if (data.data) setReceipt(data.data);
      load();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  const shareReceipt = async (inv) => {
    if (!inv) return;
    const itemLines = (inv.items || []).map((i) => `• ${i.name}: ₹${i.price}`).join('\n');
    const text = `BarberPro ${t('barber.billReceipt')}\nCustomer: ${inv.customerId?.name || 'Walk-In'}\n${itemLines}\nDiscount: ₹${inv.discount || 0}\nTax: ${inv.taxPct || 0}%\nTotal Paid: ₹${inv.total} (${String(inv.method || 'cash').toUpperCase()})`;
    try {
      await Share.share({ message: text });
    } catch {}
  };

  const toggleSvcPick = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('barber.invoicesTab')} showNotifications />

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.primaryBarBtn}
          onPress={() => {
            setBillMode(billableAppts.length > 0 ? 'appointment' : 'direct');
            setSelectedApptId(billableAppts[0]?._id || '');
            setSelectedCustomerId(customers[0]?._id || '');
            setSelectedServiceIds([]);
            setDiscount('0');
            setTaxPct('0');
            setMethod('cash');
            setBillModal(true);
          }}
        >
          <Ionicons name="receipt-outline" size={18} color={COLORS.dark} />
          <Text style={styles.primaryBarTxt}>{t('barber.generateBill')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={invoices}
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
            <TouchableOpacity
              style={[styles.card, SHADOWS.sm]}
              onPress={() => setReceipt(item)}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.customerId?.name || 'Walk-In'}</Text>
                <Text style={styles.sub}>
                  {(item.items || []).map((x) => x.name).join(', ')}
                </Text>
                <Text style={styles.desc}>
                  {String(item.method || 'cash').toUpperCase()} • {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.invTotal}>₹{item.total}</Text>
                <Ionicons name="document-text-outline" size={16} color={COLORS.textMuted} style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          )}
        />

      {/* Service Modal */}
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

      {/* Generate Bill Modal */}
      <Modal visible={billModal} transparent animationType="slide" onRequestClose={() => setBillModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('barber.generateBill')}</Text>
              <TouchableOpacity onPress={() => setBillModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modeRow}>
              <TouchableOpacity
                onPress={() => setBillMode('appointment')}
                style={[styles.modeBtn, billMode === 'appointment' && styles.modeBtnActive]}
              >
                <Text style={[styles.modeTxt, billMode === 'appointment' && styles.modeTxtActive]}>
                  {t('barber.fromAppointment')} ({billableAppts.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBillMode('direct')}
                style={[styles.modeBtn, billMode === 'direct' && styles.modeBtnActive]}
              >
                <Text style={[styles.modeTxt, billMode === 'direct' && styles.modeTxtActive]}>
                  {t('barber.directQuickBill')}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {billMode === 'appointment' ? (
                billableAppts.length === 0 ? (
                  <Text style={styles.empty}>{t('common.noData')}</Text>
                ) : (
                  billableAppts.map((a) => (
                    <TouchableOpacity
                      key={a._id}
                      onPress={() => setSelectedApptId(a._id)}
                      style={[styles.apptPick, selectedApptId === a._id && styles.apptPickActive]}
                    >
                      <Text style={styles.apptPickTxt}>
                        {a.customerId?.name || 'Walk-In'} • {a.serviceName} (₹{a.price})
                      </Text>
                      <Text style={styles.desc}>{a.date}</Text>
                    </TouchableOpacity>
                  ))
                )
              ) : (
                <>
                  <Text style={styles.lbl}>{t('barber.selectCustomer')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {customers.slice(0, 25).map((c) => (
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

                  <Text style={styles.lbl}>{t('barber.selectServices')}</Text>
                  <View style={styles.svcWrap}>
                    {services.map((s) => {
                      const active = selectedServiceIds.includes(s._id);
                      return (
                        <TouchableOpacity
                          key={s._id}
                          onPress={() => toggleSvcPick(s._id)}
                          style={[styles.svcChip, active && styles.svcChipActive]}
                        >
                          <Text style={[styles.svcChipTxt, active && styles.svcChipTxtActive]}>
                            {s.name} • ₹{s.price}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lbl}>{t('barber.discount')}</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={discount} onChangeText={setDiscount} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lbl}>{t('barber.taxPct')}</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={taxPct} onChangeText={setTaxPct} />
                </View>
              </View>

              <Text style={styles.lbl}>{t('barber.paymentMethod')}</Text>
              <View style={styles.methodRow}>
                {['cash', 'upi', 'card'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMethod(m)}
                    style={[styles.mBtn, method === m && styles.mBtnActive]}
                  >
                    <Text style={[styles.mTxt, method === m && styles.mTxtActive]}>
                      {t(`barber.${m}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Live Bill Summary */}
              <View style={styles.calcBox}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLbl}>{t('barber.subtotal')}</Text>
                  <Text style={styles.calcVal}>₹{liveSubtotal}</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcTotalLbl}>{t('barber.finalTotal')}</Text>
                  <Text style={styles.calcTotalVal}>₹{liveFinalTotal}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={generateBill}>
                <Text style={styles.saveBtnText}>
                  {t('barber.generateBill')} • ₹{liveFinalTotal}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bill Receipt Modal */}
      <Modal visible={Boolean(receipt)} transparent animationType="fade" onRequestClose={() => setReceipt(null)}>
        <View style={styles.receiptBackdrop}>
          <View style={styles.receiptCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('barber.billReceipt')}</Text>
              <TouchableOpacity onPress={() => setReceipt(null)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>{receipt?.customerId?.name || 'Walk-In'}</Text>
            <Text style={styles.desc}>
              {receipt?.customerId?.mobile || ''} • {receipt?.createdAt ? new Date(receipt.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true }) : ''}
            </Text>

            <View style={styles.receiptItems}>
              {(receipt?.items || []).map((it, idx) => (
                <View key={idx} style={styles.calcRow}>
                  <Text style={styles.calcLbl}>{it.name}</Text>
                  <Text style={styles.calcVal}>₹{it.price}</Text>
                </View>
              ))}
              {Number(receipt?.discount || 0) > 0 && (
                <View style={styles.calcRow}>
                  <Text style={styles.calcLbl}>{t('barber.discount')}</Text>
                  <Text style={[styles.calcVal, { color: COLORS.red }]}>-₹{receipt.discount}</Text>
                </View>
              )}
              {Number(receipt?.taxPct || 0) > 0 && (
                <View style={styles.calcRow}>
                  <Text style={styles.calcLbl}>{t('barber.taxPct')}</Text>
                  <Text style={styles.calcVal}>{receipt.taxPct}%</Text>
                </View>
              )}
              <View style={[styles.calcRow, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 6 }]}>
                <Text style={styles.calcTotalLbl}>{t('barber.finalTotal')}</Text>
                <Text style={[styles.calcTotalVal, { color: COLORS.emerald }]}>₹{receipt?.total || 0}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={() => shareReceipt(receipt)}>
              <Text style={styles.saveBtnText}>{t('barber.shareReceipt')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  tabsRow: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.amber },
  tabTxt: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  tabTxtActive: { color: COLORS.dark },
  actionBar: { padding: 12, paddingBottom: 4 },
  primaryBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.amber,
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryBarTxt: { fontSize: 14, fontWeight: '800', color: COLORS.dark },
  empty: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 30 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sub: { fontSize: 13, color: COLORS.amberDark, fontWeight: '600', marginTop: 2 },
  desc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  invTotal: { fontSize: 17, fontWeight: '800', color: COLORS.emerald },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: COLORS.surface, alignItems: 'center' },
  modeBtnActive: { backgroundColor: COLORS.dark },
  modeTxt: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  modeTxtActive: { color: COLORS.amber },
  lbl: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 5, marginTop: 4 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.surface, marginRight: 8 },
  pillActive: { backgroundColor: COLORS.dark },
  pillTxt: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  pillTxtActive: { color: COLORS.amber },
  svcWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
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
  row2: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 10,
  },
  saveBtn: { backgroundColor: COLORS.amber, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  saveBtnText: { fontWeight: '800', color: COLORS.dark, fontSize: 15 },
  apptPick: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  apptPickActive: { borderColor: COLORS.amber, backgroundColor: COLORS.amberBg },
  apptPickTxt: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  mBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  mBtnActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  mTxt: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  mTxtActive: { color: COLORS.amber },
  calcBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  calcLbl: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  calcVal: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
  calcTotalLbl: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  calcTotalVal: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  receiptBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
  },
  receiptItems: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
