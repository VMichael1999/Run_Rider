import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { FontFamily } from '@theme/fonts';
import { DeliveryColors } from '@theme/colors';
import { useDeliveryColors } from '../../theme';
import { GradientFill } from '../GradientFill';
import { Avatar } from '../Avatar';
import { useSelectedAddress } from '../../store/useAddressesStore';
import { unreadCount, useNotificationsStore } from '../../store/useNotificationsStore';

/** Lo que se esconde al hacer scroll: el buscador (46) y el espacio sobre él (12), más 2 de padding inferior. */
export const HEADER_COLLAPSE_DISTANCE = 60;
const SEARCH_BLOCK = 58;

interface HomeHeaderProps {
  topInset: number;
  scrollY: SharedValue<number>;
  onAvatarPress: () => void;
  onAddressPress: () => void;
  onBellPress: () => void;
}

/** Cabecera oscura del inicio (.hdr): se compacta escondiendo el buscador al hacer scroll. */
export function HomeHeader({ topInset, scrollY, onAvatarPress, onAddressPress, onBellPress }: HomeHeaderProps) {
  const colors = useDeliveryColors();
  const address = useSelectedAddress();
  const unread = useNotificationsStore((s) => unreadCount(s.items));

  const searchStyle = useAnimatedStyle(() => {
    const progress = interpolate(scrollY.value, [0, HEADER_COLLAPSE_DISTANCE], [0, 1], Extrapolation.CLAMP);
    return {
      height: SEARCH_BLOCK * (1 - progress),
      opacity: 1 - Math.min(1, progress * 1.6),
    };
  });

  const paddingStyle = useAnimatedStyle(() => ({
    paddingBottom: interpolate(scrollY.value, [0, HEADER_COLLAPSE_DISTANCE], [14, 12], Extrapolation.CLAMP),
  }));

  return (
    <Reanimated.View style={[styles.header, { paddingTop: topInset + 10 }, paddingStyle]}>
      <View style={styles.background}>
        <GradientFill
          type="linear"
          angle={160}
          stops={[
            { color: colors.headerGradient[0], offset: 0 },
            { color: colors.headerGradient[1], offset: 0.55 },
            { color: colors.headerGradient[2], offset: 1 },
          ]}
        />
      </View>

      <View style={styles.location}>
        <Pressable onPress={onAvatarPress} accessibilityRole="button" accessibilityLabel="Abrir menú" hitSlop={4}>
          <Avatar initials="LR" />
        </Pressable>
        <Pressable
          onPress={onAddressPress}
          style={styles.addressWrap}
          accessibilityRole="button"
          accessibilityLabel={`Entregar en ${address.label}, ${address.street}`}
        >
          <View style={styles.eyebrow}>
            <Ionicons name="location-outline" size={13} color={colors.lime} />
            <Text style={[styles.eyebrowText, { color: colors.onDarkMuted }]}>Entregar en</Text>
          </View>
          <View style={styles.addressRow}>
            <Text style={[styles.addressLabel, { color: colors.onDark }]} numberOfLines={1}>{address.label}</Text>
            {/* Una dirección "Otro" se llama como su calle: no se repite. */}
            {address.street !== address.label ? (
              <Text style={[styles.addressStreet, { color: colors.onDarkHigh }]} numberOfLines={1}>
                {address.street}
              </Text>
            ) : null}
            <Ionicons name="chevron-down" size={16} color={colors.onDark} />
          </View>
        </Pressable>
        <Pressable
          onPress={onBellPress}
          style={[styles.bell, { backgroundColor: colors.onDarkFill }]}
          accessibilityRole="button"
          accessibilityLabel={unread ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
        >
          <Ionicons name="notifications-outline" size={16} color={colors.onDark} />
          {unread > 0 ? <View style={[styles.bellDot, { backgroundColor: colors.lime }]} /> : null}
        </Pressable>
      </View>

      <Reanimated.View style={[styles.searchClip, searchStyle]}>
        <View style={[styles.search, { backgroundColor: colors.card }]} accessibilityRole="search">
          <Ionicons name="search" size={20} color={colors.muted} />
          <Text style={[styles.searchText, { color: colors.faint }]}>Busca locales o platos</Text>
        </View>
      </Reanimated.View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
    paddingHorizontal: 14,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    // 0 8px 20px rgba(17,21,25,.18)
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 40,
  },
  addressWrap: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  eyebrowText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addressLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 18.9,
  },
  addressStreet: {
    flexShrink: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 18.9,
  },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  searchClip: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  search: {
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  searchText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
  },
});
