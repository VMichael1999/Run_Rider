import React from 'react';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { DeliveryStackParamList } from '@navigation/types';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { useOrderPill } from '../hooks/useOrderPill';
import { useTabBarScrollY, useTabBarSpace } from '../components/tabbar/TabBarScroll';
import { DeliveryDrawer } from '../components/DeliveryDrawer';
import { HomeHeader } from '../components/inicio/HomeHeader';
import { CategoryStrip, DealStrip, HeroBanner, SectionHeader } from '../components/inicio/HomeBlocks';
import { RestaurantCard } from '../components/RestaurantCard';
import { CATEGORIES, DEALS, HOME_SECTIONS, RESTAURANTS, RESTAURANT_DETAILS } from '../data/mock';

/** Alto de la cabecera abierta sin la barra de estado: 10 + fila de dirección 40 + 12 + buscador 46 + 14. */
const HEADER_BODY = 122;

/** Inicio de delivery (del-03 / del-04). */
export function DeliveryInicioScreen() {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState(CATEGORIES[0].id);
  const scrollY = useSharedValue(0);
  // La cabecera es oscura (.sb.w).
  useStatusBarStyle('light');

  // El pedido en curso va en el accessory de la barra; el scroll también la minimiza.
  const hasAccessory = useOrderPill() !== null;
  const bottomSpace = useTabBarSpace(hasAccessory);
  const tabBarScrollY = useTabBarScrollY();

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
    tabBarScrollY.value = event.contentOffset.y;
  });

  const navigation = useNavigation<NavigationProp<DeliveryStackParamList>>();
  const noop = React.useCallback(() => undefined, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Reanimated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + HEADER_BODY + 4, paddingBottom: bottomSpace },
        ]}
      >
        <HeroBanner />
        <SectionHeader title="Categorías" onSeeAll={noop} />
        <CategoryStrip categories={CATEGORIES} selectedId={categoryId} onSelect={setCategoryId} />
        <SectionHeader title="Ofertas para ti" onSeeAll={noop} />
        <DealStrip deals={DEALS} />
        {HOME_SECTIONS.map((section) => (
          <React.Fragment key={section.id}>
            <SectionHeader title={section.title} onSeeAll={noop} />
            <View style={styles.grid}>
              {section.restaurantIds.map((id) => (
                <RestaurantCard
                  key={id}
                  restaurant={RESTAURANTS[id]}
                  // Solo Burger Ruta tiene su página en el mockup.
                  onPress={RESTAURANT_DETAILS[id] ? () => navigation.navigate('DeliveryLocal', { restaurantId: id }) : undefined}
                />
              ))}
            </View>
          </React.Fragment>
        ))}
      </Reanimated.ScrollView>

      <HomeHeader
        topInset={insets.top}
        scrollY={scrollY}
        onAvatarPress={() => setDrawerOpen(true)}
        onAddressPress={() => navigation.navigate('DeliveryDirecciones')}
        onBellPress={() => navigation.navigate('DeliveryNotificaciones')}
      />
      <DeliveryDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  // .pad: padding 4 14 14, gap 12
  content: {
    paddingHorizontal: 14,
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
});
