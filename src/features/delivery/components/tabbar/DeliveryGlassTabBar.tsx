import React from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { DeliveryTabParamList } from "@navigation/types";
import { FontFamily } from "@theme/fonts";
import { useDeliveryColors } from "../../theme";
import { useDeliverySearchStore } from "../../store/useDeliverySearchStore";
import { useOrderPill } from "../../hooks/useOrderPill";
import { Glass } from "./Glass";
import { OrderAccessory } from "./OrderAccessory";
import {
  ACCESSORY_GAP,
  ACCESSORY_HEIGHT,
  BAR_HEIGHT,
  BAR_MARGIN,
  BAR_SPRING,
  useTabBarScrollState,
} from "./TabBarScroll";

type IoniconName = keyof typeof Ionicons.glyphMap;
type TabName = keyof DeliveryTabParamList;

const TAB_ICONS: Partial<
  Record<TabName, { outline: IoniconName; filled: IoniconName }>
> = {
  DeliveryInicio: { outline: "home-outline", filled: "home" },
  DeliveryFavoritos: { outline: "heart-outline", filled: "heart" },
  DeliveryCarrito: { outline: "bag-outline", filled: "bag" },
};

const SEARCH_ROUTE: TabName = "DeliveryBuscar";
const PADDING = 4;
const GAP = 8;
const ICON = 22;
/** Al levantarse, la selección crece 16 % (UIKit). */
const LENS_GROWTH = 0.16;
/** Cuánto se agranda una pestaña justo debajo del lente. */
const LENS_MAGNIFY = 0.14;
const LENS_SPRING = { damping: 16, stiffness: 260, mass: 0.8 };

/**
 * Barra de pestañas de vidrio al estilo de iOS 26 (como Liquidum): cápsula flotante con las pestañas,
 * pestaña de búsqueda en su propio círculo, el pedido en curso como accessory y minimizado al bajar.
 */
