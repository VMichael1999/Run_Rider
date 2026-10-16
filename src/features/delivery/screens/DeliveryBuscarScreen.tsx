import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { DeliveryStackParamList } from '@navigation/types';
import { FontFamily } from '@theme/fonts';
import { DeliveryShadow, useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { useDeliverySearchStore } from '../store/useDeliverySearchStore';
import { useTabBarSpace } from '../components/tabbar/TabBarScroll';
import { StoreLogo } from '../components/StoreLogo';
import { formatSoles } from '../utils/money';
import { RESTAURANTS, RESTAURANT_DETAILS } from '../data/mock';
import { searchCatalog } from '../utils/searchCatalog';

/** Resultados de la pestaña de búsqueda: locales y platos mientras se escribe. */
export function DeliveryBuscarScreen() {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<DeliveryStackParamList>>();
  const bottomSpace = useTabBarSpace(false);
  const query = useDeliverySearchStore((s) => s.query);
  const results = React.useMemo(() => searchCatalog(query), [query]);
  useStatusBarStyle('dark');

  const empty = query.trim().length > 0 && results.restaurants.length === 0 && results.products.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top + 8 }]}>
      <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
        Buscar
      </Text>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}
        showsVerticalScrollIndicator={false}
      >
        {!query.trim() ? (
          <Text style={[styles.hint, { color: colors.muted }]}>Escribe el nombre de un local o de un plato.</Text>
        ) : null}
        {empty ? (
          <Text style={[styles.hint, { color: colors.muted }]}>No encontramos “{query.trim()}”.</Text>
        ) : null}

        {results.restaurants.length > 0 ? (
          <>
            <Text style={[styles.section, { color: colors.ink }]}>Locales</Text>
            <View style={[styles.card, { backgroundColor: colors.card }, DeliveryShadow.card]}>
              {results.restaurants.map((restaurant, index) => {
                const enabled = Boolean(RESTAURANT_DETAILS[restaurant.id]);
                return (
                  <Pressable
                    key={restaurant.id}
                    disabled={!enabled}
                    onPress={() => navigation.navigate('DeliveryLocal', { restaurantId: restaurant.id })}
                    style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${restaurant.name}, ${restaurant.minutes} minutos`}
                  >
                    <StoreLogo logo={restaurant.logo} size={40} radius={12} fontSize={13} />
                    <View style={styles.rowText}>
                      <Text style={[styles.rowTitle, { color: colors.ink }]}>{restaurant.name}</Text>
                      <View style={styles.meta}>
                        <Ionicons name="star" size={12} color={colors.star} />
                        <Text style={[styles.rowSmall, { color: colors.muted }]}>
                          {restaurant.rating.toFixed(1)} · {restaurant.minutes} min · {restaurant.distanceKm.toFixed(1)} km
                        </Text>
                      </View>
                    </View>
                    {enabled ? <Ionicons name="chevron-forward" size={16} color={colors.faint} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {results.products.length > 0 ? (
          <>
            <Text style={[styles.section, { color: colors.ink }]}>Platos</Text>
            <View style={[styles.card, { backgroundColor: colors.card }, DeliveryShadow.card]}>
              {results.products.map((product, index) => (
                <Pressable
                  key={product.id}
                  onPress={() => navigation.navigate('DeliveryProducto', { productId: product.id })}
                  style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${product.name}, ${formatSoles(product.price)}`}
                >
                  <View style={[styles.thumb, { backgroundColor: product.tint }]}>
                    <Image source={product.image} style={styles.thumbImage} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, { color: colors.ink }]}>{product.name}</Text>
                    <Text style={[styles.rowSmall, { color: colors.muted }]}>
                      {RESTAURANTS[product.restaurantId].name.split(' – ')[0]} · {formatSoles(product.price)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.faint} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
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
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: 13.5,
    marginTop: 8,
  },
  section: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    marginTop: 6,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 14.5,
  },
  rowSmall: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: 30,
    height: 30,
  },
});
