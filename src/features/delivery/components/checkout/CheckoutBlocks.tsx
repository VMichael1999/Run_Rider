import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Line } from 'react-native-svg';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { FontFamily } from '@theme/fonts';
import { DeliveryColors } from '@theme/colors';
import type { CartItem } from '@store/useCartStore';
import { useDeliveryMapStyle } from '../../hooks/useDeliveryMapStyle';
import { useDeliveryColors } from '../../theme';
import { StoreLogo } from '../StoreLogo';
import { formatSoles } from '../../utils/money';
import { lineTotal } from '../../utils/cobro';
import { CART_THUMBS, type Restaurant } from '../../data/mock';
import type { Fulfillment } from '../../store/useCheckoutStore';

/** Tarjeta blanca del checkout (.sec). */
export function Section({ children, gap = 8 }: { children: React.ReactNode; gap?: number }) {
  const colors = useDeliveryColors();
  return <View style={[styles.section, { backgroundColor: colors.card, gap }]}>{children}</View>;
}

interface SegmentedProps {
  value: Fulfillment;
  onChange: (value: Fulfillment) => void;
}

const SEGMENTS: { value: Fulfillment; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'delivery', label: 'Delivery', icon: 'bicycle-outline' },
  { value: 'pickup', label: 'Recojo en local', icon: 'storefront-outline' },
];

