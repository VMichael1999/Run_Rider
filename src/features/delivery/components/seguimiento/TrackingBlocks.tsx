import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';
import Reanimated, { FadeIn, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { FontFamily } from '@theme/fonts';
import { DeliveryColors } from '@theme/colors';
import type { CartItem } from '@store/useCartStore';
import { useDeliveryColors } from '../../theme';
import { Avatar } from '../Avatar';
import { StoreLogo } from '../StoreLogo';
import { Spinner } from '../checkout/CheckoutOverlays';
import { formatSoles } from '../../utils/money';
import { lineTotal } from '../../utils/cobro';
import { ORDER_STEPS } from '../../utils/orderSimulation';
import { CART_THUMBS, COURIER, type Restaurant } from '../../data/mock';

/** Tarjeta blanca de la hoja (.sec). */
function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const colors = useDeliveryColors();
  return <View style={[styles.card, { backgroundColor: colors.card }, style]}>{children}</View>;
}

interface StatusHeaderProps {
  chip: string;
  done: boolean;
  title: string;
  subtitle: string;
  minutes?: number;
  arrivesAt?: string;
}

/** Cabecera de la hoja (.th): chip "En vivo", estado, detalle y la caja de ETA. */
export function StatusHeader({ chip, done, title, subtitle, minutes, arrivesAt }: StatusHeaderProps) {
  const colors = useDeliveryColors();
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <View style={[styles.live, { backgroundColor: done ? colors.soft : colors.limeSoft }]}>
          <Text style={[styles.liveText, { color: done ? colors.muted : colors.olive }]}>● {chip}</Text>
        </View>
        <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header" accessibilityLiveRegion="polite">
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      {minutes !== undefined && arrivesAt ? (
        <View style={[styles.eta, { backgroundColor: colors.card }]} accessible accessibilityLabel={`Faltan ${minutes} minutos, llega ${arrivesAt}`}>
          <Text style={[styles.etaNumber, { color: colors.ink }]}>
            {minutes}
            <Text style={[styles.etaUnit, { color: colors.muted }]}> min</Text>
          </Text>
          <Text style={[styles.etaSmall, { color: colors.muted }]}>Llega {arrivesAt}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Barra de 5 pasos (.seg5): el paso actual se llena de forma continua. */
export function StepBar({ step, stepProgress }: { step: number; stepProgress: number }) {
  const colors = useDeliveryColors();
  return (
    <View style={styles.steps} accessible accessibilityLabel={`Paso ${Math.min(step + 1, 5)} de 5: ${ORDER_STEPS[Math.min(step, 4)]}`}>
      {ORDER_STEPS.map((label, index) => {
        const fill = index < step ? 1 : index === step ? stepProgress : 0;
        return (
          <View key={label} style={styles.stepCol}>
            <View style={[styles.stepTrack, { backgroundColor: colors.line }]}>
              <View style={[styles.stepFill, { width: `${Math.min(1, fill) * 100}%`, backgroundColor: colors.limeStrong }]} />
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: index <= step ? colors.ink : colors.faint },
                index === step && step < 4 && styles.stepLabelCur,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** "Buscando un repartidor…" con el indicador (.find). */
export function FindingCard() {
  const colors = useDeliveryColors();
  return (
    <Card style={styles.finding}>
      <Spinner tone="soft" />
      <Text style={[styles.findingText, { color: colors.ink }]}>Buscando un repartidor…</Text>
    </Card>
  );
}

interface RiderCardProps {
  showVehicle?: boolean;
  onChat?: () => void;
  onCall?: () => void;
}

/** Tarjeta del repartidor (.rider) con mensaje, llamada, vehículo y placa; entra con un fundido. */
export function RiderCard({ showVehicle = true, onChat, onCall }: RiderCardProps) {
  const colors = useDeliveryColors();
  return (
    <Reanimated.View entering={FadeIn.duration(260)}>
      <Card style={styles.rider}>
        <View style={styles.riderRow}>
          <Avatar initials={COURIER.initials} variant="md" />
          <View style={styles.riderText}>
            <Text style={[styles.riderName, { color: colors.ink }]}>{COURIER.name}</Text>
            <View style={styles.riderMeta}>
              <Ionicons name="star" size={13} color={colors.star} />
              <Text style={[styles.riderSmall, { color: colors.muted }]}>
                {COURIER.rating.toFixed(2)} · {COURIER.trips.toLocaleString('en-US')} viajes
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onChat}
            style={[styles.roundAction, { backgroundColor: colors.limeSoft }]}
            accessibilityRole="button"
            accessibilityLabel={`Enviar mensaje a ${COURIER.firstName}`}
          >
            <Ionicons name="chatbubble-outline" size={16} color={colors.olive} />
          </Pressable>
          <Pressable
            onPress={onCall}
            style={[styles.roundAction, { backgroundColor: colors.lime }]}
            accessibilityRole="button"
            accessibilityLabel={`Llamar a ${COURIER.firstName}`}
          >
            <Ionicons name="call" size={16} color={colors.onLime} />
          </Pressable>
        </View>
        {showVehicle ? (
          <View style={[styles.vehicle, { backgroundColor: colors.soft }]}>
            <Ionicons name="car-outline" size={16} color={colors.muted} />
            <Text style={[styles.vehicleText, { color: colors.muted }]}>{COURIER.vehicle}</Text>
            <View style={[styles.plate, { backgroundColor: colors.inkFill }]}>
              <Text style={[styles.plateText, { color: colors.onDark }]}>{COURIER.plate}</Text>
            </View>
          </View>
        ) : null}
      </Card>
    </Reanimated.View>
  );
}

export interface TimelineRow {
  label: string;
  state: 'done' | 'current' | 'pending';
  /** Hora del paso hecho o cronómetro del paso actual. */
  value?: string;
}

/** "Estado del pedido" (.tl): puntos unidos por la línea, lima hasta el paso actual. */
export function Timeline({ rows }: { rows: TimelineRow[] }) {
  const colors = useDeliveryColors();
  return (
    <Card style={styles.timeline}>
      <Text style={[styles.sectionTitle, { color: colors.ink }]}>Estado del pedido</Text>
      {rows.map((row, index) => {
        const lineOn = index > 0 && rows[index - 1].state === 'done';
        return (
          <View key={row.label} style={styles.timelineRow}>
            {index > 0 ? <View style={[styles.timelineLine, { backgroundColor: lineOn ? colors.limeStrong : colors.line }]} /> : null}
            <View style={styles.timelineDotCell}>
              <View
                style={[
                  styles.dot,
                  row.state === 'done' && { backgroundColor: colors.limeStrong, borderColor: colors.limeStrong },
                  row.state === 'current' && [styles.dotCurrent, { borderColor: colors.limeStrong, backgroundColor: colors.card }],
                  row.state === 'pending' && { borderColor: colors.line, backgroundColor: colors.card },
                ]}
              />
            </View>
            <Text
              style={[
                styles.timelineLabel,
                { color: row.state === 'pending' ? colors.faint : colors.ink },
                row.state === 'current' && styles.timelineLabelCur,
              ]}
            >
              {row.label}
            </Text>
            {row.value ? (
              row.state === 'current' ? (
                <View style={[styles.stopwatch, { backgroundColor: colors.limeSoft }]}>
                  <Text style={[styles.stopwatchText, { color: colors.olive }]}>{row.value}</Text>
                </View>
              ) : (
                <Text style={[styles.timelineTime, { color: colors.muted }]}>{row.value}</Text>
              )
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}

interface FromToProps {
  store: Restaurant;
  addressLabel: string;
  addressDetail: string;
  distanceKm: number;
  tripMinutes: number;
}

/** De / A con distancia y tiempo de viaje (.ft). */
export function FromTo({ store, addressLabel, addressDetail, distanceKm, tripMinutes }: FromToProps) {
  const colors = useDeliveryColors();
  return (
    <Card style={styles.fromTo}>
      <View style={styles.fromRow}>
        <StoreLogo logo={store.logo} size={28} radius={8} fontSize={10} />
        <View>
          <Text style={[styles.fromSmall, { color: colors.muted }]}>De</Text>
          <Text style={[styles.fromTitle, { color: colors.ink }]}>{store.name}</Text>
        </View>
      </View>
      {/* Línea punteada entre De y A (.vd); borderStyle dashed no se dibuja en un solo lado en iOS. */}
      <Svg width={1.5} height={14} style={styles.dashed}>
        <Line x1={0.75} y1={0} x2={0.75} y2={14} stroke={colors.line} strokeWidth={1.5} strokeDasharray="3 2" />
      </Svg>
      <View style={styles.fromRow}>
        <View style={styles.pinCell}>
          <Ionicons name="location" size={26} color={colors.red} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.fromSmall, { color: colors.muted }]}>A</Text>
          <Text style={[styles.fromTitle, { color: colors.ink }]}>{addressLabel}</Text>
          <Text style={[styles.fromSmall, { color: colors.muted }]}>{addressDetail}</Text>
        </View>
      </View>
      <View style={[styles.km, { borderTopColor: colors.line }]}>
        <Ionicons name="git-pull-request-outline" size={13} color={colors.limeStrong} />
        <Text style={[styles.kmText, { color: colors.ink }]}>
          {distanceKm.toFixed(1)} km · {tripMinutes} min de viaje
        </Text>
      </View>
    </Card>
  );
}

/** "Tu pedido" con lo pagado (.yo). */
export function YourOrder({ items, total, paymentLabel }: { items: CartItem[]; total: number; paymentLabel: string }) {
  const colors = useDeliveryColors();
  return (
    <Card style={styles.yourOrder}>
      <Text style={[styles.sectionTitle, { color: colors.ink }]}>Tu pedido</Text>
      {items.map((item) => {
        const thumb = CART_THUMBS[item.productId];
        return (
          <View key={item.id} style={styles.orderRow}>
            <View style={styles.orderThumb}>{thumb ? <Image source={thumb.image} style={styles.orderImage} /> : null}</View>
            <Text style={[styles.orderQty, { color: colors.olive }]}>{item.quantity}×</Text>
            <Text style={[styles.orderName, { color: colors.ink }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.orderPrice, { color: colors.muted }]}>{formatSoles(lineTotal(item))}</Text>
          </View>
        );
      })}
      <View style={[styles.paid, { borderTopColor: colors.line }]}>
        <Text style={[styles.fromSmall, { color: colors.muted }]}>Pagado con {paymentLabel}</Text>
        <Text style={[styles.paidTotal, { color: colors.ink }]}>{formatSoles(total)}</Text>
      </View>
    </Card>
  );
}

interface RatingCardProps {
  rating: number;
  onRate: (stars: number) => void;
  onHome: () => void;
}

/** Entregado (.rate): check con escala, 5 estrellas para tocar y "Volver al inicio". */
export function RatingCard({ rating, onRate, onHome }: RatingCardProps) {
  const colors = useDeliveryColors();
  const reduceMotion = useReducedMotion();
  return (
    <Card style={styles.rating}>
      <Reanimated.View
        entering={reduceMotion ? FadeIn.duration(200) : ZoomIn.springify().damping(12)}
        style={[styles.check, { backgroundColor: colors.lime }]}
      >
        <Ionicons name="checkmark" size={26} color={colors.onLime} />
      </Reanimated.View>
      <Text style={[styles.ratingTitle, { color: colors.ink }]}>Tu pedido llegó</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>¿Qué tal estuvo {COURIER.firstName}?</Text>
      <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`Calificación: ${rating} de 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => onRate(star)} hitSlop={5} accessibilityRole="button" accessibilityLabel={`${star} estrellas`}>
            <Ionicons name="star" size={28} color={star <= rating ? colors.star : colors.line} />
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onHome} style={[styles.homeButton, { backgroundColor: colors.lime }]} accessibilityRole="button">
        <Text style={[styles.homeText, { color: colors.onLime }]}>Volver al inicio</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 12,
    gap: 8,
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  live: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 2,
    marginBottom: 4,
  },
  liveText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 21,
    lineHeight: 24.2,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    lineHeight: 16.9,
  },
  eta: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  etaNumber: {
    fontFamily: FontFamily.semibold,
    fontSize: 24,
    lineHeight: 25.2,
  },
  etaUnit: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  etaSmall: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
  },
  steps: {
    flexDirection: 'row',
    gap: 4,
  },
  stepCol: {
    flex: 1,
    gap: 5,
  },
  stepTrack: {
    height: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stepFill: {
    height: '100%',
    borderRadius: 4,
  },
  stepLabel: {
    textAlign: 'center',
    fontFamily: FontFamily.regular,
    fontSize: 9.5,
  },
  stepLabelCur: {
    fontFamily: FontFamily.semibold,
  },
  finding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  findingText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
  },
  rider: {},
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  riderText: {
    flex: 1,
  },
  riderName: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
  },
  riderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  riderSmall: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
  },
  roundAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  vehicleText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
  },
  plate: {
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  plateText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    letterSpacing: 0.48,
  },
  timeline: {
    gap: 0,
  },
  sectionTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    marginBottom: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 34,
  },
  timelineLine: {
    position: 'absolute',
    left: 9.25,
    top: -12,
    height: 22,
    width: 1.5,
  },
  timelineDotCell: {
    width: 20,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  dotCurrent: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
  },
  timelineLabel: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13.5,
  },
  timelineLabelCur: {
    fontFamily: FontFamily.semibold,
  },
  timelineTime: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
  },
  stopwatch: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  stopwatchText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
  },
  fromTo: {
    gap: 2,
  },
  fromRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pinCell: {
    width: 30,
    alignItems: 'center',
  },
  fromSmall: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
  },
  fromTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
  },
  dashed: {
    marginLeft: 14,
  },
  km: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
  },
  kmText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
  },
  yourOrder: {
    gap: 6,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderThumb: {
    width: 36,
    alignItems: 'center',
  },
  orderImage: {
    width: 32,
    height: 32,
  },
  orderQty: {
    fontFamily: FontFamily.semibold,
    fontSize: 13.5,
  },
  orderName: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13.5,
  },
  orderPrice: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
  },
  paid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  paidTotal: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
  },
  rating: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  check: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
  },
  stars: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 6,
  },
  homeButton: {
    alignSelf: 'stretch',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 15.5,
  },
});
