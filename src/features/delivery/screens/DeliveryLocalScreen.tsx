import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Reanimated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { DeliveryStackParamList } from '@navigation/types';
import { FontFamily } from '@theme/fonts';
import { DeliveryColors } from '@theme/colors';
import { useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { GradientFill } from '../components/GradientFill';
import { CartFab } from '../components/CartFab';
import { DeliveryToast, useToast } from '../components/DeliveryToast';
import { MenuList, ProductCard, StoreChips, StoreInfoCard, VoucherStrip } from '../components/local/StoreBlocks';
import { PRODUCTS, RESTAURANTS, RESTAURANT_DETAILS, type Voucher } from '../data/mock';

type Props = NativeStackScreenProps<DeliveryStackParamList, 'DeliveryLocal'>;

/** Foto del local: 236 en el mockup, de los cuales 44 son la barra de estado. */
const HERO_BODY = 192;
/** La tarjeta del local se sube 46 sobre la foto (.scroll margin-top:-46px) y luego viene el padding de 4. */
const CARD_OVERLAP = 46;
/** Barra compacta (.appbar): 4 + botón 40 + 8. */
const BAR_BODY = 52;

/** Local (del-05 / del-06). */
export function DeliveryLocalScreen({ route, navigation }: Props) {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  const restaurant = RESTAURANTS[route.params.restaurantId];
  const details = RESTAURANT_DETAILS[route.params.restaurantId];
  const scrollY = useSharedValue(0);
  const favorite = useFavoritesStore((s) => s.restaurantIds.includes(route.params.restaurantId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleRestaurant);
  const [claimedIds, setClaimedIds] = React.useState<string[]>([]);
  const { toast, show } = useToast();

  const heroHeight = insets.top + HERO_BODY;
  const barHeight = insets.top + BAR_BODY;
  // La barra aparece mientras la foto termina de pasar por debajo de ella.
  const collapseEnd = heroHeight - barHeight;
  const collapseStart = collapseEnd - 48;

  const [statusStyle, setStatusStyle] = React.useState<'light' | 'dark'>('light');
  useStatusBarStyle(statusStyle);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Barra de estado blanca sobre la foto y oscura con la barra compacta.
  const onScrollEnd = React.useCallback(
    (y: number) => setStatusStyle(y > collapseStart + 24 ? 'dark' : 'light'),
    [collapseStart],
  );

  const handleClaim = (voucher: Voucher) => {
    setClaimedIds((ids) => [...ids, voucher.id]);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    show({
      icon: 'ticket-outline',
      title: 'Cupón reclamado',
      subtitle: `${voucher.code ?? voucher.title} · Se aplica al pagar`,
    });
  };

  const openCart = () => navigation.navigate('DeliveryTabs', { screen: 'DeliveryCarrito' });
  const openProduct = (productId: string) => navigation.navigate('DeliveryProducto', { productId });

  if (!restaurant || !details) return null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Reanimated.ScrollView
        onScroll={onScroll}
        onScrollEndDrag={(event) => onScrollEnd(event.nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={(event) => onScrollEnd(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.hero, { height: heroHeight, paddingTop: insets.top }]}>
          <GradientFill
            type="radial"
            cx={0.6}
            cy={0.55}
            rx={0.7}
            ry={0.9}
            stops={[
              { color: details.heroGradient[0], offset: 0 },
              { color: details.heroGradient[1], offset: 0.7 },
              { color: details.heroGradient[2], offset: 1 },
            ]}
          />
          <Image source={restaurant.image} style={styles.heroImage} />
        </View>

        <View style={[styles.content, { marginTop: -CARD_OVERLAP }]}>
          <StoreInfoCard
            restaurant={restaurant}
            reviews={details.reviews}
            cuisine={details.cuisine}
            deliveryLabel={details.deliveryLabel}
            fromMinutes={details.fromMinutes}
          />
          <StoreChips groupDiscount={details.groupDiscount} />
          <VoucherStrip vouchers={details.vouchers} claimedIds={claimedIds} onClaim={handleClaim} />

          <Text style={[styles.forYou, { color: colors.ink }]} accessibilityRole="header">
            Para ti
          </Text>
          <View style={styles.grid}>
            {chunk(details.forYou, 2).map((row) => (
              <View key={row.join('-')} style={styles.gridRow}>
                {row.map((id) => (
                  <ProductCard key={id} product={PRODUCTS[id]} onPress={() => openProduct(id)} onAdd={() => openProduct(id)} />
                ))}
              </View>
            ))}
          </View>

          {details.sections.map((section) => (
            <React.Fragment key={section.title}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionTitle, { color: colors.ink }]} accessibilityRole="header">
                  {section.title}
                </Text>
                <Text style={[styles.sectionCount, { color: colors.muted }]}>{section.countLabel}</Text>
              </View>
              <MenuList
                products={section.productIds.map((id) => PRODUCTS[id])}
                onPress={(product) => openProduct(product.id)}
                onAdd={(product) => openProduct(product.id)}
              />
            </React.Fragment>
          ))}
        </View>
      </Reanimated.ScrollView>

      <StoreTopBar
        title={restaurant.name.split(' – ')[0]}
        topInset={insets.top}
        scrollY={scrollY}
        range={[collapseStart, collapseEnd]}
        favorite={favorite}
        onBack={() => navigation.goBack()}
        onToggleFavorite={() => toggleFavorite(route.params.restaurantId)}
      />

      <DeliveryToast toast={toast} bottom={96} />
      <CartFab onPress={openCart} />
    </View>
  );
}

function chunk<T>(list: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < list.length; index += size) rows.push(list.slice(index, index + size));
  return rows;
}

