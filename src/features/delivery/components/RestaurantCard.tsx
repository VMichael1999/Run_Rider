import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@theme/fonts';
import { DeliveryColors } from '@theme/colors';
import { DeliveryShadow, useDeliveryColors } from '../theme';
import { useThemeStore } from '@store/useThemeStore';
import { GradientFill } from './GradientFill';
import { StoreLogo } from './StoreLogo';
import type { Restaurant } from '../data/mock';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress?: () => void;
}

/** Tarjeta de local para la grilla de 2 columnas (.rc). */
export function RestaurantCard({ restaurant, onPress }: RestaurantCardProps) {
  const colors = useDeliveryColors();
  const dark = useThemeStore((s) => s.isDark);
  const distance = `${restaurant.distanceKm.toFixed(1)} km`;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card }, DeliveryShadow.card]}
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name}, ${restaurant.discountPercent}% de descuento, ${restaurant.rating} estrellas, ${restaurant.minutes} minutos, a ${distance}`}
    >
      <View style={styles.photo}>
        <GradientFill
          type="radial"
          cx={0.5}
          cy={0.6}
          rx={0.8}
          ry={0.9}
          stops={[
            // En oscuro, la foto queda en su tono (sin el centro blanco que se ve gris sobre la tarjeta).
            { color: dark ? restaurant.tint : colors.card, offset: 0 },
            { color: restaurant.tint, offset: 0.7 },
          ]}
        />
        <Image source={restaurant.image} style={styles.photoImage} />
        <View style={[styles.badge, { backgroundColor: colors.card }]}>
          <StoreLogo logo={restaurant.logo} size={26} radius={7} fontSize={9.5} />
        </View>
        <View style={[styles.discount, { backgroundColor: colors.lime }]}>
          <Ionicons name="ticket-outline" size={13} color={colors.onLime} />
          <Text style={[styles.discountText, { color: colors.onLime }]}>{restaurant.discountPercent}% DSCTO</Text>
        </View>
      </View>
      <Text style={[styles.name, { color: colors.ink }]} numberOfLines={2}>
        {restaurant.name}
      </Text>
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="star" size={13} color={colors.star} />
          <Text style={[styles.metaText, { color: colors.ink }]}>{restaurant.rating.toFixed(1)}</Text>
        </View>
        <Text style={[styles.metaText, { color: colors.muted }]}>· {restaurant.minutes} min</Text>
        <View style={[styles.metaItem, styles.metaRight]}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text style={[styles.metaText, { color: colors.muted }]}>{distance}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    paddingTop: 6,
    paddingHorizontal: 6,
    paddingBottom: 10,
    gap: 4,
  },
  photo: {
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: 70,
    height: 70,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 9,
    padding: 2,
    // 0 1px 3px rgba(0,0,0,.15)
    shadowColor: DeliveryColors.light.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  discount: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  discountText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    lineHeight: 14.2,
  },
  name: {
    fontFamily: FontFamily.semibold,
    fontSize: 13.5,
    lineHeight: 16.9,
    paddingHorizontal: 4,
    minHeight: 34,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 5,
    rowGap: 3,
    paddingHorizontal: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaRight: {
    marginLeft: 'auto',
  },
  metaText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
});
