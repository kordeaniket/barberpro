import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import api, { saveSession } from '../../services/api';
import { authSlice, uiSlice } from '../../redux/store';
import { useTranslation } from '../../i18n';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import SalonPickerModal from '../../components/SalonPickerModal';
import { COLORS, SHADOWS } from '../../theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { error, busy } = useSelector((s) => s.auth);

  // mode: 'login' | 'customer_reg' | 'shop_reg'
  const [mode, setMode] = useState('login');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Auto-lookup state
  const [lookup, setLookup] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);

  // Registration fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [activeShops, setActiveShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [salonModalOpen, setSalonModalOpen] = useState(false);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [regBusy, setRegBusy] = useState(false);

  useEffect(() => {
    if (mode !== 'customer_reg') return;
    api
      .get('/customer/public/shops', { skipGlobalLoader: true })
      .then((res) => setActiveShops(res.data || []))
      .catch(() => setActiveShops([]));
  }, [mode]);

  useEffect(() => {
    const clean = mobile.replace(/\D/g, '');
    if (mode !== 'login' || clean.length !== 10) {
      setLookup(null);
      return;
    }
    let cancelled = false;
    setLookingUp(true);
    api
      .get(`/auth/lookup/${clean}`, { skipGlobalLoader: true })
      .then((res) => {
        if (!cancelled) setLookup(res.data);
      })
      .catch(() => {
        if (!cancelled) setLookup(null);
      })
      .finally(() => {
        if (!cancelled) setLookingUp(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mobile, mode]);

  const handleLogin = () => {
    dispatch(authSlice.actions.clearError());
    const clean = mobile.trim();
    if (!clean || !password) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
      return;
    }
    dispatch(authSlice.actions.loginRequest({ mobile: clean, password }));
  };

  const handleCustomerRegister = async () => {
    const clean = mobile.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.invalidMobile') }));
    }
    if (!name.trim() || !password || !selectedShop?._id) {
      return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
    }
    setRegBusy(true);
    try {
      const { data } = await api.post('/auth/register-customer', {
        name: name.trim(),
        mobile: clean,
        email: email.trim() || undefined,
        password,
        shopId: selectedShop._id,
      });
      await saveSession(data);
      dispatch(authSlice.actions.loginSuccess(data.user));
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    } finally {
      setRegBusy(false);
    }
  };

  const handleShopRegister = async () => {
    const clean = mobile.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.invalidMobile') }));
    }
    if (!shopName.trim() || !ownerName.trim() || !password) {
      return dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('auth.fillRequired') }));
    }
    setRegBusy(true);
    try {
      const { data } = await api.post('/auth/register-shop', {
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        mobile: clean,
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        password,
      });
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: data.message }));
      setMode('login');
    } catch (e) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: e?.response?.data?.message || e.message }));
    } finally {
      setRegBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <View style={styles.brandRow}>
              <View style={styles.logoCircle}>
                <Ionicons name="cut" size={20} color={COLORS.dark} />
              </View>
              <Text style={styles.brandName}>{t('common.appName')}</Text>
            </View>
            <LanguageSwitcher compact />
          </View>

          <View style={[styles.card, SHADOWS.md]}>
            <Text style={styles.heading}>
              {mode === 'login'
                ? t('auth.welcomeBack')
                : mode === 'customer_reg'
                ? t('auth.registerCustomer')
                : t('auth.registerShop')}
            </Text>
            <Text style={styles.subheading}>{t('auth.subtitle')}</Text>

            {mode === 'shop_reg' && (
              <>
                <Text style={styles.label}>{t('auth.shopName')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.shopName')}
                  placeholderTextColor={COLORS.textLight}
                  value={shopName}
                  onChangeText={setShopName}
                />

                <Text style={styles.label}>{t('auth.ownerName')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.ownerName')}
                  placeholderTextColor={COLORS.textLight}
                  value={ownerName}
                  onChangeText={setOwnerName}
                />
              </>
            )}

            {mode === 'customer_reg' && (
              <>
                <Text style={styles.label}>{t('auth.fullName')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.fullName')}
                  placeholderTextColor={COLORS.textLight}
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.label}>{t('auth.selectSalon')} *</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setSalonModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Ionicons name="storefront-outline" size={18} color={COLORS.textMuted} />
                    <Text
                      style={[
                        styles.dropdownText,
                        !selectedShop && { color: COLORS.textLight },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedShop
                        ? `${selectedShop.name}${selectedShop.city ? ` (${selectedShop.city})` : ''}`
                        : t('auth.chooseSalonPlaceholder')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.label}>{t('auth.mobileNumber')} *</Text>
            <View style={styles.inputIconWrap}>
              <Ionicons name="call-outline" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.inputFlex}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder={t('auth.mobilePlaceholder')}
                placeholderTextColor={COLORS.textLight}
                value={mobile}
                onChangeText={setMobile}
              />
              {lookingUp && <ActivityIndicator size="small" color={COLORS.amber} />}
            </View>

            {/* Auto-detected role banner */}
            {mode === 'login' && lookup?.exists && (
              <View style={styles.detectBanner}>
                <Ionicons name="shield-checkmark" size={16} color={COLORS.emerald} />
                <Text style={styles.detectText}>
                  {t('auth.detectedAs')} <Text style={{ fontWeight: '800' }}>{t(`roles.${lookup.role}`)}</Text>
                  {lookup.shopName ? ` (${lookup.shopName})` : ''}
                </Text>
              </View>
            )}

            {mode === 'login' && lookup && !lookup.exists && lookup.shopRequest && (
              <View style={[styles.detectBanner, { backgroundColor: COLORS.amberBg, borderColor: COLORS.amber }]}>
                <Ionicons name="time-outline" size={16} color={COLORS.amberDark} />
                <Text style={[styles.detectText, { color: COLORS.amberDark }]}>
                  {lookup.shopRequest.shopName}: {t(`status.${lookup.shopRequest.status}`)}
                </Text>
              </View>
            )}

            {(mode === 'customer_reg' || mode === 'shop_reg') && (
              <>
                <Text style={styles.label}>{t('auth.emailOptional')}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={t('auth.emailOptional')}
                  placeholderTextColor={COLORS.textLight}
                  value={email}
                  onChangeText={setEmail}
                />
              </>
            )}

            {mode === 'shop_reg' && (
              <>
                <Text style={styles.label}>{t('auth.city')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.city')}
                  placeholderTextColor={COLORS.textLight}
                  value={city}
                  onChangeText={setCity}
                />
                <Text style={styles.label}>{t('auth.address')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.address')}
                  placeholderTextColor={COLORS.textLight}
                  value={address}
                  onChangeText={setAddress}
                />
              </>
            )}

            <Text style={styles.label}>{t('auth.password')} *</Text>
            <View style={styles.inputIconWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.inputFlex}
                secureTextEntry={!showPw}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {error && mode === 'login' ? (
              <View style={styles.errBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.red} />
                <Text style={styles.errText}>{error}</Text>
              </View>
            ) : null}

            {mode === 'login' ? (
              <TouchableOpacity
                onPress={handleLogin}
                disabled={busy}
                style={[styles.primaryBtn, busy && { opacity: 0.7 }]}
              >
                <Text style={styles.primaryBtnText}>
                  {busy ? t('auth.signingIn') : t('auth.signIn')}
                </Text>
              </TouchableOpacity>
            ) : mode === 'customer_reg' ? (
              <TouchableOpacity
                onPress={handleCustomerRegister}
                disabled={regBusy}
                style={[styles.primaryBtn, regBusy && { opacity: 0.7 }]}
              >
                <Text style={styles.primaryBtnText}>
                  {regBusy ? t('common.loading') : t('auth.createAccount')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleShopRegister}
                disabled={regBusy}
                style={[styles.primaryBtn, regBusy && { opacity: 0.7 }]}
              >
                <Text style={styles.primaryBtnText}>
                  {regBusy ? t('common.loading') : t('auth.submitShopRequest')}
                </Text>
              </TouchableOpacity>
            )}

            {mode === 'login' ? (
              <View style={styles.switchSection}>
                <Text style={styles.hintText}>{t('auth.newUserHint')}</Text>
                <View style={styles.regRow}>
                  <TouchableOpacity
                    style={styles.outlineBtn}
                    onPress={() => setMode('customer_reg')}
                  >
                    <Ionicons name="person-add-outline" size={16} color={COLORS.dark} />
                    <Text style={styles.outlineBtnText}>{t('auth.registerCustomer')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.outlineBtn}
                    onPress={() => setMode('shop_reg')}
                  >
                    <Ionicons name="storefront-outline" size={16} color={COLORS.amberDark} />
                    <Text style={[styles.outlineBtnText, { color: COLORS.amberDark }]}>
                      {t('auth.registerShop')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.backLink} onPress={() => setMode('login')}>
                <Ionicons name="arrow-back" size={16} color={COLORS.amberDark} />
                <Text style={styles.backLinkText}>{t('auth.backToLogin')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SalonPickerModal
        visible={salonModalOpen}
        onClose={() => setSalonModalOpen(false)}
        shops={activeShops}
        selectedShopId={selectedShop?._id}
        onSelect={setSelectedShop}
        title={t('auth.selectSalon')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  scroll: { flexGrow: 1, padding: 18, justifyContent: 'center' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 20,
  },
  heading: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  subheading: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text,
  },
  inputIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
  },
  inputFlex: { flex: 1, paddingVertical: 11, fontSize: 14, color: COLORS.text },
  dropdownBtn: {
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
  dropdownText: { fontSize: 14, color: COLORS.text, flex: 1 },
  detectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.emeraldBg,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  detectText: { fontSize: 12, color: '#065f46', flex: 1 },
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.redBg,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  errText: { color: COLORS.red, fontSize: 12, fontWeight: '600', flex: 1 },
  primaryBtn: {
    backgroundColor: COLORS.amber,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryBtnText: { color: COLORS.dark, fontSize: 15, fontWeight: '800' },
  switchSection: { marginTop: 18, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14 },
  hintText: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginBottom: 10 },
  regRow: { flexDirection: 'row', gap: 8 },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  outlineBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.dark },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 6,
  },
  backLinkText: { color: COLORS.amberDark, fontWeight: '700', fontSize: 13 },
});
