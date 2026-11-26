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
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { uiSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import StatusBadge from '../../components/StatusBadge';
import { COLORS, SHADOWS } from '../../theme';

export default function BarberClientsScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [clients, setClients] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Add/Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Ledger Modal
  const [ledger, setLedger] = useState(null);

  const load = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        const params = new URLSearchParams({ page: String(pageNum), limit: '20' });
        if (search.trim()) params.set('search', search.trim());
        const { data } = await api.get(`/barber/customers-paginated?${params.toString()}`, {
          skipGlobalLoader: append,
        });
        const list = data.customers || [];
        setPage(pageNum);
        setTotalPages(data.totalPages || 1);
        setClients((prev) => (append ? [...prev, ...list] : list));
      } catch {}
    },
    [search]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(1, false), 200);
    return () => clearTimeout(timer);
  }, [load]);

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await load(page + 1, true);
    setLoadingMore(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setMobile('');
    setEmail('');
    setNotes('');
    setEditOpen(true);
  };

  const openEdit = (c) => {
    setEditingId(c._id);
    setName(c.name || '');
    setMobile(c.mobile || '');
    setEmail(c.email || '');
    setNotes(c.notes || '');
    setEditOpen(true);
  };

  const saveClient = async () => {
    if (!name.trim() || !mobile.trim()) {
      return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
    }
    try {
      const body = { name: name.trim(), mobile: mobile.trim(), email: email.trim(), notes: notes.trim() };
      if (editingId) {
        await api.patch(`/barber/customers/${editingId}`, body);
      } else {
        await api.post('/barber/customers', body);
      }
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: t('common.done') }));
      setEditOpen(false);
      load();
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  const openLedger = async (id) => {
    try {
      const { data } = await api.get(`/barber/customers/${id}/ledger`);
      setLedger(data);
    } catch {}
  };

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.mobile || '').toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      <AppHeader showNotifications />
      <View style={styles.topRow}>
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
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="person-add" size={20} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={clients}
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
              await load(1, false);
              setRefreshing(false);
            }}
            tintColor={COLORS.amber}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('common.noData')}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, SHADOWS.sm]}
            onPress={() => openLedger(item._id)}
            activeOpacity={0.85}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{(item.name || 'C')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.mobile}</Text>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            </View>
            {item.mobile ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${item.mobile}`)}
                style={styles.editBtn}
              >
                <Ionicons name="call-outline" size={19} color={COLORS.emerald} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
              <Ionicons name="create-outline" size={20} color={COLORS.amberDark} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? t('barber.editClient') : t('barber.addClient')}
              </Text>
              <TouchableOpacity onPress={() => setEditOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder={t('barber.clientName')} value={name} onChangeText={setName} />
            <TextInput
              style={styles.input}
              placeholder={t('barber.clientMobile')}
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
            />
            <TextInput
              style={styles.input}
              placeholder={t('auth.emailOptional')}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder={t('customer.notes')}
              value={notes}
              onChangeText={setNotes}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveClient}>
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ledger Modal */}
      <Modal visible={Boolean(ledger)} transparent animationType="slide" onRequestClose={() => setLedger(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {ledger?.customer?.name} — {t('barber.clientLedger')}
              </Text>
              <TouchableOpacity onPress={() => setLedger(null)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              <View style={styles.ledgerStats}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{ledger?.stats?.totalVisits || 0}</Text>
                  <Text style={styles.statLbl}>{t('barber.totalVisits')}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: COLORS.blue }]}>
                    {ledger?.stats?.completedVisits || 0}
                  </Text>
                  <Text style={styles.statLbl}>{t('barber.completed')}</Text>
                </View>
              </View>
              <View style={styles.ledgerStats}>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: COLORS.emerald }]}>
                    ₹{ledger?.stats?.billedAmount || 0}
                  </Text>
                  <Text style={styles.statLbl}>{t('barber.billedAmount')}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: COLORS.amberDark }]}>
                    ₹{ledger?.stats?.completedServiceAmount || 0}
                  </Text>
                  <Text style={styles.statLbl}>{t('barber.serviceValue')}</Text>
                </View>
              </View>

              {(ledger?.serviceBreakdown || []).length > 0 && (
                <View style={styles.breakdownCard}>
                  <Text style={styles.secHeading}>{t('barber.serviceBreakdown')}</Text>
                  {ledger.serviceBreakdown.map((sb) => (
                    <View key={sb.name} style={styles.breakdownRow}>
                      <Text style={styles.breakdownName}>
                        {sb.name} <Text style={styles.breakdownCount}>×{sb.count}</Text>
                      </Text>
                      <Text style={styles.breakdownAmt}>₹{sb.amount}</Text>
                    </View>
                  ))}
                </View>
              )}

              {(ledger?.invoices || []).length > 0 && (
                <>
                  <Text style={styles.secHeading}>{t('barber.invoicesTab')}</Text>
                  {ledger.invoices.map((inv) => (
                    <View key={inv._id} style={styles.histRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.histSvc}>
                          {(inv.items || []).map((i) => i.name).join(', ')}
                        </Text>
                        <Text style={styles.histDate}>
                          {String(inv.method || 'cash').toUpperCase()} • {new Date(inv.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={[styles.histPrice, { color: COLORS.emerald }]}>₹{inv.total}</Text>
                    </View>
                  ))}
                </>
              )}

              <Text style={[styles.secHeading, { marginTop: 12 }]}>{t('barber.bookings')}</Text>
              {(ledger?.appointments || []).length === 0 ? (
                <Text style={styles.empty}>{t('common.noData')}</Text>
              ) : (
                (ledger?.appointments || []).map((a) => (
                  <View key={a._id} style={styles.histRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.histSvc}>{a.serviceName}</Text>
                      <Text style={styles.histDate}>{a.date}</Text>
                    </View>
                    <Text style={styles.histPrice}>₹{a.price}</Text>
                    <StatusBadge status={a.status} />
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
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
  empty: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.amberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontSize: 16, fontWeight: '800', color: COLORS.amberDark },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted },
  notes: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  editBtn: { padding: 8 },
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
  saveBtn: {
    backgroundColor: COLORS.amber,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: { fontWeight: '800', color: COLORS.dark, fontSize: 15 },
  ledgerStats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statVal: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  statLbl: { fontSize: 11, color: COLORS.textMuted },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  histSvc: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  histDate: { fontSize: 11, color: COLORS.textMuted },
  histPrice: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  secHeading: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, marginBottom: 6, marginTop: 4 },
  breakdownCard: {
    backgroundColor: COLORS.amberBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.amberLight,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownName: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  breakdownCount: { color: COLORS.amberDark, fontWeight: '800' },
  breakdownAmt: { fontSize: 13, fontWeight: '800', color: COLORS.emerald },
});
