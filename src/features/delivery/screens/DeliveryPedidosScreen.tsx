import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DeliveryStackParamList } from '@navigation/types';
import { FontFamily } from '@theme/fonts';
import { DeliveryShadow, useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { useOrderPill } from '../hooks/useOrderPill';
import { DeliveryScreenHeader } from '../components/DeliveryScreenHeader';
import { StoreLogo } from '../components/StoreLogo';
import { useActiveOrderStore } from '../store/useActiveOrderStore';
import { formatSoles } from '../utils/money';
import { PAST_ORDERS, type PastOrder } from '../data/account';
import { RESTAURANTS, RESTAURANT_DETAILS } from '../data/mock';

/** Mis pedidos: el pedido en curso arriba y los anteriores (muestra). */
export function DeliveryPedidosScreen() {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<DeliveryStackParamList>>();
  useStatusBarStyle('dark');

  const order = useActiveOrderStore((s) => s.order);
  const pill = useOrderPill();
  const live = order && pill?.live ? { order, pill } : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <DeliveryScreenHeader title="Mis pedidos" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {live ? (
          <>
            <Text style={[styles.section, { color: colors.ink }]}>En curso</Text>
            <Pressable
              onPress={() => navigation.navigate('DeliverySeguimiento')}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.limeStrong }, styles.liveCard, DeliveryShadow.card]}
              accessibilityRole="button"
              accessibilityLabel={`Pedido ${live.order.id} en curso, faltan ${live.pill.minutes} minutos. Ver seguimiento`}
            >
              <View style={styles.top}>
                <StoreLogo logo={RESTAURANTS[live.order.restaurantId].logo} size={40} radius={12} fontSize={13} />
                <View style={styles.text}>
                  <Text style={[styles.store, { color: colors.ink }]}>{RESTAURANTS[live.order.restaurantId].name}</Text>
                  <Text style={[styles.meta, { color: colors.muted }]}>
                    Pedido #{live.order.id} · Llega {live.pill.arrivesAt}
                  </Text>
                </View>
                <View style={[styles.eta, { backgroundColor: colors.limeSoft }]}>
                  <Text style={[styles.etaNumber, { color: colors.ink }]}>{live.pill.minutes}</Text>
                  <Text style={[styles.etaUnit, { color: colors.olive }]}>min</Text>
                </View>
              </View>
              <View style={[styles.footer, { borderTopColor: colors.line }]}>
                <Text style={[styles.status, { color: colors.olive }]}>
                  {live.pill.status === 'en-camino' ? 'En camino' : 'Preparando'}
                </Text>
                <View style={styles.link}>
                  <Text style={[styles.linkText, { color: colors.ink }]}>Ver seguimiento</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.ink} />
                </View>
              </View>
            </Pressable>
          </>
        ) : null}

        <Text style={[styles.section, { color: colors.ink }]}>Anteriores</Text>
        {PAST_ORDERS.map((past) => (
          <PastOrderCard
            key={past.id}
            order={past}
            onReorder={
              RESTAURANT_DETAILS[past.restaurantId]
                ? () => navigation.navigate('DeliveryLocal', { restaurantId: past.restaurantId })
                : undefined
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

function PastOrderCard({ order, onReorder }: { order: PastOrder; onReorder?: () => void }) {
  const colors = useDeliveryColors();
  const restaurant = RESTAURANTS[order.restaurantId];
  const cancelled = order.status === 'cancelado';

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, DeliveryShadow.card]}>
      <View style={styles.top}>
        <StoreLogo logo={restaurant.logo} size={40} radius={12} fontSize={13} />
        <View style={styles.text}>
          <Text style={[styles.store, { color: colors.ink }]}>{restaurant.name}</Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            #{order.id} · {order.date}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: cancelled ? colors.redSoft : colors.soft }]}>
          <Text style={[styles.pillText, { color: cancelled ? colors.red : colors.muted }]}>
            {cancelled ? 'Cancelado' : 'Entregado'}
          </Text>
        </View>
      </View>
      <Text style={[styles.items, { color: colors.muted }]} numberOfLines={2}>
        {order.items}
      </Text>
      <View style={[styles.footer, { borderTopColor: colors.line }]}>
        <Text style={[styles.total, { color: colors.ink }]}>
          {formatSoles(order.total)} <Text style={[styles.meta, { color: colors.muted }]}>· {order.count} productos</Text>
        </Text>
        {onReorder ? (
          <Pressable onPress={onReorder} style={[styles.reorder, { backgroundColor: colors.lime }]} accessibilityRole="button">
            <Ionicons name="refresh" size={14} color={colors.onLime} />
            <Text style={[styles.reorderText, { color: colors.onLime }]}>Volver a pedir</Text>
          </Pressable>
        ) : null}
      </View>
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
  section: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  liveCard: {
    borderWidth: 1.5,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    flex: 1,
  },
  store: {
    fontFamily: FontFamily.semibold,
    fontSize: 14.5,
  },
  meta: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
  },
  eta: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  etaNumber: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    lineHeight: 19,
  },
  etaUnit: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
  },
  pill: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  pillText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
  },
  items: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  status: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
  total: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
  },
  reorder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 32,
  },
  reorderText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12.5,
  },
});
