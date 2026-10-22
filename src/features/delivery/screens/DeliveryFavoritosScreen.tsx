import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { FadeOut, LinearTransition, useAnimatedScrollHandler } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { DeliveryStackParamList } from '@navigation/types';
import { FontFamily } from '@theme/fonts';
import { DeliveryShadow, useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { useOrderPill } from '../hooks/useOrderPill';
import { useTabBarScrollY, useTabBarSpace } from '../components/tabbar/TabBarScroll';
import { RestaurantCard } from '../components/RestaurantCard';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { formatSoles } from '../utils/money';
import { PRODUCTS, RESTAURANTS, RESTAURANT_DETAILS } from '../data/mock';

/** Favoritos: locales y platos guardados con el corazón. */
export function DeliveryFavoritosScreen() {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<DeliveryStackParamList>>();
  useStatusBarStyle('dark');

  const restaurantIds = useFavoritesStore((s) => s.restaurantIds);
  const productIds = useFavoritesStore((s) => s.productIds);
  const toggleRestaurant = useFavoritesStore((s) => s.toggleRestaurant);
  const toggleProduct = useFavoritesStore((s) => s.toggleProduct);
  const bottomSpace = useTabBarSpace(useOrderPill() !== null);
  const tabBarScrollY = useTabBarScrollY();
  const onScroll = useAnimatedScrollHandler((event) => {
    tabBarScrollY.value = event.contentOffset.y;
  });

  const unsave = (kind: 'restaurant' | 'product', id: string) => {
    void Haptics.selectionAsync();
    if (kind === 'restaurant') toggleRestaurant(id);
    else toggleProduct(id);
  };

  const empty = restaurantIds.length === 0 && productIds.length === 0;
  const rows: string[][] = [];
  for (let index = 0; index < restaurantIds.length; index += 2) rows.push(restaurantIds.slice(index, index + 2));

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top + 8 }]}>
      <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
        Favoritos
      </Text>
      <Reanimated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}
        showsVerticalScrollIndicator={false}
      >
        {empty ? (
          <View style={[styles.empty, { backgroundColor: colors.card }, DeliveryShadow.card]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.limeSoft }]}>
              <Ionicons name="heart-outline" size={26} color={colors.olive} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>Aún no tienes favoritos</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Toca el corazón en un local o en un plato para guardarlo aquí.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('DeliveryTabs', { screen: 'DeliveryInicio' })}
              style={[styles.emptyButton, { backgroundColor: colors.lime }]}
              accessibilityRole="button"
            >
              <Text style={[styles.emptyButtonText, { color: colors.onLime }]}>Explorar locales</Text>
            </Pressable>
          </View>
        ) : null}

        {restaurantIds.length > 0 ? (
          <>
            <Text style={[styles.section, { color: colors.ink }]}>
              Locales <Text style={[styles.count, { color: colors.muted }]}>{restaurantIds.length}</Text>
            </Text>
            {rows.map((row) => (
              <View key={row.join('-')} style={styles.grid}>
                {row.map((id) => (
                  <Reanimated.View key={id} style={styles.flex} exiting={FadeOut.duration(160)} layout={LinearTransition.duration(200)}>
                    <RestaurantCard
                      restaurant={RESTAURANTS[id]}
                      onPress={RESTAURANT_DETAILS[id] ? () => navigation.navigate('DeliveryLocal', { restaurantId: id }) : undefined}
                    />
                    <HeartButton onPress={() => unsave('restaurant', id)} label={RESTAURANTS[id].name} />
                  </Reanimated.View>
                ))}
                {row.length === 1 ? <View style={styles.flex} /> : null}
              </View>
            ))}
          </>
        ) : null}

        {productIds.length > 0 ? (
          <>
            <Text style={[styles.section, { color: colors.ink }]}>
              Platos <Text style={[styles.count, { color: colors.muted }]}>{productIds.length}</Text>
            </Text>
            <View style={[styles.list, { backgroundColor: colors.card }, DeliveryShadow.card]}>
              {productIds.map((id, index) => {
                const product = PRODUCTS[id];
                return (
                  <Reanimated.View key={id} exiting={FadeOut.duration(160)} layout={LinearTransition.duration(200)}>
                    <Pressable
                      onPress={() => navigation.navigate('DeliveryProducto', { productId: id })}
                      style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}
                      accessibilityRole="button"
                      accessibilityLabel={`${product.name}, ${formatSoles(product.price)}`}
                    >
                      <View style={[styles.thumb, { backgroundColor: product.tint }]}>
                        <Image source={product.image} style={styles.thumbImage} />
                      </View>
                      <View style={styles.flex}>
                        <Text style={[styles.rowTitle, { color: colors.ink }]}>{product.name}</Text>
                        <Text style={[styles.rowSmall, { color: colors.muted }]}>
                          {RESTAURANTS[product.restaurantId].name.split(' – ')[0]} · {formatSoles(product.price)}
                        </Text>
                      </View>
                      <Pressable onPress={() => unsave('product', id)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Quitar ${product.name} de favoritos`}>
                        <Ionicons name="heart" size={22} color={colors.red} />
                      </Pressable>
                    </Pressable>
                  </Reanimated.View>
                );
              })}
            </View>
          </>
        ) : null}
      </Reanimated.ScrollView>
    </View>
  );
}

function HeartButton({ onPress, label }: { onPress: () => void; label: string }) {
  const colors = useDeliveryColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={[styles.heart, { backgroundColor: colors.card }]}
      accessibilityRole="button"
      accessibilityLabel={`Quitar ${label} de favoritos`}
    >
      <Ionicons name="heart" size={16} color={colors.red} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 28,
    lineHeight: 34,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  content: {
    paddingHorizontal: 14,
    gap: 10,
  },
  section: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    marginTop: 4,
  },
  count: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  heart: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: 38,
    height: 38,
  },
  rowTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 14.5,
  },
  rowSmall: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
  },
  empty: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 6,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
  },
});
