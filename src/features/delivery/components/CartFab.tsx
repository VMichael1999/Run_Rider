import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@theme/fonts';
import { DeliveryColors } from '@theme/colors';
import { cartCount, useCartStore } from '@store/useCartStore';
import { useDeliveryColors } from '../theme';

interface CartFabProps {
  onPress: () => void;
}

/** Botón flotante del carrito (.fab) con el contador de productos. */
export function CartFab({ onPress }: CartFabProps) {
  const colors = useDeliveryColors();
  const count = useCartStore((s) => cartCount(s.items));

  return (
    <Pressable
      onPress={onPress}
      style={[styles.fab, { backgroundColor: colors.inkFill }]}
      accessibilityRole="button"
      accessibilityLabel={`Ver carrito, ${count} productos`}
    >
      <Ionicons name="bag-outline" size={24} color={colors.lime} />
      {count > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.inkFill, borderColor: colors.card }]}>
          <Text style={[styles.badgeText, { color: colors.lime }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    zIndex: 8,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    // 0 8px 20px rgba(17,21,25,.3)
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    lineHeight: 13,
  },
});
