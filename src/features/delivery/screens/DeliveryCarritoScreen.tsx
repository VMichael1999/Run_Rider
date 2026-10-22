import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { DeliveryStackParamList } from '@navigation/types';
import Reanimated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { FontFamily } from '@theme/fonts';
import { DeliveryColors } from '@theme/colors';
import { useCartStore } from '@store/useCartStore';
import { useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { CartRow } from '../components/carrito/CartRow';
import { computeCharges } from '../utils/cobro';
import { formatSoles } from '../utils/money';
import { APPLIED_DELIVERY_CODE, DELIVERY_FEE } from '../data/mock';

/** Carrito (del-09). */
export function DeliveryCarritoScreen() {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<DeliveryStackParamList>>();
  useStatusBarStyle('dark');

  const items = useCartStore((s) => s.items);
  const toggleSelected = useCartStore((s) => s.toggleSelected);
  const setAllSelected = useCartStore((s) => s.setAllSelected);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const charges = computeCharges({ items, deliveryFee: DELIVERY_FEE, freeDelivery: true });
  const totalUnits = items.reduce((total, item) => total + item.quantity, 0);
  const allSelected = items.length > 0 && items.every((item) => item.selected);
  const selectedItems = items.filter((item) => item.selected);

  const removeSelected = () => {
    if (selectedItems.length === 0) return;
    Alert.alert('¿Quitar los productos elegidos?', `Se quitarán ${charges.count} productos del carrito.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => selectedItems.forEach((item) => removeItem(item.id)) },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.appbar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.roundButton, { backgroundColor: colors.card }]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.title}>
          <Text style={[styles.titleText, { color: colors.ink }]} accessibilityRole="header">
            Carrito
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{totalUnits} productos</Text>
        </View>
        <Pressable
          onPress={removeSelected}
          disabled={selectedItems.length === 0}
          style={[styles.roundButton, { backgroundColor: colors.card }]}
          accessibilityRole="button"
          accessibilityLabel="Quitar los productos elegidos"
        >
          <Ionicons name="trash-outline" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <Reanimated.View key={item.id} exiting={FadeOut.duration(180)} layout={LinearTransition.duration(220)}>
            <CartRow
              item={item}
              onToggle={() => toggleSelected(item.id)}
              onChangeQuantity={(quantity) => setQuantity(item.id, quantity)}
              onRemove={() => removeItem(item.id)}
            />
          </Reanimated.View>
        ))}
        {items.length === 0 ? (
          <Text style={[styles.empty, { color: colors.muted }]}>Tu carrito está vacío.</Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.line }]}>
        <Pressable
          onPress={() => setAllSelected(!allSelected)}
          style={styles.all}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: allSelected }}
          accessibilityLabel="Elegir todo"
        >
          <View
            style={[
              styles.checkbox,
              allSelected
                ? { backgroundColor: colors.lime, borderColor: colors.limeStrong }
                : { backgroundColor: colors.card, borderColor: colors.faint },
            ]}
          >
            {allSelected ? <Ionicons name="checkmark" size={13} color={colors.onLime} /> : null}
          </View>
          <Text style={[styles.allText, { color: colors.ink }]}>Todo</Text>
        </Pressable>
        <View style={styles.total}>
          <Text style={[styles.totalAmount, { color: colors.ink }]}>{formatSoles(charges.total)}</Text>
          <Text style={[styles.totalNote, { color: colors.olive }]}>{APPLIED_DELIVERY_CODE} aplicado</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('DeliveryCheckout')}
          disabled={charges.count === 0}
          style={[styles.pay, { backgroundColor: colors.lime }, charges.count === 0 && styles.payDisabled]}
          accessibilityRole="button"
          accessibilityLabel={`Pagar ${charges.count} productos, ${formatSoles(charges.total)}`}
        >
          <Text style={[styles.payText, { color: colors.onLime }]}>Pagar ({charges.count})</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    lineHeight: 22.9,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  // .pad con gap 10 y padding-top 6
  list: {
    paddingTop: 6,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  empty: {
    textAlign: 'center',
    fontFamily: FontFamily.regular,
    fontSize: 13,
    marginTop: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  all: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
  },
  total: {
    flex: 1,
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    lineHeight: 22.9,
  },
  totalNote: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    lineHeight: 12,
  },
  pay: {
    height: 44,
    borderRadius: 25,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payDisabled: {
    opacity: 0.5,
  },
  payText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
  },
});
