import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily } from '@theme/fonts';
import { useDeliveryColors } from '../../theme';
import { StoreLogo } from '../StoreLogo';
import { RESTAURANTS, type Voucher } from '../../data/mock';
import { formatSoles } from '../../utils/money';

const SHEET_MS = 240;

/**
 * Monta el contenido mientras se ve o se está cerrando, y anima de 0 a 1 al abrir y de vuelta al cerrar.
 */
function useOverlay(visible: boolean) {
  const [mounted, setMounted] = React.useState(visible);
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: SHEET_MS, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [mounted, progress, visible]);

  const dimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  return { mounted, progress, dimStyle };
}

interface CouponSheetProps {
  visible: boolean;
  vouchers: Voucher[];
  selectedId: string | null;
  onSelect: (voucherId: string) => void;
  onClose: () => void;
}

/** Hoja "Mis cupones" (del-13): sube sobre el fondo oscurecido; se cierra tocando afuera, arrastrando o con atrás. */
export function CouponSheet({ visible, vouchers, selectedId, onSelect, onClose }: CouponSheetProps) {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  const { mounted, progress, dimStyle } = useOverlay(visible);
  const drag = useSharedValue(0);
  const [height, setHeight] = React.useState(400);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height + Math.max(0, drag.value) }],
  }));

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      drag.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY > 80 || event.velocityY > 800) {
        runOnJS(onClose)();
      }
      drag.value = withTiming(0, { duration: 200 });
    });

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.fill}>
        <Reanimated.View style={[styles.fill, { backgroundColor: colors.dim }, dimStyle]}>
          <Pressable style={styles.fill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar cupones" />
        </Reanimated.View>
        <GestureDetector gesture={pan}>
          <Reanimated.View
            onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
            style={[
              styles.sheet,
              { backgroundColor: colors.bg, paddingBottom: Math.max(28, insets.bottom + 8) },
              sheetStyle,
            ]}
          >
            <View style={[styles.grab, { backgroundColor: colors.line }]} />
            <Text style={[styles.sheetTitle, { color: colors.ink }]} accessibilityRole="header">
              Mis cupones
            </Text>
            <Text style={[styles.sheetSubtitle, { color: colors.muted }]}>Elige uno para este pedido</Text>
            {vouchers.map((voucher) => {
              const store = voucher.issuer.type === 'store' ? RESTAURANTS[voucher.issuer.restaurantId] : null;
              const on = voucher.id === selectedId;
              return (
                <Pressable
                  key={voucher.id}
                  onPress={() => onSelect(voucher.id)}
                  style={[styles.option, { backgroundColor: colors.card }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${voucher.title}${store ? `, ${store.name}` : ''}, mínimo ${formatSoles(voucher.minSubtotal ?? 0)}`}
                >
                  {store ? <StoreLogo logo={store.logo} size={40} radius={12} fontSize={14} /> : null}
                  <View style={styles.optionText}>
                    <View style={styles.optionTitleRow}>
                      <Text style={[styles.optionTitle, { color: colors.ink }]}>
                        {voucher.title}
                        {store ? ` · ${store.name.split(' – ')[0]}` : ''}
                      </Text>
                      <View style={[styles.optionCount, { backgroundColor: colors.limeSoft }]}>
                        <Text style={[styles.optionCountText, { color: colors.olive }]}>x{voucher.available}</Text>
                      </View>
                    </View>
                    {voucher.minSubtotal ? (
                      <Text style={[styles.optionSmall, { color: colors.muted }]}>Mín. {formatSoles(voucher.minSubtotal)}</Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.radio,
                      on ? { borderWidth: 6, borderColor: colors.limeStrong } : { borderColor: colors.faint },
                    ]}
                  />
                </Pressable>
              );
            })}
          </Reanimated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

interface ConfirmDialogProps {
  visible: boolean;
  rows: { label: string; value: string; icon?: keyof typeof Ionicons.glyphMap }[];
  onCancel: () => void;
  onConfirm: () => void;
}

/** "¿Confirmar el pedido?" (del-14): fundido con escala 0.96 → 1. */
export function ConfirmDialog({ visible, rows, onCancel, onConfirm }: ConfirmDialogProps) {
  const colors = useDeliveryColors();
  const reduceMotion = useReducedMotion();
  const { mounted, progress, dimStyle } = useOverlay(visible);

  const dialogStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: reduceMotion ? 1 : 0.96 + 0.04 * progress.value }],
  }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Reanimated.View style={[styles.fill, { backgroundColor: colors.dim }, dimStyle]}>
        <Pressable style={styles.fill} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancelar" />
      </Reanimated.View>
      <View style={styles.dialogWrap} pointerEvents="box-none">
        <Reanimated.View style={[styles.dialog, { backgroundColor: colors.card }, dialogStyle]} accessibilityViewIsModal>
          <Text style={[styles.sheetTitle, styles.center, { color: colors.ink }]} accessibilityRole="header">
            ¿Confirmar el pedido?
          </Text>
          <Text style={[styles.dialogSubtitle, { color: colors.muted }]}>Revisa los datos antes de confirmar.</Text>
          <View style={[styles.table, { backgroundColor: colors.soft }]}>
            {rows.map((row, index) => (
              <View key={row.label} style={[styles.tableRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}>
                <Text style={[styles.tableLabel, { color: colors.muted }]}>{row.label}</Text>
                <View style={styles.tableValue}>
                  {row.icon ? <Ionicons name={row.icon} size={13} color={colors.ink} /> : null}
                  <Text style={[styles.tableValueText, { color: colors.ink }]}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={[styles.action, styles.actionLine, { backgroundColor: colors.card, borderColor: colors.line }]}
              accessibilityRole="button"
            >
              <Text style={[styles.actionText, { color: colors.ink }]}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.action, { backgroundColor: colors.lime }]} accessibilityRole="button">
              <Text style={[styles.actionText, { color: colors.onLime }]}>Confirmar</Text>
            </Pressable>
          </View>
        </Reanimated.View>
      </View>
    </Modal>
  );
}

/** Indicador de carga (.spin): aro de 22 con el borde superior en tinta; 'soft' es .spin.dk (lima). */
export function Spinner({ tone = 'ink' }: { tone?: 'ink' | 'soft' }) {
  const colors = useDeliveryColors();
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 800, easing: Easing.linear }), -1);
  }, [rotation]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <Reanimated.View
      style={[
        styles.spinner,
        tone === 'soft'
          ? { borderColor: colors.limeSoft, borderTopColor: colors.limeStrong }
          : { borderColor: colors.spinnerTrack, borderTopColor: colors.ink },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={tone === 'soft' ? 'Buscando' : 'Enviando el pedido'}
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 14,
    gap: 4,
  },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 6,
  },
  sheetTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 24.3,
  },
  center: {
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    marginBottom: 8,
  },
  option: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  optionTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
  },
  optionCount: {
    borderRadius: 5,
    paddingHorizontal: 5,
  },
  optionCountText: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
  },
  optionSmall: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  dialogWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  dialog: {
    borderRadius: 22,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  dialogSubtitle: {
    textAlign: 'center',
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
  },
  table: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tableLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
  },
  tableValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableValueText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    flex: 1,
    height: 46,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLine: {
    borderWidth: 1.5,
  },
  actionText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14.5,
  },
  spinner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
  },
});