/** Selector Delivery / Recojo en local (.seg): el indicador blanco se desliza. */
export function FulfillmentSwitch({ value, onChange }: SegmentedProps) {
  const colors = useDeliveryColors();
  const [width, setWidth] = React.useState(0);
  const offset = useSharedValue(value === 'pickup' ? 1 : 0);

  React.useEffect(() => {
    offset.value = withTiming(value === 'pickup' ? 1 : 0, { duration: 220 });
  }, [offset, value]);

  const segmentWidth = width > 0 ? (width - 8) / 2 : 0;
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value * segmentWidth }],
  }));

  return (
    <View
      style={[styles.segmented, { backgroundColor: colors.soft }]}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 ? (
        <Reanimated.View style={[styles.indicator, { width: segmentWidth, backgroundColor: colors.card }, indicatorStyle]} />
      ) : null}
      {SEGMENTS.map((segment) => {
        const on = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={segment.label}
          >
            <Ionicons name={segment.icon} size={16} color={on ? colors.ink : colors.muted} />
            <Text style={[styles.segmentText, { color: on ? colors.ink : colors.muted }, on && styles.segmentTextOn]}>
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface MiniMapProps {
  coordinate: { latitude: number; longitude: number };
  /** Con él, el marcador es el círculo del local con sus iniciales; sin él, el pin rojo de destino. */
  store?: Restaurant;
}

/** Mapa pequeño (.mprev): 104 de alto, radio 12, sin gestos. */
export function MiniMap({ coordinate, store }: MiniMapProps) {
  const colors = useDeliveryColors();
  const mapStyle = useDeliveryMapStyle();
  // Región fija: el mapa no se mueve con gestos y cambia de punto al pasar de delivery a recojo.
  const region = React.useMemo(() => ({ ...coordinate, latitudeDelta: 0.006, longitudeDelta: 0.006 }), [coordinate]);

  return (
    <View style={styles.map} pointerEvents="none">
      <MapView
        provider={PROVIDER_GOOGLE}
        {...mapStyle}
        style={StyleSheet.absoluteFill}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      >
        <Marker key={store ? "store" : "home"} coordinate={coordinate} anchor={store ? { x: 0.5, y: 0.5 } : { x: 0.5, y: 1 }} tracksViewChanges={false}>
          {store ? (
            <View style={[styles.storeMarker, { backgroundColor: colors.card, borderColor: colors.ink }]}>
              <Text style={[styles.storeMarkerText, { color: colors.ink }]}>{store.logo.initials}</Text>
            </View>
          ) : (
            <Ionicons name="location" size={30} color={colors.red} />
          )}
        </Marker>
      </MapView>
    </View>
  );
}

interface ChangeLinkProps {
  onPress?: () => void;
  label: string;
}

/** "Cambiar ›" en oliva (.chg). */
export function ChangeLink({ onPress, label }: ChangeLinkProps) {
  const colors = useDeliveryColors();
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={[styles.change, { color: colors.olive }]}>Cambiar ›</Text>
    </Pressable>
  );
}

/** Producto del pedido (.ckl): foto con "2×", nombre, opciones y precio. */
export function CheckoutItem({ item }: { item: CartItem }) {
  const colors = useDeliveryColors();
  const thumb = CART_THUMBS[item.productId];

  return (
    <View style={styles.item} accessible accessibilityLabel={`${item.quantity} ${item.name}, ${item.options}, ${formatSoles(lineTotal(item))}`}>
      <View style={[styles.thumb, { backgroundColor: thumb?.tint ?? colors.soft }]}>
        {thumb ? <Image source={thumb.image} style={styles.thumbImage} /> : null}
        <View style={[styles.quantity, { backgroundColor: colors.inkFill }]}>
          <Text style={[styles.quantityText, { color: colors.onDark }]}>{item.quantity}×</Text>
        </View>
      </View>
      <View style={styles.itemText}>
        <Text style={[styles.itemName, { color: colors.ink }]}>{item.name}</Text>
        <Text style={[styles.itemOptions, { color: colors.faint }]} numberOfLines={2}>
          {item.options}
        </Text>
      </View>
      <Text style={[styles.itemPrice, { color: colors.ink }]}>{formatSoles(lineTotal(item))}</Text>
    </View>
  );
}

/** Encabezado del local en la lista de productos (.rb). */
export function StoreHeader({ restaurant, countLabel }: { restaurant: Restaurant; countLabel?: string }) {
  const colors = useDeliveryColors();
  return (
    <View style={styles.storeHeader}>
      <StoreLogo logo={restaurant.logo} size={20} radius={6} fontSize={8} />
      <Text style={[styles.storeName, { color: colors.ink }]}>{restaurant.name.split(' – ')[0]}</Text>
      {countLabel ? <Text style={[styles.storeCount, { color: colors.muted }]}>{countLabel}</Text> : null}
    </View>
  );
}

interface CouponRowProps {
  title: string;
  subtitle: string;
  actionLabel: string;
  onPress: () => void;
  /** Con un cupón elegido (.vrow.on), el talón muestra el logo y el nombre del local. */
  store?: Restaurant;
}

/** Fila del cupón (.vrow) con el talón lima y "Elegir". */
export function CouponRow({ title, subtitle, actionLabel, onPress, store }: CouponRowProps) {
  const colors = useDeliveryColors();
  return (
    <Pressable onPress={onPress} style={[styles.coupon, { backgroundColor: colors.card }]} accessibilityRole="button" accessibilityLabel={`${title}. ${subtitle}`}>
      <View style={[styles.couponStub, { backgroundColor: colors.limeSoft }]}>
        {store ? <StoreLogo logo={store.logo} /> : <Ionicons name="ticket-outline" size={24} color={colors.olive} />}
        <Text style={[styles.couponStubText, { color: colors.olive }]} numberOfLines={1}>
          {store ? store.name.split(' – ')[0] : 'Cupón'}
        </Text>
        <Svg style={styles.couponCut} width={1.5} height="100%">
          <Line x1={0.75} y1={0} x2={0.75} y2="100%" stroke={colors.line} strokeWidth={1.5} strokeDasharray="4 3" />
        </Svg>
      </View>
      <View style={styles.couponText}>
        <Text style={[styles.couponTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.couponSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <View style={[styles.couponAction, { backgroundColor: colors.inkFill }]}>
        <Text style={[styles.couponActionText, { color: colors.lime }]}>{actionLabel}</Text>
      </View>
    </Pressable>
  );
}

/** Fila del resumen (.sums). */
export function SummaryRow({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'ok' | 'total' }) {
  const colors = useDeliveryColors();
  const total = tone === 'total';
  return (
    <View style={[styles.sumRow, total && [styles.sumTotal, { borderTopColor: colors.line }]]}>
      <Text style={[styles.sumLabel, { color: total ? colors.ink : colors.muted }, total && styles.sumTotalLabel]}>{label}</Text>
      <Text
        style={[
          styles.sumValue,
          { color: tone === 'ok' ? colors.ok : colors.ink },
          tone === 'ok' && styles.sumOk,
          total && styles.sumTotalValue,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    padding: 12,
    // 0 1px 3px rgba(17,21,25,.05)
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: 36,
    borderRadius: 11,
    // 0 1px 3px rgba(17,21,25,.1)
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segment: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  segmentText: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
  },
  segmentTextOn: {
    fontFamily: FontFamily.semibold,
  },
  map: {
    height: 104,
    borderRadius: 12,
    overflow: 'hidden',
  },
  storeMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeMarkerText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
  },
  change: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: 40,
    height: 40,
  },
  quantity: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    borderRadius: 8,
    paddingHorizontal: 5,
  },
  quantityText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    lineHeight: 13.5,
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    fontFamily: FontFamily.semibold,
    fontSize: 13.5,
    lineHeight: 18.2,
  },
  itemOptions: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  itemPrice: {
    fontFamily: FontFamily.semibold,
    fontSize: 13.5,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  storeName: {
    fontFamily: FontFamily.semibold,
    fontSize: 13.5,
  },
  storeCount: {
    marginLeft: 'auto',
    fontFamily: FontFamily.regular,
    fontSize: 12,
  },
  coupon: {
    minHeight: 72,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 12,
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  couponStub: {
    width: 70,
    alignSelf: 'stretch',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  couponStubText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10.5,
  },
  couponCut: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  couponText: {
    flex: 1,
  },
  couponTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 14.5,
    lineHeight: 19.6,
  },
  couponSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  couponAction: {
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  couponActionText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sumLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 13.5,
  },
  sumValue: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
  },
  sumOk: {
    fontFamily: FontFamily.semibold,
  },
  sumTotal: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  sumTotalLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
  },
  sumTotalValue: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
  },
});