interface StoreTopBarProps {
  title: string;
  topInset: number;
  scrollY: SharedValue<number>;
  range: [number, number];
  favorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
}

/**
 * Botones sobre la foto (.rhero .tb) que se vuelven la barra compacta (.appbar) al hacer scroll:
 * el fondo y el título aparecen con un fundido y los botones pasan de translúcidos a blancos.
 */
function StoreTopBar({ title, topInset, scrollY, range, favorite, onBack, onToggleFavorite }: StoreTopBarProps) {
  const colors = useDeliveryColors();

  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, range, [0, 1], Extrapolation.CLAMP),
  }));
  const buttonStyle = useAnimatedStyle(() => {
    const progress = interpolate(scrollY.value, range, [0, 1], Extrapolation.CLAMP);
    return {
      backgroundColor: interpolateColor(progress, [0, 1], [colors.heroButton, colors.card]),
      shadowOpacity: 0.08 * progress,
    };
  });
  const lightIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, range, [1, 0], Extrapolation.CLAMP),
  }));
  const darkIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, range, [0, 1], Extrapolation.CLAMP),
  }));

  const icon = (name: keyof typeof Ionicons.glyphMap) => (
    <>
      <Reanimated.View style={[styles.iconLayer, lightIconStyle]}>
        <Ionicons name={name} size={20} color={colors.onDark} />
      </Reanimated.View>
      <Reanimated.View style={[styles.iconLayer, darkIconStyle]}>
        <Ionicons name={name} size={20} color={colors.ink} />
      </Reanimated.View>
    </>
  );

  return (
    <View style={[styles.topBar, { paddingTop: topInset + 4 }]} pointerEvents="box-none">
      <Reanimated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, barStyle]} pointerEvents="none" />
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver">
        <Reanimated.View style={[styles.roundButton, buttonStyle]}>{icon('arrow-back')}</Reanimated.View>
      </Pressable>
      <Reanimated.Text style={[styles.barTitle, { color: colors.ink }, barStyle]} numberOfLines={1}>
        {title}
      </Reanimated.Text>
      <Pressable
        onPress={onToggleFavorite}
        style={styles.favorite}
        accessibilityRole="button"
        accessibilityState={{ selected: favorite }}
        accessibilityLabel={favorite ? 'Quitar de guardados' : 'Guardar local'}
      >
        <Reanimated.View style={[styles.roundButton, buttonStyle]}>
          {icon(favorite ? 'heart' : 'heart-outline')}
        </Reanimated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: {
    width: 150,
    height: 150,
    marginTop: -30,
  },
  // .pad: padding 4 14 14, gap 12
  content: {
    paddingTop: 4,
    paddingHorizontal: 14,
    gap: 12,
  },
  forYou: {
    fontFamily: FontFamily.semibold,
    fontSize: 19,
    lineHeight: 25.6,
    letterSpacing: -0.19,
  },
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 24.3,
    letterSpacing: -0.18,
  },
  sectionCount: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    lineHeight: 16.9,
    marginLeft: 6,
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
    // 0 1px 4px rgba(17,21,25,.08) en la barra compacta
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  iconLayer: {
    position: 'absolute',
  },
  barTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 21.6,
  },
  // En .appbar quedan dos columnas vacías después del favorito (2 × gap de 8).
  favorite: {
    marginRight: 16,
  },
});
