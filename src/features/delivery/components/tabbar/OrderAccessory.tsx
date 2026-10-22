import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily } from '@theme/fonts';
import { useDeliveryColors } from '../../theme';
import { StoreLogo } from '../StoreLogo';
import { Avatar } from '../Avatar';
import type { OrderPillData } from '../../hooks/useOrderPill';
import { COURIER, RESTAURANTS, ACTIVE_ORDER } from '../../data/mock';
import { useSelectedAddress } from '../../store/useAddressesStore';

interface OrderAccessoryProps {
  pill: OrderPillData;
  onPress?: () => void;
}

/** Contenido del accessory: el pedido en curso en 48 pt (logo o repartidor, estado y minutos). */
export function OrderAccessory({ pill, onPress }: OrderAccessoryProps) {
  const colors = useDeliveryColors();
  const address = useSelectedAddress();
  const restaurant = RESTAURANTS[ACTIVE_ORDER.restaurantId];
  const onTheWay = pill.status === 'en-camino';
  const title = onTheWay ? `${COURIER.firstName} está en camino` : 'Preparando tu pedido';
  const subtitle = onTheWay
    ? `A ${address.label} · Llega ${pill.arrivesAt}`
    : `${restaurant.name.split(' – ')[0]} · Llega ${pill.arrivesAt}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}. Faltan ${pill.minutes} minutos`}
    >
      {onTheWay ? (
        <View style={styles.avatar}>
          <Avatar initials={COURIER.initials} variant="sm" />
        </View>
      ) : (
        <StoreLogo logo={restaurant.logo} size={34} radius={17} fontSize={12} />
      )}
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={[styles.eta, { backgroundColor: colors.limeSoft }]}>
        <Text style={[styles.etaText, { color: colors.ink }]}>{pill.minutes}</Text>
        <Text style={[styles.etaUnit, { color: colors.olive }]}>min</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 7,
    paddingRight: 7,
  },
  avatar: {
    transform: [{ scale: 0.9 }],
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 13.5,
    lineHeight: 17,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
  },
  eta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    borderRadius: 17,
    paddingHorizontal: 10,
    height: 34,
    paddingTop: 7,
  },
  etaText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
  },
  etaUnit: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
  },
});
