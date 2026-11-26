import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { authSlice, uiSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ChangePasswordCard from '../../components/ChangePasswordCard';
import SalonPickerModal from '../../components/SalonPickerModal';
import { pickImageAsDataUrl } from '../../utils/imagePicker';
import { COLORS, SHADOWS } from '../../theme';

export default function CustomerProfileScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [notes, setNotes] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [activeShops, setActiveShops] = useState([]);
  const [salonModalOpen, setSalonModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ data }, shopsRes] = await Promise.all([
        api.get('/customer/profile'),
        api.get('/customer/shops', { skipGlobalLoader: true }),
      ]);
      const u = data.user || {};
      const c = data.customer || {};
      setName(u.name || '');
      setEmail(u.email || '');
      setAvatarUrl(u.avatarUrl || '');
      setDob(c.dob || '');
      setGender(c.gender || '');
      setNotes(c.notes || '');
      setActiveShops(shopsRes.data?.activeShops || []);
    } catch {}
  }, []);

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
  }, [load]);

  const pickAvatar = async () => {
    try {
      const dataUrl = await pickImageAsDataUrl();
      if (dataUrl) setAvatarUrl(dataUrl);
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e.message }));
    }
  };

  const saveProfile = async () => {
    try {
      const { data } = await api.patch('/customer/profile', {
        name,
        email,
        dob,
        gender,
        notes,
        avatarUrl,
      });
      dispatch(authSlice.actions.updateUser({ name: data.user?.name }));
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader showNotifications />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, SHADOWS.sm]}>
          <View style={styles.imgRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, styles.imgPlaceholder]}>
                <Ionicons name="person" size={30} color={COLORS.textLight} />
              </View>
            )}
            <View style={{ flex: 1, gap: 8 }}>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickAvatar}>
                <Ionicons name="cloud-upload-outline" size={16} color={COLORS.dark} />
                <Text style={styles.uploadTxt}>{t('barber.uploadPhoto')}</Text>
              </TouchableOpacity>
              {avatarUrl ? (
                <TouchableOpacity onPress={() => setAvatarUrl('')}>
                  <Text style={styles.removeTxt}>{t('barber.removePhoto')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <Text style={styles.lbl}>{t('auth.fullName')}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.lbl}>{t('auth.emailOptional')}</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Text style={styles.lbl}>{t('customer.dob')}</Text>
          <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" />
          <Text style={styles.lbl}>{t('customer.gender')}</Text>
          <TextInput style={styles.input} value={gender} onChangeText={setGender} />
          <Text style={styles.lbl}>{t('customer.notes')}</Text>
          <TextInput style={styles.input} value={notes} onChangeText={setNotes} />

          <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
            <Text style={styles.saveBtnTxt}>{t('barber.saveProfile')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, SHADOWS.sm]}>
          <Text style={styles.lbl}>{t('auth.activeSalon')}</Text>
          <TouchableOpacity
            style={styles.salonDropBtn}
            onPress={() => setSalonModalOpen(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Ionicons name="storefront-outline" size={18} color={COLORS.amberDark} />
              <Text style={styles.salonDropTxt} numberOfLines={1}>
                {user?.shop?.name || t('auth.chooseSalonPlaceholder')}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <LanguageSwitcher />
        <ChangePasswordCard />

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => dispatch(authSlice.actions.logout())}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
          <Text style={styles.logoutTxt}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  imgRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  avatarImg: { width: 68, height: 68, borderRadius: 34 },
  imgPlaceholder: { backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.amberBg,
    borderWidth: 1,
    borderColor: COLORS.amber,
    paddingVertical: 9,
    borderRadius: 10,
  },
  uploadTxt: { fontSize: 12, fontWeight: '700', color: COLORS.dark },
  removeTxt: { fontSize: 12, fontWeight: '700', color: COLORS.red },
  lbl: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginTop: 10, marginBottom: 5 },
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
  saveBtn: {
    backgroundColor: COLORS.amber,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnTxt: { fontWeight: '800', color: COLORS.dark, fontSize: 14 },
  salonDropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  salonDropTxt: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.red,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  logoutTxt: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});
