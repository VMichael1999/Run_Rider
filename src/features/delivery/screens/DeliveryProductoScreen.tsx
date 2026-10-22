import React from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Reanimated, {
  Easing,
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { DeliveryStackParamList } from '@navigation/types';
import { FontFamily } from '@theme/fonts';
import { DeliveryColors } from '@theme/colors';
import { cartCount, useCartStore } from '@store/useCartStore';
import { useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { StoreLogo } from '../components/StoreLogo';
import { DeliveryToast, useToast } from '../components/DeliveryToast';
import { GroupHeader, OptionGroupView } from '../components/producto/OptionGroupView';
import { formatSoles } from '../utils/money';
import { defaultSelections, optionsLabel, unitPrice, type Selections } from '../utils/productPrice';
import { PRODUCT_DETAILS, PRODUCTS, RESTAURANTS, RESTAURANT_DETAILS } from '../data/mock';

type Props = NativeStackScreenProps<DeliveryStackParamList, 'DeliveryProducto'>;

/** Foto del producto: 232 en el mockup, de los cuales 44 son la barra de estado. */
const HERO_BODY = 188;
/** Barra (.tb / .appbar): 4 + botón 40 + 8. */
const BAR_BODY = 52;
const NOTE_LIMIT = 200;
/** El aviso "3 × … agregados" queda 7 por encima del pie (bottom:92px sobre un pie de 85). */
const LOW_TOAST_GAP = 7;
const FLIGHT_MS = 600;
const IMAGE_SIZE = 150;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Producto (del-07 / del-08). */
export function DeliveryProductoScreen({ route, navigation }: Props) {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  useStatusBarStyle('dark');

  const product = PRODUCTS[route.params.productId];
  const restaurant = RESTAURANTS[product.restaurantId];
  const storeDetails = RESTAURANT_DETAILS[product.restaurantId];
  const details = PRODUCT_DETAILS[product.id];
  const groups = React.useMemo(() => details?.groups ?? [], [details]);

  const [selections, setSelections] = React.useState<Selections>(() => defaultSelections(groups));
  const [activeGroup, setActiveGroup] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [note, setNote] = React.useState('');
  const favorite = useFavoritesStore((s) => s.productIds.includes(route.params.productId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleProduct);
  const addItem = useCartStore((s) => s.addItem);
  const count = useCartStore((s) => cartCount(s.items));
  const { toast, show } = useToast();

  const price = unitPrice(product.price, groups, selections);
  const total = Math.round(price * quantity * 100) / 100;

  const scrollY = useSharedValue(0);
  const heroHeight = insets.top + HERO_BODY;
  const barHeight = insets.top + BAR_BODY;
  const collapseEnd = heroHeight - barHeight;
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const toggle = (groupId: string, optionId: string) => {
    const group = groups.find((item) => item.id === groupId);
    if (!group) return;
    setActiveGroup(groupId);
    void Haptics.selectionAsync();
    setSelections((current) => {
      const chosen = current[groupId] ?? [];
      if (group.type === 'single') return { ...current, [groupId]: [optionId] };
      return {
        ...current,
        [groupId]: chosen.includes(optionId) ? chosen.filter((id) => id !== optionId) : [...chosen, optionId],
      };
    });
  };

  // Vuelo de la foto al carrito y pulso del contador.
  const heroImageRef = React.useRef<View>(null);
  const cartButtonRef = React.useRef<View>(null);
  const [flight, setFlight] = React.useState<{ from: Rect; to: Rect } | null>(null);
  const badgeScale = useSharedValue(1);

  const finishAdd = React.useCallback(
    (addedQuantity: number) => {
      addItem({
        productId: product.id,
        restaurantId: product.restaurantId,
        name: product.name,
        options: optionsLabel(groups, selections),
        unitPrice: price,
        quantity: addedQuantity,
      });
      setFlight(null);
      badgeScale.value = reduceMotion ? 1 : withSequence(withTiming(1.35, { duration: 140 }), withTiming(1, { duration: 160 }));
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      show({
        icon: 'checkmark',
        title: `${addedQuantity} × ${product.name} ${addedQuantity === 1 ? 'agregado' : 'agregados'}`,
      });
    },
    [addItem, badgeScale, groups, price, product, reduceMotion, selections, show],
  );

  const handleAdd = () => {
    if (flight) return;
    if (reduceMotion) {
      finishAdd(quantity);
      return;
    }
    const addedQuantity = quantity;
    cartButtonRef.current?.measureInWindow((tx, ty, tw, th) => {
      heroImageRef.current?.measureInWindow((x, y, width, height) => {
        // Si la foto ya salió de la pantalla, vuela desde el botón Agregar.
        const visible = y + height > barHeight;
        const from = visible
          ? { x, y, width, height }
          : { x: 0, y: windowHeight - 150, width: IMAGE_SIZE, height: IMAGE_SIZE };
        setFlight({ from, to: { x: tx, y: ty, width: tw, height: th } });
        setTimeout(() => finishAdd(addedQuantity), FLIGHT_MS);
      });
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Reanimated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.hero, { height: heroHeight, backgroundColor: colors.productHero }]}>
          <View ref={heroImageRef} collapsable={false} style={styles.heroImageWrap}>
            <Image source={product.image} style={styles.heroImage} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
              {product.name}
            </Text>
            <Text style={[styles.titlePrice, { color: colors.ink }]}>{formatSoles(product.price)}</Text>
          </View>

          <View style={styles.meta}>
            <StoreLogo logo={restaurant.logo} size={18} radius={5} fontSize={7.5} />
            <Text style={[styles.metaText, styles.metaStrong, { color: colors.ink }]}>{restaurant.name.split(' – ')[0]}</Text>
            {details ? (
              <>
                <Text style={[styles.metaText, { color: colors.muted }]}>·</Text>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={13} color={colors.star} />
                  <Text style={[styles.metaText, { color: colors.ink }]}>{details.rating.toFixed(1)}</Text>
                </View>
                <Text style={[styles.metaText, { color: colors.muted }]}>({details.reviews}) ›</Text>
              </>
            ) : null}
          </View>

          {product.description ? (
            <Text style={[styles.description, { color: colors.muted }]}>{product.description}</Text>
          ) : null}

          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.muted} />
              <Text style={[styles.metaText, { color: colors.muted }]}>{product.minutes} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="flash-outline" size={13} color={colors.muted} />
              <Text style={[styles.metaText, { color: colors.muted }]}>{product.kcal} kcal</Text>
            </View>
            {storeDetails ? (
              <View style={styles.metaItem}>
                <Ionicons name="bicycle-outline" size={13} color={colors.muted} />
                <Text style={[styles.metaText, { color: colors.muted }]}>{storeDetails.deliveryLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.separator, { backgroundColor: colors.line }]} />

          {groups.map((group) => (
            <OptionGroupView
              key={group.id}
              group={group}
              selected={selections[group.id] ?? []}
              active={activeGroup === group.id}
              onToggle={(optionId) => toggle(group.id, optionId)}
            />
          ))}

          <View style={[styles.noteGroup, { borderBottomColor: colors.line }]}>
            <GroupHeader title="Nota para el local" tag="Opcional" />
            <TextInput
              value={note}
              onChangeText={setNote}
              onFocus={() => setActiveGroup(null)}
              maxLength={NOTE_LIMIT}
              multiline
              placeholder="Ej.: sin cebolla, más servilletas."
              placeholderTextColor={colors.faint}
              style={[styles.note, { backgroundColor: colors.soft, color: colors.ink }]}
              accessibilityLabel="Nota para el local"
            />
            <Text style={[styles.noteCount, { color: colors.faint }]}>
              {note.length}/{NOTE_LIMIT}
            </Text>
          </View>
        </View>
      </Reanimated.ScrollView>

      <ProductTopBar
        title={product.name}
        topInset={insets.top}
        scrollY={scrollY}
        range={[collapseEnd - 40, collapseEnd]}
        favorite={favorite}
        count={count}
        badgeScale={badgeScale}
        cartRef={cartButtonRef}
        onBack={() => navigation.goBack()}
        onToggleFavorite={() => toggleFavorite(route.params.productId)}
        onOpenCart={() => navigation.navigate('DeliveryTabs', { screen: 'DeliveryCarrito' })}
      />

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.line }]}>
        <View style={[styles.stepper, { backgroundColor: colors.soft }]}>
          <Pressable
            onPress={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity === 1}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Quitar una unidad"
          >
            <Ionicons name="remove" size={16} color={colors.muted} />
          </Pressable>
          <Reanimated.Text
            key={quantity}
            entering={reduceMotion ? undefined : FadeIn.duration(140)}
            style={[styles.stepperValue, { color: colors.ink }]}
            accessibilityLabel={`${quantity} unidades`}
          >
            {quantity}
          </Reanimated.Text>
          <Pressable
            onPress={() => setQuantity((value) => value + 1)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Agregar una unidad"
          >
            <Ionicons name="add" size={16} color={colors.muted} />
          </Pressable>
        </View>
        <Pressable
          onPress={handleAdd}
          style={[styles.addButton, { backgroundColor: colors.lime }]}
          accessibilityRole="button"
          accessibilityLabel={`Agregar ${quantity} al carrito por ${formatSoles(total)}`}
        >
          <Text style={[styles.addText, { color: colors.onLime }]}>Agregar · {formatSoles(total)}</Text>
        </Pressable>
      </View>

      <DeliveryToast toast={toast} bottom={FOOTER_HEIGHT + LOW_TOAST_GAP} variant="low" />
      {flight ? <FlyingImage source={product.image} from={flight.from} to={flight.to} /> : null}
    </View>
  );
}

/** Pie (.pfoot): 10 + botón 50 + 24, más el borde. */
const FOOTER_HEIGHT = 85;

interface FlyingImageProps {
  source: ImageSourcePropType;
  from: Rect;
  to: Rect;
}

/** La foto vuela en arco hasta el carrito, escalando de 1 a 0.2. */
function FlyingImage({ source, from, to }: FlyingImageProps) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(1, { duration: FLIGHT_MS, easing: Easing.inOut(Easing.cubic) });
  }, [progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const startX = from.x + from.width / 2;
    const startY = from.y + from.height / 2;
    const endX = to.x + to.width / 2;
    const endY = to.y + to.height / 2;
    // Arco: sube un poco más que la recta antes de llegar al ícono.
    const arc = -90 * Math.sin(Math.PI * p);
    return {
      transform: [
        { translateX: startX + (endX - startX) * p - IMAGE_SIZE / 2 },
        { translateY: startY + (endY - startY) * p + arc - IMAGE_SIZE / 2 },
        { scale: interpolate(p, [0, 1], [from.width / IMAGE_SIZE, 0.2]) },
      ],
      opacity: interpolate(p, [0, 0.85, 1], [1, 1, 0.4]),
    };
  });

  return (
    <Reanimated.View style={[styles.flying, style]} pointerEvents="none">
      <Image source={source} style={styles.heroImage} />
    </Reanimated.View>
  );
}

