import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { notificationsSlice, uiSlice } from '../redux/store';
import { COLORS, SHADOWS } from '../theme';

export default function LiveNotificationBanner() {
  const popup = useSelector((s) => s.notifications.latestPopup);
  const dispatch = useDispatch();
  const slideAnim = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (!popup) return;
    try {
      Vibration.vibrate([0, 160, 80, 160]);
    } catch {}
    dispatch(uiSlice.actions.triggerRefresh());

    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 7,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start(() => dispatch(notificationsSlice.actions.dismissPopup()));
    }, 4500);

    return () => clearTimeout(timer);
  }, [popup, dispatch, slideAnim]);

  if (!popup) return null;

  const isCancel = popup.type === 'cancellation' || popup.type === 'cancelled';

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => dispatch(notificationsSlice.actions.dismissPopup())}
        style={[styles.card, SHADOWS.md, isCancel && styles.cancelBorder]}
      >
        <View style={[styles.iconBox, isCancel && { backgroundColor: COLORS.redBg }]}>
          <Ionicons
            name={isCancel ? 'alert-circle' : 'notifications'}
            size={22}
            color={isCancel ? COLORS.red : COLORS.amberDark}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {popup.title}
          </Text>
          <Text style={styles.msg} numberOfLines={2}>
            {popup.message}
          </Text>
        </View>
        <Ionicons name="close" size={18} color={COLORS.textLight} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 46,
    left: 14,
    right: 14,
    zIndex: 1100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    padding: 13,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.amber,
  },
  cancelBorder: {
    borderLeftColor: COLORS.red,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.amberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  msg: {
    color: COLORS.amberLight,
    fontSize: 12,
    marginTop: 2,
  },
});
