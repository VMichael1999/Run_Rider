import React from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ClienteStackParamList } from '@navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { useClienteHome } from './hooks/useClienteHome';
import { SwipeableFavoriteItem } from './components/SwipeableFavoriteItem';
import { AppDrawer } from '@shared/components/drawer/AppDrawer';
import { AppIcon, type AppIconName } from '@shared/components/ui/AppIcon';
import { useAuthStore } from '@store/useAuthStore';
import { useDescuentoVigente } from '@features/cliente/promociones/hooks/useDescuentoVigente';
import { useThemeStore } from '@store/useThemeStore';
import { useRideDraftStore, type RequestEntryMode } from '@store/useRideDraftStore';
import { useTaxiStore } from '@store/useTaxiStore';
import { useScheduledTripRunner } from '@features/cliente/programar-viaje/hooks/useScheduledTripRunner';
import { buildTaxiRequest } from '@features/cliente/solicitud-taxi/utils/routeRequest';
import { useFavoriteAddressesStore } from '@store/useFavoriteAddressesStore';
import { getCurrentLocationMarker, getQuickCurrentLocationMarker } from '@shared/utils/locationUtils';
import { useAppTheme } from '@theme/useAppTheme';
import { useAppModeStore } from '@store/useAppModeStore';
import { getMapStyle } from '@theme/mapStyles';
import { FontFamily, FontSize } from '@theme/fonts';
import { Spacing, BorderRadius, Shadow } from '@theme/spacing';

type Nav = NativeStackNavigationProp<ClienteStackParamList, 'ClienteHome'>;