interface ProductTopBarProps {
  title: string;
  topInset: number;
  scrollY: SharedValue<number>;
  range: [number, number];
  favorite: boolean;
  count: number;
  badgeScale: SharedValue<number>;
  cartRef: React.RefObject<View | null>;
  onBack: () => void;
  onToggleFavorite: () => void;
  onOpenCart: () => void;
}

/** Botones sobre la foto (.pimg .tb); al hacer scroll aparecen el fondo y el título (.appbar). */
function ProductTopBar({
  title,
  topInset,
  scrollY,
  range,
  favorite,
  count,
  badgeScale,
  cartRef,
  onBack,
  onToggleFavorite,
  onOpenCart,
}: ProductTopBarProps) {
  const colors = useDeliveryColors();
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, range, [0, 1], Extrapolation.CLAMP),
  }));
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value }] }));
  const button = [styles.roundButton, { backgroundColor: colors.card }];

  return (
    <View style={[styles.topBar, { paddingTop: topInset + 4 }]} pointerEvents="box-none">
      <Reanimated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, fadeStyle]} pointerEvents="none" />
      <Pressable onPress={onBack} style={button} accessibilityRole="button" accessibilityLabel="Volver">
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
      </Pressable>
      <Reanimated.Text style={[styles.barTitle, { color: colors.ink }, fadeStyle]} numberOfLines={1}>
        {title}
      </Reanimated.Text>
      <Pressable
        onPress={onToggleFavorite}
        style={button}
        accessibilityRole="button"
        accessibilityState={{ selected: favorite }}
        accessibilityLabel={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={colors.ink} />
      </Pressable>
      <Pressable style={button} accessibilityRole="button" accessibilityLabel="Compartir producto">
        <Ionicons name="share-social-outline" size={20} color={colors.ink} />
      </Pressable>
      <Pressable
        ref={cartRef}
        collapsable={false}
        onPress={onOpenCart}
        style={button}
        accessibilityRole="button"
        accessibilityLabel={`Ver carrito, ${count} productos`}
      >
        <Ionicons name="bag-outline" size={20} color={colors.ink} />
        {count > 0 ? (
          <Reanimated.View style={[styles.badge, { backgroundColor: colors.inkFill, borderColor: colors.card }, badgeStyle]}>
            <Text style={[styles.badgeText, { color: colors.lime }]}>{count}</Text>
          </Reanimated.View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: FOOTER_HEIGHT + 14,
  },
  hero: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  heroImageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  heroImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  // .pad con gap 10 y padding-top 14
  content: {
    paddingTop: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 10,
  },
  title: {
    flexShrink: 1,
    fontFamily: FontFamily.semibold,
    fontSize: 21,
    lineHeight: 28.3,
    letterSpacing: -0.21,
  },
  titlePrice: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 24.3,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 5,
    rowGap: 3,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16.2,
  },
  metaStrong: {
    fontFamily: FontFamily.semibold,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 17.55,
  },
  separator: {
    height: 1,
  },
  noteGroup: {
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  note: {
    height: 72,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  noteCount: {
    textAlign: 'right',
    fontFamily: FontFamily.regular,
    fontSize: 11,
    lineHeight: 14.8,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  stepper: {
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
  },
  stepperValue: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 21.6,
    minWidth: 10,
    textAlign: 'center',
  },
  addButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontFamily: FontFamily.semibold,
    fontSize: 15.5,
  },
  flying: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 20,
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // .icb: 0 1px 4px rgba(17,21,25,.08)
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  barTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 21.6,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    lineHeight: 13,
  },
});
