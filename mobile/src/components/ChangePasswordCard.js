import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { uiSlice } from '../redux/store';
import { useTranslation } from '../i18n';
import { COLORS, SHADOWS } from '../theme';

export default function ChangePasswordCard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (newPassword.length < 8) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('security.min8Chars') }));
      return;
    }
    if (newPassword !== confirmPassword) {
      dispatch(uiSlice.actions.setMsg({ type: 'error', text: t('security.passwordMismatch') }));
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/change-password', { newPassword });
      setNewPassword('');
      setConfirmPassword('');
      dispatch(uiSlice.actions.setMsg({ type: 'ok', text: t('security.passwordUpdated') }));
    } catch (e) {
      dispatch(
        uiSlice.actions.setMsg({
          type: 'error',
          text: e?.response?.data?.message || e.message,
        })
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, SHADOWS.sm]}>
      <View style={styles.header}>
        <Ionicons name="lock-closed-outline" size={20} color={COLORS.amberDark} />
        <Text style={styles.title}>{t('security.changePassword')}</Text>
      </View>

      <Text style={styles.label}>{t('security.newPassword')}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          secureTextEntry={!showPw}
          placeholder={t('security.min8Chars')}
          placeholderTextColor={COLORS.textLight}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
          <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('security.confirmPassword')}</Text>
      <TextInput
        style={[styles.input, styles.singleInput]}
        secureTextEntry={!showPw}
        placeholder={t('security.confirmPassword')}
        placeholderTextColor={COLORS.textLight}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={busy}
        style={[styles.btn, busy && { opacity: 0.6 }]}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>{busy ? t('common.saving') : t('security.updatePassword')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6, marginTop: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  singleInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
  },
  eyeBtn: { paddingHorizontal: 12 },
  btn: {
    marginTop: 14,
    backgroundColor: COLORS.dark,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
