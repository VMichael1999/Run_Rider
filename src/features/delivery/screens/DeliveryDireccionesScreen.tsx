import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { DeliveryStackParamList } from '@navigation/types';
import { FontFamily } from '@theme/fonts';
import { DeliveryShadow, useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { DeliveryScreenHeader } from '../components/DeliveryScreenHeader';
import { useAddressesStore } from '../store/useAddressesStore';
import { useCheckoutStore } from '../store/useCheckoutStore';

/** Direcciones guardadas: dónde se entregan los pedidos. La elegida es la del inicio y el checkout. */
export function DeliveryDireccionesScreen() {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<DeliveryStackParamList>>();
  useStatusBarStyle('dark');

  const addresses = useAddressesStore((s) => s.addresses);
  const selectedId = useAddressesStore((s) => s.selectedId);
  const select = useAddressesStore((s) => s.select);
  const remove = useAddressesStore((s) => s.remove);
  const clearOverride = useCheckoutStore((s) => s.setAddress);

  const choose = (id: string) => {
    void Haptics.selectionAsync();
    select(id);
    // El punto elegido en el mapa para un pedido deja de valer: manda la dirección guardada.
    clearOverride(null);
  };

  const confirmRemove = (id: string, label: string) => {
    if (addresses.length === 1) {
      Alert.alert('Necesitas una dirección', 'Agrega otra antes de borrar esta.');
      return;
    }
    Alert.alert(`¿Borrar ${label}?`, 'Ya no aparecerá en tus direcciones guardadas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <DeliveryScreenHeader title="Direcciones guardadas" subtitle="Dónde te entregamos tus pedidos" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        {addresses.map((address) => {
          const on = address.id === selectedId;
          return (
            <Reanimated.View key={address.id} exiting={FadeOut.duration(160)} layout={LinearTransition.duration(200)}>
              <Pressable
                onPress={() => choose(address.id)}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: on ? colors.limeStrong : 'transparent' },
                  DeliveryShadow.card,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${address.label}, ${address.detail}`}
              >
                <View style={[styles.icon, { backgroundColor: on ? colors.lime : colors.soft }]}>
                  <Ionicons name={address.icon} size={20} color={on ? colors.onLime : colors.ink} />
                </View>
                <View style={styles.text}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.label, { color: colors.ink }]}>{address.label}</Text>
                    {on ? (
                      <View style={[styles.tag, { backgroundColor: colors.limeSoft }]}>
                        <Text style={[styles.tagText, { color: colors.olive }]}>Entregar aquí</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.detail, { color: colors.muted }]} numberOfLines={2}>
                    {address.detail}
                  </Text>
                </View>
                <Pressable
                  onPress={() => confirmRemove(address.id, address.label)}
                  hitSlop={10}
                  style={styles.trash}
                  accessibilityRole="button"
                  accessibilityLabel={`Borrar ${address.label}`}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.muted} />
                </Pressable>
              </Pressable>
            </Reanimated.View>
          );
        })}

        <Pressable
          onPress={() => navigation.navigate('DeliveryDireccion', { purpose: 'guardar' })}
          style={[styles.add, { borderColor: colors.line }]}
          accessibilityRole="button"
        >
          <View style={[styles.icon, { backgroundColor: colors.limeSoft }]}>
            <Ionicons name="add" size={20} color={colors.olive} />
          </View>
          <View style={styles.text}>
            <Text style={[styles.label, { color: colors.ink }]}>Agregar dirección</Text>
            <Text style={[styles.detail, { color: colors.muted }]}>Elígela en el mapa</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.faint} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 6,
    paddingHorizontal: 14,
    gap: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
  },
  tag: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10.5,
  },
  detail: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    lineHeight: 17,
  },
  trash: {
    padding: 4,
  },
  add: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
