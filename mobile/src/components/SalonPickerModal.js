import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../i18n';
import { COLORS } from '../theme';

export default function SalonPickerModal({
  visible,
  onClose,
  shops = [],
  selectedShopId,
  onSelect,
  title,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q)
    );
  }, [shops, search]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title || t('auth.selectSalon')}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('auth.searchSalon')}
              placeholderTextColor={COLORS.textLight}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item._id || item.id)}
            style={{ maxHeight: 380 }}
            ListEmptyComponent={
              <Text style={styles.empty}>{t('auth.noSalonsFound')}</Text>
            }
            renderItem={({ item }) => {
              const id = String(item._id || item.id);
              const isSelected = selectedShopId && String(selectedShopId) === id;
              return (
                <TouchableOpacity
                  style={[styles.row, isSelected && styles.rowActive]}
                  onPress={() => {
                    onSelect(item);
                    setSearch('');
                    onClose();
                  }}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons name="storefront" size={18} color={COLORS.amberDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.city ? (
                      <Text style={styles.city}>📍 {item.city}</Text>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.amberDark} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
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
    padding: 18,
    maxHeight: '82%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  empty: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    marginBottom: 8,
  },
  rowActive: {
    borderColor: COLORS.amber,
    backgroundColor: COLORS.amberBg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  city: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
