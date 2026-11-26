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

export default function BarberBillingScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [tab, setTab] = useState('services'); // 'services' | 'invoices'
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
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
  const [selectedApptId, setSelectedApptId] = useState('');
  const [discount, setDiscount] = useState('0');
  const [taxPct, setTaxPct] = useState('0');
  const [method, setMethod] = useState('cash');

  const load = useCallback(async () => {
    try {
      const [sRes, iRes, aRes] = await Promise.all([
        api.get('/barber/services'),
        api.get('/barber/invoices'),
        api.get('/barber/appointments?all=true'),
      ]);
      setServices((sRes.data || []).filter((x) => x.active !== false));
      setInvoices(iRes.data || []);
      const appts = Array.isArray(aRes.data) ? aRes.data : aRes.data?.appointments || [];
      setBillableAppts(appts.filter((a) => ['confirmed', 'in_progress'].includes(a.status)));
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const generateBill = async () => {
    if (!selectedApptId) {
      return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
    }
    try {
      const { data } = await api.post('/barber/invoices', {
        appointmentId: selectedApptId,
        discount: Number(discount || 0),
        taxPct: Number(taxPct || 0),
        method,
      });
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
      setBillModal(false);
      load();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader showNotifications />

      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setTab('services')}
          style={[styles.tabBtn, tab === 'services' && styles.tabActive]}
        >
          <Text style={[styles.tabTxt, tab === 'services' && styles.tabTxtActive]}>
            {t('barber.servicesTab')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('invoices')}
          style={[styles.tabBtn, tab === 'invoices' && styles.tabActive]}
        >
          <Text style={[styles.tabTxt, tab === 'invoices' && styles.tabTxtActive]}>
            {t('barber.invoicesTab')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        {tab === 'services' ? (
          <TouchableOpacity style={styles.primaryBarBtn} onPress={openAddSvc}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.dark} />
            <Text style={styles.primaryBarTxt}>{t('barber.addService')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryBarBtn}
            onPress={() => {
              setSelectedApptId(billableAppts[0]?._id || '');
              setDiscount('0');
              setTaxPct('0');
              setMethod('cash');
              setBillModal(true);
            }}
          >
            <Ionicons name="receipt-outline" size={18} color={COLORS.dark} />
            <Text style={styles.primaryBarTxt}>{t('barber.generateBill')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {tab === 'services' ? (
        <FlatList
          data={services}
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
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.sub}>
                  ₹{item.price} • {item.duration} {t('common.mins')}
                </Text>
                {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => openEditSvc(item)} style={{ padding: 8 }}>
                <Ionicons name="create-outline" size={20} color={COLORS.amberDark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteService(item._id)} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={20} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={invoices}
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
                <Text style={styles.title}>{item.customerId?.name || 'Walk-In'}</Text>
                <Text style={styles.sub}>
                  {(item.items || []).map((x) => x.name).join(', ')}
                </Text>
                <Text style={styles.desc}>
                  {String(item.method || 'cash').toUpperCase()} • {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.invTotal}>₹{item.total}</Text>
            </View>
          )}
        />
      )}

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
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('barber.generateBill')}</Text>
              <TouchableOpacity onPress={() => setBillModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {billableAppts.length === 0 ? (
              <Text style={styles.empty}>{t('common.noData')}</Text>
            ) : (
              <>
                {billableAppts.slice(0, 6).map((a) => (
                  <TouchableOpacity
                    key={a._id}
                    onPress={() => setSelectedApptId(a._id)}
                    style={[styles.apptPick, selectedApptId === a._id && styles.apptPickActive]}
                  >
                    <Text style={styles.apptPickTxt}>
                      {a.customerId?.name || 'Walk-In'} • {a.serviceName} (₹{a.price})
                    </Text>
                  </TouchableOpacity>
                ))}
                <TextInput style={styles.input} placeholder={t('barber.discount')} keyboardType="numeric" value={discount} onChangeText={setDiscount} />
                <TextInput style={styles.input} placeholder={t('barber.taxPct')} keyboardType="numeric" value={taxPct} onChangeText={setTaxPct} />
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
                <TouchableOpacity style={styles.saveBtn} onPress={generateBill}>
                  <Text style={styles.saveBtnText}>{t('barber.generateBill')}</Text>
                </TouchableOpacity>
              </>
            )}
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
  apptPick: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  apptPickActive: { borderColor: COLORS.amber, backgroundColor: COLORS.amberBg },
  apptPickTxt: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  mBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  mBtnActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  mTxt: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  mTxtActive: { color: COLORS.amber },
});
