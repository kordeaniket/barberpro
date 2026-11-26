import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { uiSlice } from '../redux/store';
import { COLORS, SHADOWS } from '../theme';

export default function ToastBanner() {
  const msg = useSelector((s) => s.ui.msg);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!msg) return;
    const timer = setTimeout(() => {
      dispatch(uiSlice.actions.clearMsg());
    }, 3200);
    return () => clearTimeout(timer);
  }, [msg, dispatch]);

  if (!msg) return null;

  const isErr = msg.type === 'error';

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => dispatch(uiSlice.actions.clearMsg())}
        style={[styles.banner, isErr ? styles.errBg : styles.okBg, SHADOWS.md]}
      >
        <Ionicons
          name={isErr ? 'alert-circle' : 'checkmark-circle'}
          size={20}
          color={COLORS.white}
        />
        <Text style={styles.text} numberOfLines={3}>
          {msg.text}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    width: '100%',
  },
  okBg: { backgroundColor: COLORS.emerald },
  errBg: { backgroundColor: COLORS.red },
  text: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