const LIMA_REGION: Region = {
  latitude: -12.0464,
  longitude: -77.0428,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

interface HomeServiceAction {
  id: 'ride' | 'rental' | 'outstation';
  label: string;
  subtitle: string;
  image: ReturnType<typeof require>;
}

const homeServiceActions: HomeServiceAction[] = [
  {
    id: 'ride',
    label: 'Viaje',
    subtitle: 'Precio fijo',
    image: require('../../../../assets/servicios/recorte/confort.png'),
  },
  {
    id: 'rental',
    label: 'Subasta',
    subtitle: 'Tú propones',
    image: require('../../../../assets/servicios/recorte/subasta.png'),
  },
  {
    id: 'outstation',
    label: 'Programar',
    subtitle: 'Para más tarde',
    image: require('../../../../assets/servicios/recorte/espera-ahorra.png'),
  },
];

// Sin favoritos guardados se muestran Casa y Trabajo como accesos para guardarlos.
const FAVORITE_PLACEHOLDERS: { label: string; icon: AppIconName }[] = [
  { label: 'Casa', icon: 'home' },
  { label: 'Trabajo', icon: 'brief' },
];

export function ClienteHomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  // Solo anuncia un descuento si hoy se aplicaría al pedir; si no, lleva a ver las promociones.
  const discount = useDescuentoVigente();
  const promoLabel = !discount
    ? 'Promociones'
    : discount.source === 'coupon'
      ? `${discount.label} · ${discount.percent} % menos`
      : `Hoy ${discount.percent} % menos`;
  const isDark = useThemeStore((s) => s.isDark);
  const mapRef = React.useRef<MapView | null>(null);
  const [isCenteringMap, setIsCenteringMap] = React.useState(false);
  const [selectedFavoriteId, setSelectedFavoriteId] = React.useState<string | null>(null);
  const setEntryMode = useRideDraftStore((s) => s.setEntryMode);
  const clearExtraStops = useRideDraftStore((s) => s.clearExtraStops);
  // Cada pedido desde el inicio empieza sin paradas y con el modo de la tarjeta que se tocó.
  const startRequest = (mode: RequestEntryMode) => {
    setEntryMode(mode);
    clearExtraStops();
  };

  // A la hora de un viaje programado se busca conductor con el servicio que se eligió.
  useScheduledTripRunner((trip) => {
    if (!trip.origin || !trip.destination || !trip.service) return;
    const draft = useRideDraftStore.getState();
    const { origin: tripOrigin, destination: tripDestination, service } = trip;
    startRequest('choose');
    draft.setOrigin(tripOrigin);
    draft.setDestination(tripDestination);
    trip.stops?.forEach(draft.addExtraStop);
    const paymentMethod = trip.paymentMode ? { ...draft.paymentMethod, mode: trip.paymentMode } : draft.paymentMethod;
    draft.setPaymentMethod(paymentMethod);
    void buildTaxiRequest({
      origin: tripOrigin,
      destination: tripDestination,
      stops: trip.stops,
      paymentMethod,
      comment: trip.notes,
    }).then((request) => {
      useTaxiStore.getState().setRequest(request);
      navigation.navigate('SolicitudTaxi', { autoSearchServiceId: service.id });
    });
  });

  const {
    origin,
    setSelectedHomeTab,
    requestTaxi,
    isRouting,
    recalculateRoute,
    setOrigin,
    setDestination,
  } = useClienteHome();

  const favorites = useFavoriteAddressesStore((s) => s.favorites);
  const removeFavorite = useFavoriteAddressesStore((s) => s.removeFavorite);
  const logout = useAuthStore((s) => s.logout);
  const phone = useAuthStore((s) => s.phone);
  const countryCode = useAuthStore((s) => s.countryCode);
  const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
  const setAppMode = useAppModeStore((s) => s.setMode);
  const phoneLabel = phone ? `${countryCode} ${phone}` : '+51 999 999 999';

  React.useEffect(() => {
    let active = true;
    void (async () => {
      const currentLocation = await getCurrentLocationMarker();
      if (active && currentLocation) {
        setOrigin(currentLocation);
      }
    })();
    return () => {
      active = false;
    };
  }, [setOrigin]);

  React.useEffect(() => {
    if (!origin) return;
    const nextRegion: Region = {
      latitude: origin.position.latitude,
      longitude: origin.position.longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    };
    mapRef.current?.animateToRegion(nextRegion, 420);
  }, [origin]);

  useFocusEffect(
    React.useCallback(() => {
      void recalculateRoute();
      if (!origin) {
        void (async () => {
          const currentLocation = await getCurrentLocationMarker();
          if (currentLocation) setOrigin(currentLocation);
        })();
      }
    }, [origin, recalculateRoute, setOrigin]),
  );

  const handleSearchPress = () => {
    startRequest('choose');
    navigation.navigate('SearchAddress', { target: 'destination' });
  };

  const handleAddFavorite = () => {
    navigation.navigate('SearchAddress', { target: 'destination', saveFavorite: true });
  };

  const handleServiceCardPress = (action: HomeServiceAction) => {
    setSelectedHomeTab(action.id);
    startRequest(action.id === 'ride' ? 'ride' : action.id === 'rental' ? 'auction' : 'schedule');
    navigation.navigate('SearchAddress', { target: 'destination' });
  };

  const handleCenterMap = async () => {
    if (isCenteringMap) return;
    setIsCenteringMap(true);
    try {
      const current = await getQuickCurrentLocationMarker();
      if (!current) return;
      mapRef.current?.animateToRegion(
        {
          latitude: current.position.latitude,
          longitude: current.position.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        260,
      );
    } finally {
      setIsCenteringMap(false);
    }
  };

  return (
    // El menú corre e inclina en 3D la pantalla que envuelve.
    <AppDrawer
      visible={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      onNavigate={(route) => navigation.navigate(route as never)}
      onLogout={logout}
      phoneLabel={phoneLabel}
      mode="viajes"
      onToggleMode={() => setAppMode('delivery')}
    >
      <View style={[styles.scene, { backgroundColor: theme.background }]}>
        {/* Mapa a pantalla completa con la barra superior flotando encima */}
        <View style={styles.mapArea}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            customMapStyle={getMapStyle(isDark)}
            // La hoja inferior se monta 24 px sobre el mapa; el padding deja visible el logo de Google.
            mapPadding={{ top: insets.top + 56, right: 0, bottom: 24, left: 0 }}
            userInterfaceStyle={isDark ? 'dark' : 'light'}
            initialRegion={LIMA_REGION}
            rotateEnabled={false}
            pitchEnabled={false}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
            toolbarEnabled={false}
          />

          <View style={[styles.topBar, { top: insets.top + 6 }]}>
            <TouchableOpacity
              style={[styles.roundButton, { backgroundColor: theme.surface }, Shadow.raise]}
              activeOpacity={0.8}
              onPress={() => setDrawerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Abrir menú"
            >
              <AppIcon name="menu" color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.promoPill, { backgroundColor: theme.surface }, Shadow.raise]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Promociones')}
              accessibilityRole="button"
              accessibilityLabel={`${promoLabel}. Ver promociones`}
            >
              <AppIcon name="tag" size="s" color={theme.online} />
              <Text style={[styles.promoPillText, { color: theme.text }]}>{promoLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roundButton, { backgroundColor: theme.surface }, Shadow.raise]}
              activeOpacity={0.8}
              onPress={() => void handleCenterMap()}
              disabled={isCenteringMap}
              accessibilityRole="button"
              accessibilityLabel="Centrar mapa"
              accessibilityState={{ busy: isCenteringMap }}
            >
              {isCenteringMap ? (
                <ActivityIndicator size="small" color={theme.text} />
              ) : (
                <AppIcon name="nav" color={theme.text} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hoja inferior que se monta 24 px sobre el mapa */}
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, paddingBottom: 18 + insets.bottom },
            Shadow.sheet,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.line }]} />

          <TouchableOpacity
            style={[styles.where, { backgroundColor: theme.background }]}
            onPress={handleSearchPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="¿A dónde vas? Buscar destino"
          >
            <AppIcon name="search" color={theme.textMuted} />
            <Text style={[styles.whereText, { color: theme.text }]}>¿A dónde vas?</Text>
            <View style={[styles.whenPill, { backgroundColor: theme.surface }]}>
              <AppIcon name="time" size="s" color={theme.text} />
              <Text style={[styles.whenText, { color: theme.text }]}>Ahora</Text>
            </View>
          </TouchableOpacity>

          <View>
            {favorites.length > 0
              ? favorites.slice(0, 2).map((favorite, index) => (
                  <SwipeableFavoriteItem
                    key={favorite.id}
                    id={favorite.id}
                    placeName={favorite.placeName}
                    showDivider={index > 0}
                    loading={selectedFavoriteId === favorite.id}
                    disabled={selectedFavoriteId !== null || isRouting}
                    onPress={async () => {
                      if (selectedFavoriteId) return;
                      setSelectedFavoriteId(favorite.id);
                      startRequest('choose');
                      try {
                        const selectedOrigin = origin ?? (await getQuickCurrentLocationMarker());
                        if (!selectedOrigin) return;
                        setOrigin(selectedOrigin);
                        setDestination(favorite);
                        const didCreate = await requestTaxi(favorite, selectedOrigin);
                        if (didCreate) {
                          navigation.navigate('SolicitudTaxi');
                        }
                      } finally {
                        setSelectedFavoriteId(null);
                      }
                    }}
                    onDelete={removeFavorite}
                  />
                ))
              : FAVORITE_PLACEHOLDERS.map((item, index) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.favRow, index > 0 && { borderTopWidth: 1, borderTopColor: theme.line }]}
                    onPress={handleAddFavorite}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Guardar dirección de ${item.label}`}
                  >
                    <View style={[styles.favIcon, { backgroundColor: theme.background }]}>
                      <AppIcon name={item.icon} color={theme.text} />
                    </View>
                    <View style={styles.favText}>
                      <Text style={[styles.favTitle, { color: theme.text }]}>{item.label}</Text>
                      <Text style={[styles.favSubtitle, { color: theme.textMuted }]}>Agrega tu dirección</Text>
                    </View>
                  </TouchableOpacity>
                ))}
          </View>

          <View style={styles.tiles}>
            {homeServiceActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.tile, { backgroundColor: theme.background }]}
                onPress={() => handleServiceCardPress(action)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`${action.label}: ${action.subtitle}`}
              >
                <Image source={action.image} style={styles.tileImage} resizeMode="contain" />
                <Text style={[styles.tileLabel, { color: theme.text }]}>{action.label}</Text>
                <Text style={[styles.tileSubtitle, { color: theme.textMuted }]}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </AppDrawer>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    overflow: 'hidden',
  },
  mapArea: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 36,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: BorderRadius.full,
  },
  promoPillText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.label,
  },
  sheet: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 4,
  },
  where: {
    height: 54,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  whereText: {
    flex: 1,
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.lead,
  },
  whenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  whenText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.meta,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  favIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favText: {
    flex: 1,
  },
  favTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.body,
  },
  favSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
  tiles: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingTop: 6,
    paddingHorizontal: 6,
    paddingBottom: 8,
    borderRadius: BorderRadius.lg,
  },
  tileImage: {
    width: '100%',
    height: 52,
  },
  tileLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.meta,
  },
  tileSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize['2xs'],
  },
});
