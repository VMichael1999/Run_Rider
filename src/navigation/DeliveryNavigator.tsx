import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useStatusBarStyle } from "@features/delivery/hooks/useStatusBarStyle";
import type { DeliveryStackParamList, DeliveryTabParamList } from "./types";
import { cartCount, useCartStore } from "@store/useCartStore";
import { DeliveryCargaScreen } from "@features/delivery/screens/DeliveryCargaScreen";
import { DeliveryInicioScreen } from "@features/delivery/screens/DeliveryInicioScreen";
import { DeliveryCarritoScreen } from "@features/delivery/screens/DeliveryCarritoScreen";
import { DeliveryProximamenteScreen } from "@features/delivery/screens/DeliveryProximamenteScreen";
import { DeliveryLocalScreen } from "@features/delivery/screens/DeliveryLocalScreen";
import { DeliveryProductoScreen } from "@features/delivery/screens/DeliveryProductoScreen";
import { DeliveryCheckoutScreen } from "@features/delivery/screens/DeliveryCheckoutScreen";
import { DeliveryDireccionScreen } from "@features/delivery/screens/DeliveryDireccionScreen";
import { DeliverySeguimientoScreen } from "@features/delivery/screens/DeliverySeguimientoScreen";
import { DeliveryMenuPlaceholderScreen } from "@features/delivery/screens/DeliveryMenuPlaceholderScreen";
import { PerfilScreen } from "@features/cliente/perfil";
import { MetodosPagoScreen } from "@features/cliente/metodos-pago";
import { ConfiguracionScreen } from "@features/configuracion/ConfiguracionScreen";
import { DeliveryGlassTabBar } from "@features/delivery/components/tabbar/DeliveryGlassTabBar";
import { TabBarScrollProvider } from "@features/delivery/components/tabbar/TabBarScroll";
import { DeliveryBuscarScreen } from "@features/delivery/screens/DeliveryBuscarScreen";
import { useNavigation, type NavigationProp } from "@react-navigation/native";

const Stack = createNativeStackNavigator<DeliveryStackParamList>();

/** Las pantallas de la cuenta no fijan la barra de estado; en delivery va oscura. */
function withDarkStatusBar<P extends object>(Screen: React.ComponentType<P>) {
  return function DarkStatusBarScreen(props: P) {
    useStatusBarStyle("dark");
    return <Screen {...props} />;
  };
}

const DeliveryPerfil = withDarkStatusBar(PerfilScreen);
const DeliveryMetodosPago = withDarkStatusBar(
  MetodosPagoScreen as React.ComponentType,
);
const DeliveryConfiguracion = withDarkStatusBar(ConfiguracionScreen);
const Tab = createBottomTabNavigator<DeliveryTabParamList>();

function DeliveryTabs() {
  const count = useCartStore((s) => cartCount(s.items));
  const stack = useNavigation<NavigationProp<DeliveryStackParamList>>();

  return (
    <TabBarScrollProvider>
      <Tab.Navigator
        backBehavior="history"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <DeliveryGlassTabBar
            {...props}
            onOpenOrder={() => stack.navigate("DeliverySeguimiento")}
          />
        )}
      >
        <Tab.Screen
          name="DeliveryInicio"
          component={DeliveryInicioScreen}
          options={{ title: "Inicio" }}
        />
        <Tab.Screen
          name="DeliveryFavoritos"
          component={DeliveryProximamenteScreen}
          options={{ title: "Favoritos" }}
        />
        <Tab.Screen
          name="DeliveryCarrito"
          component={DeliveryCarritoScreen}
          options={{
            title: "Carrito",
            tabBarBadge: count > 0 ? count : undefined,
            tabBarStyle: { display: "none" },
          }}
        />
        <Tab.Screen
          name="DeliveryBuscar"
          component={DeliveryBuscarScreen}
          options={{ title: "Buscar" }}
        />
      </Tab.Navigator>
    </TabBarScrollProvider>
  );
}

export function DeliveryNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="DeliveryCarga"
        component={DeliveryCargaScreen}
        options={{ animation: "fade" }}
      />
      <Stack.Screen
        name="DeliveryTabs"
        component={DeliveryTabs}
        options={{ animation: "fade" }}
      />
      <Stack.Screen name="DeliveryLocal" component={DeliveryLocalScreen} />
      <Stack.Screen
        name="DeliveryProducto"
        component={DeliveryProductoScreen}
      />
      <Stack.Screen
        name="DeliveryCheckout"
        component={DeliveryCheckoutScreen}
      />
      <Stack.Screen
        name="DeliveryDireccion"
        component={DeliveryDireccionScreen}
      />
      <Stack.Screen
        name="DeliverySeguimiento"
        component={DeliverySeguimientoScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="DeliveryPedidos"
        component={DeliveryMenuPlaceholderScreen}
      />
      <Stack.Screen
        name="DeliveryCupones"
        component={DeliveryMenuPlaceholderScreen}
      />
      <Stack.Screen
        name="DeliveryDirecciones"
        component={DeliveryMenuPlaceholderScreen}
      />
      <Stack.Screen
        name="DeliveryFacturacion"
        component={DeliveryMenuPlaceholderScreen}
      />
      <Stack.Screen
        name="DeliveryNotificaciones"
        component={DeliveryMenuPlaceholderScreen}
      />
      {/* Pantallas de la cuenta que se comparten con viajes. */}
      <Stack.Screen name="Perfil" component={DeliveryPerfil} />
      <Stack.Screen name="MetodosPago" component={DeliveryMetodosPago} />
      <Stack.Screen name="Configuracion" component={DeliveryConfiguracion} />
    </Stack.Navigator>
  );
}
