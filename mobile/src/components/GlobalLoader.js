import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { subscribeToLoading } from '../services/api';
import { COLORS } from '../theme';

export default function GlobalLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return subscribeToLoading(setLoading);
  }, []);

  if (!loading) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.pill}>
        <ActivityIndicator size="small" color={COLORS.amber} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 56,
    right: 16,
    zIndex: 999,
  },
  pill: {
    backgroundColor: COLORS.dark,
    padding: 8,
    borderRadius: 20,
    elevation: 5,
  },
});
