import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { authSlice, uiSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import AppHeader from '../../components/AppHeader';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ChangePasswordCard from '../../components/ChangePasswordCard';
import { pickImageAsDataUrl } from '../../utils/imagePicker';
import { COLORS, SHADOWS } from '../../theme';

export default function BarberProfileScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [tab, setTab] = useState('profile'); // 'profile' | 'store' | 'payments'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Store fields
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [shopMobile, setShopMobile] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [customerLink, setCustomerLink] = useState('');

  // Payment fields
  const [acceptOnlinePayment, setAcceptOnlinePayment] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [gpayNumber, setGpayNumber] = useState('');
  const [phonePeNumber, setPhonePeNumber] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');

  const load = useCallback(async () => {
    try {
      const [profRes, shopRes] = await Promise.all([
        api.get('/barber/profile'),
        api.get('/barber/shop'),
      ]);
      const u = profRes.data?.user || {};
      const s = shopRes.data?.shop || profRes.data?.shop || {};
      setName(u.name || '');
      setEmail(u.email || '');
      setAvatarUrl(u.avatarUrl || '');
      setShopName(s.name || '');
      setOwnerName(s.ownerName || '');
      setShopMobile(s.mobile || '');
      setCity(s.city || '');
      setAddress(s.address || '');
      setLogoUrl(s.logoUrl || '');
      setCustomerLink(shopRes.data?.customerLink || '');
      setAcceptOnlinePayment(Boolean(s.acceptOnlinePayment));
      setUpiId(s.upiId || '');
      setGpayNumber(s.gpayNumber || '');
      setPhonePeNumber(s.phonePeNumber || '');
      setUpiQrUrl(s.upiQrUrl || '');
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePickImage = async (setter) => {
    try {
      const dataUrl = await pickImageAsDataUrl();
      if (dataUrl) setter(dataUrl);
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e.message }));
    }
  };

  const saveProfile = async () => {
    try {
      const { data } = await api.patch('/barber/profile', { name, email, avatarUrl });
      dispatch(authSlice.actions.updateUser({ name: data.user?.name }));
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  const saveStore = async () => {
    try {
      const { data } = await api.patch('/barber/shop', {
        name: shopName,
        ownerName,
        mobile: shopMobile,
        city,
        address,
        logoUrl,
      });
      dispatch(authSlice.actions.updateUserShop({ name: data.shop?.name, logoUrl: data.shop?.logoUrl }));
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  const savePayments = async () => {
    try {
      const { data } = await api.patch('/barber/shop', {
        acceptOnlinePayment,
        upiId,
        gpayNumber,
        phonePeNumber,
        upiQrUrl,
      });
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader showNotifications />

      <View style={styles.tabsRow}>
        {[
          { key: 'profile', label: t('barber.profileTab') },
          { key: 'store', label: t('barber.storeTab') },
          { key: 'payments', label: t('barber.paymentsTab') },
        ].map((tb) => (
          <TouchableOpacity
            key={tb.key}
            onPress={() => setTab(tb.key)}
            style={[styles.tabBtn, tab === tb.key && styles.tabActive]}
          >
            <Text style={[styles.tabTxt, tab === tb.key && styles.tabTxtActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'profile' && (
          <>
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
                  <TouchableOpacity style={styles.uploadBtn} onPress={() => handlePickImage(setAvatarUrl)}>
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

              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                <Text style={styles.saveBtnTxt}>{t('barber.saveProfile')}</Text>
              </TouchableOpacity>
            </View>

            <LanguageSwitcher />
            <ChangePasswordCard />

            <TouchableOpacity
              style={styles.logoutFullBtn}
              onPress={() => dispatch(authSlice.actions.logout())}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
              <Text style={styles.logoutFullTxt}>{t('common.logout')}</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === 'store' && (
          <View style={[styles.card, SHADOWS.sm]}>
            <View style={styles.imgRow}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImg} />
              ) : (
                <View style={[styles.logoImg, styles.imgPlaceholder]}>
                  <Ionicons name="storefront" size={30} color={COLORS.textLight} />
                </View>
              )}
              <View style={{ flex: 1, gap: 8 }}>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => handlePickImage(setLogoUrl)}>
                  <Ionicons name="cloud-upload-outline" size={16} color={COLORS.dark} />
                  <Text style={styles.uploadTxt}>{t('barber.uploadPhoto')}</Text>
                </TouchableOpacity>
                {logoUrl ? (
                  <TouchableOpacity onPress={() => setLogoUrl('')}>
                    <Text style={styles.removeTxt}>{t('barber.removePhoto')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <Text style={styles.lbl}>{t('barber.shopName')}</Text>
            <TextInput style={styles.input} value={shopName} onChangeText={setShopName} />
            <Text style={styles.lbl}>{t('barber.ownerName')}</Text>
            <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} />
            <Text style={styles.lbl}>{t('auth.mobileNumber')}</Text>
            <TextInput style={styles.input} value={shopMobile} onChangeText={setShopMobile} keyboardType="phone-pad" />
            <Text style={styles.lbl}>{t('auth.city')}</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} />
            <Text style={styles.lbl}>{t('auth.address')}</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} />

            {customerLink ? (
              <TouchableOpacity
                style={styles.linkBox}
                onPress={async () => {
                  await Clipboard.setStringAsync(customerLink);
                  dispatch(uiSlice.actions.setMsg({ type: 'ok', text: t('common.copied') }));
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkLbl}>{t('barber.bookingLink')}</Text>
                  <Text style={styles.linkVal} numberOfLines={1}>{customerLink}</Text>
                </View>
                <Ionicons name="copy-outline" size={18} color={COLORS.amberDark} />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.saveBtn} onPress={saveStore}>
              <Text style={styles.saveBtnTxt}>{t('barber.saveStore')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === 'payments' && (
          <View style={[styles.card, SHADOWS.sm]}>
            <View style={styles.switchRow}>
              <Text style={styles.switchTxt}>{t('barber.acceptOnlinePay')}</Text>
              <Switch
                value={acceptOnlinePayment}
                onValueChange={setAcceptOnlinePayment}
                trackColor={{ true: COLORS.amber, false: COLORS.border }}
              />
            </View>

            <Text style={styles.lbl}>{t('barber.upiId')}</Text>
            <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} autoCapitalize="none" />
            <Text style={styles.lbl}>{t('barber.gpayNumber')}</Text>
            <TextInput style={styles.input} value={gpayNumber} onChangeText={setGpayNumber} keyboardType="phone-pad" />
            <Text style={styles.lbl}>{t('barber.phonePeNumber')}</Text>
            <TextInput style={styles.input} value={phonePeNumber} onChangeText={setPhonePeNumber} keyboardType="phone-pad" />

            <Text style={styles.lbl}>{t('barber.customQr')}</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={() => handlePickImage(setUpiQrUrl)}>
              <Ionicons name="qr-code-outline" size={16} color={COLORS.dark} />
              <Text style={styles.uploadTxt}>{t('barber.uploadPhoto')}</Text>
            </TouchableOpacity>

            {(upiQrUrl || upiId) ? (
              <View style={styles.qrPreview}>
                <Text style={styles.qrLbl}>{t('barber.qrPreview')}</Text>
                {upiQrUrl ? (
                  <Image source={{ uri: upiQrUrl }} style={{ width: 150, height: 150, borderRadius: 10 }} />
                ) : (
                  <QRCode value={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName || 'Salon')}&cu=INR`} size={140} />
                )}
              </View>
            ) : null}

            <TouchableOpacity style={styles.saveBtn} onPress={savePayments}>
              <Text style={styles.saveBtnTxt}>{t('barber.savePayments')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  tabsRow: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.amber },
  tabTxt: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  tabTxtActive: { color: COLORS.dark },
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
  logoImg: { width: 68, height: 68, borderRadius: 14 },
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
    paddingHorizontal: 12,
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
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.amberBg,
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  linkLbl: { fontSize: 11, fontWeight: '700', color: COLORS.amberDark },
  linkVal: { fontSize: 12, color: COLORS.text },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  switchTxt: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  qrPreview: { alignItems: 'center', marginTop: 14, padding: 14, backgroundColor: COLORS.bg, borderRadius: 14 },
  qrLbl: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 10 },
  logoutFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.red,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  logoutFullTxt: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});
