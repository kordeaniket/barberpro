import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useDispatch } from 'react-redux';
import { uiSlice } from '../redux/store';
import { useTranslation } from '../i18n';
import { COLORS } from '../theme';

export default function PaymentModal({ visible, onClose, appointment, shop }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  if (!visible || !appointment) return null;

  const amount = Number(appointment.price || 0);
  const upiId = shop?.upiId || '';
  const gpayNum = shop?.gpayNumber || shop?.ownerMobile || '';
  const phonePeNum = shop?.phonePeNumber || shop?.ownerMobile || '';
  const customQr = shop?.upiQrUrl || '';
  const shopName = shop?.name || 'BarberPro Salon';
  const note = encodeURIComponent(`${appointment.serviceName || 'Salon Service'} - ${shopName}`);
  const pn = encodeURIComponent(shopName);

  const upiString = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${pn}&am=${amount}&cu=INR&tn=${note}`
    : '';

  const hasPaymentOption = Boolean(upiId || gpayNum || phonePeNum || customQr);

  const openUpiUrl = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(upiString);
      }
    } catch {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: 'Unable to open UPI app on this device' }));
    }
  };

  const copyValue = async (val) => {
    if (!val) return;
    await Clipboard.setStringAsync(String(val));
    dispatch(uiSlice.actions.setMsg({ type: 'ok', text: `${t('common.copied')}: ${val}` }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('customer.paymentTitle')}</Text>
              <Text style={styles.sub}>
                {appointment.serviceName} • ₹{amount}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {!hasPaymentOption ? (
              <View style={styles.emptyBox}>
                <Ionicons name="wallet-outline" size={36} color={COLORS.textLight} />
                <Text style={styles.emptyText}>{t('customer.noOnlinePayConfigured')}</Text>
              </View>
            ) : (
              <>
                {upiString ? (
                  <View style={styles.section}>
                    <Text style={styles.secTitle}>{t('customer.payViaApp')}</Text>
                    <View style={styles.appGrid}>
                      <TouchableOpacity
                        style={[styles.appBtn, { borderColor: '#1a73e8', backgroundColor: '#eff6ff' }]}
                        onPress={() => openUpiUrl(upiString.replace('upi://pay', 'tez://upi/pay'))}
                      >
                        <Ionicons name="logo-google" size={20} color="#1a73e8" />
                        <Text style={[styles.appBtnText, { color: '#1a73e8' }]}>
                          {t('customer.googlePay')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.appBtn, { borderColor: '#5f259f', backgroundColor: '#f5f3ff' }]}
                        onPress={() => openUpiUrl(upiString.replace('upi://pay', 'phonepe://pay'))}
                      >
                        <Ionicons name="phone-portrait-outline" size={20} color="#5f259f" />
                        <Text style={[styles.appBtnText, { color: '#5f259f' }]}>
                          {t('customer.phonePe')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.appBtn, { borderColor: COLORS.amberDark, backgroundColor: COLORS.amberBg }]}
                        onPress={() => openUpiUrl(upiString)}
                      >
                        <Ionicons name="flash-outline" size={20} color={COLORS.amberDark} />
                        <Text style={[styles.appBtnText, { color: COLORS.amberDark }]}>
                          {t('customer.anyUpiApp')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {(customQr || upiString) ? (
                  <View style={[styles.section, styles.qrBox]}>
                    <Text style={styles.secTitle}>{t('customer.scanQr')}</Text>
                    {customQr ? (
                      <Image source={{ uri: customQr }} style={styles.customQr} resizeMode="contain" />
                    ) : (
                      <View style={styles.svgQrWrap}>
                        <QRCode value={upiString} size={170} />
                      </View>
                    )}
                    <Text style={styles.qrAmount}>₹{amount}</Text>
                  </View>
                ) : null}

                <View style={styles.section}>
                  <Text style={styles.secTitle}>{t('customer.payToNumber')}</Text>
                  {upiId ? (
                    <TouchableOpacity style={styles.copyRow} onPress={() => copyValue(upiId)}>
                      <View>
                        <Text style={styles.copyLabel}>UPI ID</Text>
                        <Text style={styles.copyVal}>{upiId}</Text>
                      </View>
                      <Ionicons name="copy-outline" size={18} color={COLORS.amberDark} />
                    </TouchableOpacity>
                  ) : null}
                  {gpayNum ? (
                    <TouchableOpacity style={styles.copyRow} onPress={() => copyValue(gpayNum)}>
                      <View>
                        <Text style={styles.copyLabel}>{t('customer.googlePay')}</Text>
                        <Text style={styles.copyVal}>{gpayNum}</Text>
                      </View>
                      <Ionicons name="copy-outline" size={18} color={COLORS.amberDark} />
                    </TouchableOpacity>
                  ) : null}
                  {phonePeNum ? (
                    <TouchableOpacity style={styles.copyRow} onPress={() => copyValue(phonePeNum)}>
                      <View>
                        <Text style={styles.copyLabel}>{t('customer.phonePe')}</Text>
                        <Text style={styles.copyVal}>{phonePeNum}</Text>
                      </View>
                      <Ionicons name="copy-outline" size={18} color={COLORS.amberDark} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                dispatch(uiSlice.actions.setMsg({ type: 'ok', text: t('customer.paymentRecorded') }));
                onClose();
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.doneBtnText}>{t('customer.completedPayment')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.laterBtn} onPress={onClose}>
              <Text style={styles.laterBtnText}>{t('customer.payLaterSalon')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 13, color: COLORS.amberDark, fontWeight: '700', marginTop: 2 },
  closeBtn: { padding: 6 },
  section: { marginBottom: 16 },
  secTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 10 },
  appGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  appBtn: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  appBtnText: { fontSize: 12, fontWeight: '700' },
  qrBox: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  svgQrWrap: { padding: 10, backgroundColor: COLORS.white, borderRadius: 12 },
  customQr: { width: 180, height: 180, borderRadius: 12 },
  qrAmount: { marginTop: 10, fontSize: 18, fontWeight: '800', color: COLORS.dark },
  copyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  copyLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  copyVal: { fontSize: 14, color: COLORS.text, fontWeight: '700', marginTop: 1 },
  emptyBox: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14 },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.emerald,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  doneBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  laterBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  laterBtnText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 13 },
});
