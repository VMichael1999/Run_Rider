import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DeliveryStackParamList } from '@navigation/types';
import { FontFamily } from '@theme/fonts';
import { DeliveryColors } from '@theme/colors';
import { useCartStore } from '@store/useCartStore';
import { useAuthStore } from '@store/useAuthStore';
import { usePaymentSelectionStore } from '@store/usePaymentSelectionStore';
import { getPaymentMethodById } from '@shared/data/paymentMethods';
import { useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { useCheckoutAddress, useCheckoutStore } from '../store/useCheckoutStore';
import { useActiveOrderStore } from '../store/useActiveOrderStore';
import { computeCharges } from '../utils/cobro';
import { formatSoles } from '../utils/money';
import {
  ChangeLink,
  CheckoutItem,
  CouponRow,
  FulfillmentSwitch,
  MiniMap,
  Section,
  StoreHeader,
  SummaryRow,
} from '../components/checkout/CheckoutBlocks';
import { StoreLogo } from '../components/StoreLogo';
import { ConfirmDialog, CouponSheet, Spinner } from '../components/checkout/CheckoutOverlays';
import {
  DELIVERY_ETA_MINUTES,
  DELIVERY_FEE,
  MAP_POINTS,
  PICKUP_INFO,
  RESTAURANTS,
  RESTAURANT_DETAILS,
} from '../data/mock';

type Props = NativeStackScreenProps<DeliveryStackParamList, 'DeliveryCheckout'>;

const SENDING_MS = 1200;

/** "987 ··· 314": el número del pasajero con el medio oculto. */
function maskPhone(phone: string) {
  return phone.length >= 6 ? `${phone.slice(0, 3)} ··· ${phone.slice(-3)}` : phone;
}

/** Checkout (del-10 delivery / del-11 recojo en local). */
export function DeliveryCheckoutScreen({ navigation }: Props) {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');

  const items = useCartStore((s) => s.items).filter((item) => item.selected);
  const fulfillment = useCheckoutStore((s) => s.fulfillment);
  const setFulfillment = useCheckoutStore((s) => s.setFulfillment);
  const couponId = useCheckoutStore((s) => s.couponId);
  const setCoupon = useCheckoutStore((s) => s.setCoupon);
  const address = useCheckoutAddress();
  const [couponsOpen, setCouponsOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const phone = useAuthStore((s) => s.phone);
  const payment = getPaymentMethodById(usePaymentSelectionStore((s) => s.selectedId));

  const restaurantId = items[0]?.restaurantId ?? 'burgerRuta';
  const restaurant = RESTAURANTS[restaurantId];
  const vouchers = RESTAURANT_DETAILS[restaurantId]?.vouchers ?? [];
  const pickup = fulfillment === 'pickup';

  const base = computeCharges({ items, deliveryFee: DELIVERY_FEE, freeDelivery: true, pickup });
  const usable = vouchers.filter((voucher) => voucher.percent && base.subtotal >= (voucher.minSubtotal ?? 0));
  const coupon = usable.find((voucher) => voucher.id === couponId);
  const charges = computeCharges({
    items,
    deliveryFee: DELIVERY_FEE,
    freeDelivery: true,
    pickup,
    couponPercent: coupon?.percent ?? 0,
  });

  // Enviando (del-15): el botón muestra el indicador ≈1.2 s y abre el seguimiento.
  const placeOrder = useActiveOrderStore((s) => s.placeOrder);
  const removeItem = useCartStore((s) => s.removeItem);
  const resetCheckout = useCheckoutStore((s) => s.reset);

  const confirmOrder = () => {
    setConfirmOpen(false);
    setSending(true);
    setTimeout(() => {
      placeOrder({
        restaurantId,
        items,
        charges,
        paymentLabel: payment.label,
        address,
        fulfillment,
      });
      // Lo pedido sale del carrito; lo que no se marcó se queda.
      items.forEach((item) => removeItem(item.id));
      resetCheckout();
      setSending(false);
      navigation.replace('DeliverySeguimiento');
    }, SENDING_MS);
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
        <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
          Checkout
        </Text>
        <View style={styles.roundSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section gap={10}>
          <FulfillmentSwitch value={fulfillment} onChange={setFulfillment} />
          <MiniMap
            coordinate={pickup ? MAP_POINTS.burgerRuta : address.coordinate}
            store={pickup ? restaurant : undefined}
          />
          {pickup ? (
            <View style={styles.address}>
              <StoreLogo logo={restaurant.logo} size={38} radius={10} fontSize={13} />
              <View style={styles.addressText}>
                <Text style={[styles.addressTitle, { color: colors.ink }]}>{restaurant.name}</Text>
                <Text style={[styles.addressSmall, { color: colors.muted }]}>
                  Listo en ~{PICKUP_INFO[restaurantId]?.readyMinutes ?? restaurant.minutes} min · a {restaurant.distanceKm.toFixed(1)} km
                </Text>
              </View>
              <View style={[styles.noFee, { backgroundColor: colors.limeSoft }]}>
                <Text style={[styles.noFeeText, { color: colors.olive }]}>Sin costo de envío</Text>
              </View>
            </View>
          ) : (
            <View style={styles.address}>
              <View style={styles.addressText}>
                <Text style={[styles.addressSmall, { color: colors.muted }]}>Entregar en · ~{DELIVERY_ETA_MINUTES} min</Text>
                <Text style={[styles.addressTitle, { color: colors.ink }]}>{address.label}</Text>
                <Text style={[styles.addressSmall, { color: colors.muted }]}>{address.detail}</Text>
              </View>
              <ChangeLink
                label="Cambiar dirección de entrega"
                onPress={() => navigation.navigate('DeliveryDireccion')}
              />
            </View>
          )}
        </Section>

        <Section>
          <StoreHeader restaurant={restaurant} countLabel={pickup ? `${charges.count} productos` : undefined} />
          {items.map((item) => (
            <CheckoutItem key={item.id} item={item} />
          ))}
        </Section>

        <CouponRow
          title={coupon ? coupon.title : 'Elige un cupón'}
          subtitle={coupon ? `Ahorras ${formatSoles(charges.discount)}` : usable.length === 0 ? 'Ninguno disponible para este pedido' : `${usable.length} ${usable.length === 1 ? 'disponible' : 'disponibles'} para este pedido`}
          actionLabel={coupon ? 'Cambiar' : 'Elegir'}
          store={coupon ? restaurant : undefined}
          onPress={() => setCouponsOpen(true)}
        />

        {pickup ? null : (
          <Section>
            <View style={styles.payment}>
              <View style={[styles.paymentBox, { backgroundColor: payment.id === 'yape' ? colors.yape : colors.soft }]}>
                {payment.id === 'yape' ? (
                  <Ionicons name="wallet-outline" size={20} color={colors.onDark} />
                ) : (
                  <Image source={payment.image} style={styles.paymentLogo} resizeMode="contain" />
                )}
              </View>
              <View style={styles.paymentText}>
                <Text style={[styles.addressSmall, { color: colors.muted }]}>Método de pago</Text>
                <Text style={[styles.addressTitle, { color: colors.ink }]}>{payment.label}</Text>
                <Text style={[styles.addressSmall, { color: colors.muted }]}>
                  {payment.id === 'efectivo' ? 'Pagas al recibir tu pedido' : maskPhone(phone)}
                </Text>
              </View>
              <ChangeLink label="Cambiar método de pago" onPress={() => navigation.navigate('MetodosPago')} />
            </View>
          </Section>
        )}

        <Section>
          <SummaryRow label="Subtotal" value={formatSoles(charges.subtotal)} />
          <SummaryRow label={pickup ? 'Recojo en local' : 'Costo de envío'} value={charges.delivery === 0 ? 'Gratis' : formatSoles(charges.delivery)} tone={charges.delivery === 0 ? 'ok' : 'default'} />
          {coupon ? <SummaryRow label="Cupón" value={`−${formatSoles(charges.discount)}`} /> : null}
          {/* En recojo (del-11) el resumen no repite el total; ya está en el pie. */}
          {pickup ? null : <SummaryRow label="Total" value={formatSoles(charges.total)} tone="total" />}
        </Section>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.line }]}>
        <View>
          <Text style={[styles.addressSmall, { color: colors.muted }]}>Total</Text>
          <Text style={[styles.footerTotal, { color: colors.ink }]}>{formatSoles(charges.total)}</Text>
        </View>
        <Pressable
          onPress={() => setConfirmOpen(true)}
          disabled={items.length === 0 || sending}
          style={[styles.orderButton, { backgroundColor: colors.lime }]}
          accessibilityRole="button"
          accessibilityLabel={`Hacer pedido por ${formatSoles(charges.total)}`}
        >
          {sending ? <Spinner /> : <Text style={[styles.orderText, { color: colors.onLime }]}>Hacer pedido</Text>}
        </Pressable>
      </View>

      <CouponSheet
        visible={couponsOpen}
        vouchers={usable}
        selectedId={couponId}
        onSelect={(id) => {
          setCoupon(id);
          setCouponsOpen(false);
        }}
        onClose={() => setCouponsOpen(false)}
      />
      <ConfirmDialog
        visible={confirmOpen}
        rows={[
          pickup
            ? { label: 'Recoger en', value: restaurant.name.split(' – ')[0] }
            : { label: 'Entregar en', value: address.label },
          { label: 'Pagar con', value: payment.label, icon: 'wallet-outline' },
          { label: 'Total', value: formatSoles(charges.total) },
        ]}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  // .appbar.c: 40 · título 18 · 40
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
  roundSpacer: {
    width: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.semibold,
    fontSize: 18,
  },
  content: {
    paddingTop: 6,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  address: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressText: {
    flex: 1,
  },
  addressTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 14.5,
    lineHeight: 19.6,
  },
  addressSmall: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  noFee: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  noFeeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10.5,
  },
  payment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // .pay: columna de 52 para la caja de 48 × 34
  paymentBox: {
    width: 48,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  paymentLogo: {
    width: 28,
    height: 22,
  },
  paymentText: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  footerTotal: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
  },
  orderButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    fontFamily: FontFamily.semibold,
    fontSize: 15.5,
  },
});