export function DeliveryGlassTabBar({
  state,
  descriptors,
  navigation,
  onOpenOrder,
}: BottomTabBarProps & { onOpenOrder: () => void }) {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const { minimized } = useTabBarScrollState();
  const keyboard = useAnimatedKeyboard();
  const query = useDeliverySearchStore((s) => s.query);
  const setQuery = useDeliverySearchStore((s) => s.setQuery);
  const pill = useOrderPill();
  const inputRef = React.useRef<TextInput>(null);
  const [typing, setTyping] = React.useState(false);

  const focusedRoute = state.routes[state.index];
  const hidden = Boolean(descriptors[focusedRoute.key].options.tabBarStyle);
  const searching = focusedRoute.name === SEARCH_ROUTE;
  const tabRoutes = state.routes.filter((route) => route.name !== SEARCH_ROUTE);

  // La pestaña a la que vuelve el círculo mientras se busca.
  const lastTab = React.useRef(tabRoutes[0]?.name ?? "DeliveryInicio");
  if (!searching) lastTab.current = focusedRoute.name;
  const selectedTabIndex = Math.max(
    0,
    tabRoutes.findIndex((route) => route.name === lastTab.current),
  );

  const spring = (value: number) =>
    reduceMotion
      ? withTiming(value, { duration: 160 })
      : withSpring(value, BAR_SPRING);
  const search = useSharedValue(searching ? 1 : 0);
  React.useEffect(() => {
    search.value = spring(searching ? 1 : 0);
    if (searching) minimized.value = spring(0);
    if (!searching) {
      Keyboard.dismiss();
      setTyping(false);
    }
    // spring no cambia entre renders de forma que importe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching]);

  const indicator = useSharedValue(selectedTabIndex);
  React.useEffect(() => {
    indicator.value = spring(selectedTabIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTabIndex]);

  const rowWidth = windowWidth - BAR_MARGIN * 2;
  const capsuleWidth = rowWidth - BAR_HEIGHT - GAP;
  const itemWidth = (capsuleWidth - PADDING * 2) / tabRoutes.length;
  const barBottom = Math.max(BAR_MARGIN, insets.bottom);

  // Lente: al presionar, la selección se levanta (vidrio transparente, 16 % más grande) y sigue al dedo.
  const lift = useSharedValue(0);
  const lensX = useSharedValue(0);
  const minLensX = PADDING + itemWidth / 2;
  const maxLensX = capsuleWidth - PADDING - itemWidth / 2;
  /** Centro de la selección: el del lente mientras se arrastra; si no, el de la pestaña elegida. */
  const selectionX = useDerivedValue(() =>
    interpolate(
      lift.value,
      [0, 1],
      [PADDING + itemWidth / 2 + indicator.value * itemWidth, lensX.value],
    ),
  );

  // 0 abierta; 1 encogida a un círculo (por scroll o por la búsqueda).
  const collapse = useDerivedValue(() =>
    Math.max(minimized.value, search.value),
  );

  const rowStyle = useAnimatedStyle(() => ({
    // Con el teclado abierto, la barra sube encima de él.
    bottom: Math.max(barBottom, keyboard.height.value + GAP),
  }));
  const capsuleStyle = useAnimatedStyle(() => ({
    width: interpolate(collapse.value, [0, 1], [capsuleWidth, BAR_HEIGHT]),
  }));
  const tabsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapse.value, [0, 0.5], [1, 0], "clamp"),
    transform: [{ scale: interpolate(collapse.value, [0, 1], [1, 0.85]) }],
  }));
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: selectionX.value - itemWidth / 2 },
      { scale: 1 + LENS_GROWTH * lift.value },
    ],
  }));
  const restPillStyle = useAnimatedStyle(() => ({ opacity: 1 - lift.value }));
  const lensStyle = useAnimatedStyle(() => ({ opacity: lift.value }));
  // La barra se hincha un poco bajo el dedo, como en iOS.
  const swellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.015 * lift.value }],
  }));
  const collapsedIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapse.value, [0.5, 1], [0, 1], "clamp"),
  }));
  const searchStyle = useAnimatedStyle(() => ({
    width: interpolate(search.value, [0, 1], [BAR_HEIGHT, capsuleWidth]),
  }));
  const searchIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(search.value, [0, 0.4], [1, 0], "clamp"),
  }));
  const fieldStyle = useAnimatedStyle(() => ({
    opacity: interpolate(search.value, [0.6, 1], [0, 1], "clamp"),
  }));

  // Accessory: arriba de la barra y tan ancho como ella; al minimizar, al lado del círculo.
  const accessoryStyle = useAnimatedStyle(() => {
    const bottomOpen =
      Math.max(barBottom, keyboard.height.value + GAP) +
      BAR_HEIGHT +
      ACCESSORY_GAP;
    const bottomMin = barBottom + (BAR_HEIGHT - ACCESSORY_HEIGHT) / 2;
    const side = BAR_MARGIN + BAR_HEIGHT + GAP;
    return {
      bottom: interpolate(minimized.value, [0, 1], [bottomOpen, bottomMin]),
      left: interpolate(minimized.value, [0, 1], [BAR_MARGIN, side]),
      right: interpolate(minimized.value, [0, 1], [BAR_MARGIN, side]),
      opacity: 1 - search.value,
    };
  });

  const selectIndex = (index: number) => {
    const route = tabRoutes[index];
    if (!route) return;
    if (route.name !== focusedRoute.name) void Haptics.selectionAsync();
    goTo(route.name, route.key);
  };

  const lensGesture = Gesture.Pan()
    .minDistance(0)
    .shouldCancelWhenOutside(false)
    .enabled(!searching)
    .onBegin((event) => {
      lensX.value = Math.min(maxLensX, Math.max(minLensX, event.x));
      if (!reduceMotion) lift.value = withSpring(1, LENS_SPRING);
    })
    .onUpdate((event) => {
      lensX.value = Math.min(maxLensX, Math.max(minLensX, event.x));
      if (reduceMotion) indicator.value = (lensX.value - minLensX) / itemWidth;
    })
    .onFinalize(() => {
      const index = Math.round((lensX.value - minLensX) / itemWidth);
      // La selección sale desde donde quedó el lente y se asienta en la pestaña.
      indicator.value = (lensX.value - minLensX) / itemWidth;
      indicator.value = withSpring(index, BAR_SPRING);
      lift.value = withSpring(0, LENS_SPRING);
      runOnJS(selectIndex)(index);
    });

  if (hidden) return null;

  const goTo = (name: string, key: string) => {
    const event = navigation.emit({
      type: "tabPress",
      target: key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) navigation.navigate(name);
  };

  const onCollapsedPress = () => {
    void Haptics.selectionAsync();
    if (searching) {
      goTo(lastTab.current, tabRoutes[selectedTabIndex].key);
    } else {
      minimized.value = spring(0);
    }
  };

  const collapsedIcons = TAB_ICONS[lastTab.current as TabName];
  const searchRoute = state.routes.find((route) => route.name === SEARCH_ROUTE);
  const showClose = typing || query.length > 0;

  return (
    <>
      {pill ? (
        <Reanimated.View
          style={[styles.accessory, accessoryStyle]}
          pointerEvents={searching ? "none" : "auto"}
        >
          <Glass style={styles.accessoryGlass} radius={ACCESSORY_HEIGHT / 2}>
            <OrderAccessory
              pill={pill}
              onPress={pill.live ? onOpenOrder : undefined}
            />
          </Glass>
        </Reanimated.View>
      ) : null}

      <Reanimated.View
        style={[styles.row, { left: BAR_MARGIN, right: BAR_MARGIN }, rowStyle]}
      >
        <Reanimated.View style={[styles.capsule, capsuleStyle, swellStyle]}>
          <Glass style={StyleSheet.absoluteFill} radius={BAR_HEIGHT / 2} />
          <GestureDetector gesture={lensGesture}>
            <Reanimated.View
              style={[styles.tabs, tabsStyle]}
              pointerEvents={searching ? "none" : "auto"}
            >
              <Reanimated.View
                style={[styles.indicator, { width: itemWidth }, indicatorStyle]}
                pointerEvents="none"
              >
                <Reanimated.View
                  style={[
                    StyleSheet.absoluteFill,
                    styles.pill,
                    { backgroundColor: colors.glassSelection },
                    restPillStyle,
                  ]}
                />
                <Reanimated.View style={[StyleSheet.absoluteFill, lensStyle]}>
                  <Glass
                    style={StyleSheet.absoluteFill}
                    radius={(BAR_HEIGHT - PADDING * 2) / 2}
                    variant="clear"
                  />
                </Reanimated.View>
              </Reanimated.View>
              {tabRoutes.map((route, index) => {
                const focused = route.name === focusedRoute.name;
                const { options } = descriptors[route.key];
                const label = options.title ?? route.name;
                const icons = TAB_ICONS[route.name as TabName] ?? {
                  outline: "ellipse-outline",
                  filled: "ellipse",
                };
                const badge = options.tabBarBadge;
                return (
                  <TabItem
                    key={route.key}
                    center={PADDING + itemWidth / 2 + index * itemWidth}
                    width={itemWidth}
                    lensX={lensX}
                    lift={lift}
                    onAccessibilityTap={() => selectIndex(index)}
                    accessibilityLabel={
                      badge ? `${label}, ${badge} productos` : label
                    }
                    focused={focused}
                  >
                    <TabIcon icons={icons} focused={focused} badge={badge} />
                    <Text
                      style={[
                        styles.label,
                        { color: focused ? colors.ink : colors.muted },
                        focused && styles.labelOn,
                      ]}
                    >
                      {label}
                    </Text>
                  </TabItem>
                );
              })}
            </Reanimated.View>
          </GestureDetector>

          {/* Minimizada o buscando: un círculo con el ícono de la pestaña; al tocarlo, abre o vuelve. */}
          <Reanimated.View
            style={[styles.collapsed, collapsedIconStyle]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={onCollapsedPress}
              style={styles.collapsedButton}
              accessibilityRole="button"
              accessibilityLabel={
                searching ? "Volver a las pestañas" : "Mostrar las pestañas"
              }
            >
              {collapsedIcons ? (
                <TabIcon icons={collapsedIcons} focused />
              ) : null}
            </Pressable>
          </Reanimated.View>
        </Reanimated.View>

        <Reanimated.View style={[styles.search, searchStyle]}>
          <Glass style={StyleSheet.absoluteFill} radius={BAR_HEIGHT / 2} />
          <Reanimated.View
            style={[StyleSheet.absoluteFill, styles.center, searchIconStyle]}
            pointerEvents={searching ? "none" : "auto"}
          >
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                if (searchRoute) goTo(searchRoute.name, searchRoute.key);
              }}
              style={[StyleSheet.absoluteFill, styles.center]}
              accessibilityRole="tab"
              accessibilityState={{ selected: searching }}
              accessibilityLabel="Buscar locales o platos"
            >
              <Ionicons name="search" size={ICON} color={colors.ink} />
            </Pressable>
          </Reanimated.View>
          <Reanimated.View
            style={[StyleSheet.absoluteFill, styles.field, fieldStyle]}
            pointerEvents={searching ? "auto" : "none"}
          >
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
              placeholder="Busca locales o platos"
              placeholderTextColor={colors.faint}
              returnKeyType="search"
              style={[styles.input, { color: colors.ink }]}
              accessibilityLabel="Busca locales o platos"
            />
            {showClose ? (
              <Pressable
                onPress={() => {
                  setQuery("");
                  inputRef.current?.blur();
                  Keyboard.dismiss();
                }}
                hitSlop={8}
                style={[
                  styles.close,
                  { backgroundColor: colors.glassSelection },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Borrar la búsqueda"
              >
                <Ionicons name="close" size={16} color={colors.ink} />
              </Pressable>
            ) : null}
          </Reanimated.View>
        </Reanimated.View>
      </Reanimated.View>
    </>
  );
}

interface TabItemProps {
  center: number;
  width: number;
  lensX: SharedValue<number>;
  lift: SharedValue<number>;
  focused: boolean;
  accessibilityLabel: string;
  onAccessibilityTap: () => void;
  children: React.ReactNode;
}

/** Pestaña: se agranda cuando el lente pasa por encima, como si se viera a través del vidrio. */
function TabItem({
  center,
  width,
  lensX,
  lift,
  focused,
  accessibilityLabel,
  onAccessibilityTap,
  children,
}: TabItemProps) {
  const style = useAnimatedStyle(() => {
    const closeness = Math.max(0, 1 - Math.abs(center - lensX.value) / width);
    return {
      transform: [{ scale: 1 + LENS_MAGNIFY * lift.value * closeness }],
    };
  });

  return (
    <Reanimated.View
      style={[styles.tab, { width }, style]}
      accessible
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
      onAccessibilityTap={onAccessibilityTap}
    >
      {children}
    </Reanimated.View>
  );
}

interface TabIconProps {
  icons: { outline: IoniconName; filled: IoniconName };
  focused: boolean;
  badge?: string | number;
}

/** Ícono de la pestaña: la activa lleva relleno lima con el contorno tinta encima (mockup). */
function TabIcon({ icons, focused, badge }: TabIconProps) {
  const colors = useDeliveryColors();
  return (
    <View style={styles.iconWrap}>
      {focused ? (
        <>
          <Ionicons
            name={icons.filled}
            size={ICON}
            color={colors.lime}
            style={styles.iconUnder}
          />
          <Ionicons name={icons.outline} size={ICON} color={colors.ink} />
        </>
      ) : (
        <Ionicons name={icons.outline} size={ICON} color={colors.muted} />
      )}
      {badge ? (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.ink, borderColor: colors.card },
          ]}
        >
          <Text style={[styles.badgeText, { color: colors.lime }]}>
            {badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    height: BAR_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  capsule: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: "hidden",
  },
  tabs: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PADDING,
  },
  indicator: {
    position: "absolute",
    top: PADDING,
    bottom: PADDING,
    left: 0,
  },
  pill: {
    borderRadius: (BAR_HEIGHT - PADDING * 2) / 2,
  },
  tab: {
    height: BAR_HEIGHT - PADDING * 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    lineHeight: 13,
  },
  labelOn: {
    fontFamily: FontFamily.semibold,
  },
  iconWrap: {
    width: ICON,
    height: ICON,
    alignItems: "center",
    justifyContent: "center",
  },
  iconUnder: {
    position: "absolute",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -7,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    lineHeight: 13,
  },
  collapsed: {
    position: "absolute",
    left: 0,
    top: 0,
    width: BAR_HEIGHT,
    height: BAR_HEIGHT,
  },
  collapsedButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: "hidden",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 18,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontFamily: FontFamily.regular,
    fontSize: 15,
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  accessory: {
    position: "absolute",
    height: ACCESSORY_HEIGHT,
  },
  accessoryGlass: {
    flex: 1,
    borderRadius: ACCESSORY_HEIGHT / 2,
    overflow: "hidden",
  },
});
