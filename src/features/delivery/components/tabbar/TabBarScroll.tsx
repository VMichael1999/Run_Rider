import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAnimatedReaction, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';

/** Medidas de la barra de iOS 26 (las mismas que usa Liquidum, medidas contra UIKit). */
export const BAR_HEIGHT = 62;
export const BAR_MARGIN = 21;
export const ACCESSORY_HEIGHT = 48;
export const ACCESSORY_GAP = 8;
/** Cuánto hay que bajar seguido para minimizar, y cuánto subir para volver a abrir. */
const MINIMIZE_AFTER = 24;
const EXPAND_AFTER = 12;

export const BAR_SPRING = { damping: 20, stiffness: 220, mass: 0.9 };

interface TabBarScrollValue {
  /** 0 abierta, 1 minimizada. */
  minimized: SharedValue<number>;
  /** Posición de scroll de la pantalla con pestaña que está a la vista. */
  contentY: SharedValue<number>;
}

const TabBarScrollContext = React.createContext<TabBarScrollValue | null>(null);

export function TabBarScrollProvider({ children }: { children: React.ReactNode }) {
  const minimized = useSharedValue(0);
  const contentY = useSharedValue(0);
  const travel = useSharedValue(0);

  // Como `tabBarMinimizeBehavior = .onScrollDown`: bajar minimiza; subir o llegar arriba la abre.
  useAnimatedReaction(
    () => contentY.value,
    (y, previous) => {
      if (previous === null) return;
      const delta = y - previous;
      // Cambia de sentido: el recorrido empieza de nuevo.
      travel.value = Math.sign(delta) === Math.sign(travel.value) ? travel.value + delta : delta;
      if (y <= 0) {
        if (minimized.value > 0.5) minimized.value = withSpring(0, BAR_SPRING);
      } else if (travel.value > MINIMIZE_AFTER && minimized.value < 0.5) {
        minimized.value = withSpring(1, BAR_SPRING);
      } else if (travel.value < -EXPAND_AFTER && minimized.value > 0.5) {
        minimized.value = withSpring(0, BAR_SPRING);
      }
    },
  );

  const value = React.useMemo(() => ({ minimized, contentY }), [contentY, minimized]);
  return <TabBarScrollContext.Provider value={value}>{children}</TabBarScrollContext.Provider>;
}

export function useTabBarScrollState() {
  const value = React.useContext(TabBarScrollContext);
  if (!value) throw new Error('useTabBarScrollState fuera de TabBarScrollProvider');
  return value;
}

/** Para las pantallas con pestaña: escribir aquí su scroll (`contentY.value = y`) desde el manejador. */
export function useTabBarScrollY() {
  return useTabBarScrollState().contentY;
}

/** Espacio que deja la barra (y el accessory) abajo, para que el último elemento no quede tapado. */
export function useTabBarSpace(withAccessory: boolean) {
  const insets = useSafeAreaInsets();
  const barBottom = Math.max(BAR_MARGIN, insets.bottom);
  return barBottom + BAR_HEIGHT + (withAccessory ? ACCESSORY_GAP + ACCESSORY_HEIGHT : 0) + 12;
}
