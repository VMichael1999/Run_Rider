import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type LatLng } from 'react-native-maps';
import { FontFamily } from '@theme/fonts';
import { getRoutePolyline } from '@shared/services/googleMapsService';
import { useCarRouteAnimation } from '@features/cliente/trayecto-taxi/hooks/useCarRouteAnimation';
import { useDeliveryMapStyle } from '../../hooks/useDeliveryMapStyle';
import { useDeliveryColors } from '../../theme';
import type { Restaurant } from '../../data/mock';

interface TrackingMapProps {
  store: Restaurant;
  storeCoordinate: LatLng;
  destination: LatLng;
  /** Con él, el auto recorre la ruta en ese tiempo (fase "en camino"). */
  carDurationMs: number;
  carActive: boolean;
  /** Margen inferior que tapa la hoja, para encuadrar la ruta en lo que se ve. */
  bottomPadding: number;
  topPadding: number;
  onRouteReady?: (route: LatLng[]) => void;
}

export interface TrackingMapHandle {
  center: () => void;
}

/** Mapa del seguimiento (.tmap): ruta negra con borde blanco, local, destino y el auto. */
export const TrackingMap = React.forwardRef<TrackingMapHandle, TrackingMapProps>(function TrackingMap(
  { store, storeCoordinate, destination, carDurationMs, carActive, bottomPadding, topPadding, onRouteReady },
  ref,
) {
  const colors = useDeliveryColors();
  const mapStyle = useDeliveryMapStyle();
  const mapRef = React.useRef<MapView>(null);
  const [route, setRoute] = React.useState<LatLng[]>([storeCoordinate, destination]);

  React.useEffect(() => {
    let active = true;
    getRoutePolyline(storeCoordinate, destination)
      .then((points) => {
        if (active && points.length > 1) setRoute(points);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [destination, storeCoordinate]);

  React.useEffect(() => {
    onRouteReady?.(route);
  }, [onRouteReady, route]);

  const fit = React.useCallback(() => {
    mapRef.current?.fitToCoordinates(route, {
      edgePadding: { top: topPadding + 30, right: 50, bottom: bottomPadding + 30, left: 50 },
      animated: true,
    });
  }, [bottomPadding, route, topPadding]);

  React.useImperativeHandle(ref, () => ({ center: fit }), [fit]);

  // Se encuadra de nuevo cuando llega la ruta real de Google.
  const mapReady = React.useRef(false);
  React.useEffect(() => {
    if (mapReady.current) fit();
  }, [fit]);

  // El auto (reuso de la animación de viajes): se mueve solo mientras el pedido va en camino.
  const car = useCarRouteAnimation({ route, isActive: carActive, durationMs: carDurationMs, loop: false });

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
        {...mapStyle}
      style={StyleSheet.absoluteFill}
      initialRegion={{
        latitude: (storeCoordinate.latitude + destination.latitude) / 2,
        longitude: (storeCoordinate.longitude + destination.longitude) / 2,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
      onMapReady={() => {
        mapReady.current = true;
        fit();
      }}
      showsUserLocation={false}
      toolbarEnabled={false}
    >
      {/* Ruta negra con borde blanco; strokeColors hace falta en iOS con Google Maps. */}
      <Polyline coordinates={route} strokeWidth={10} strokeColor={colors.card} strokeColors={[colors.card]} lineCap="round" lineJoin="round" />
      <Polyline coordinates={route} strokeWidth={5} strokeColor={colors.ink} strokeColors={[colors.ink]} lineCap="round" lineJoin="round" />

      <Marker coordinate={storeCoordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
        <View style={[styles.store, { backgroundColor: colors.card, borderColor: colors.ink }]}>
          <Text style={[styles.storeText, { color: colors.ink }]}>{store.logo.initials}</Text>
        </View>
      </Marker>
      <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
        <Ionicons name="location" size={38} color={colors.red} />
      </Marker>

      {carActive && car.currentPosition ? (
        <Marker coordinate={car.currentPosition} anchor={{ x: 0.5, y: 0.5 }} zIndex={10} tracksViewChanges={false}>
          <View style={[styles.car, { backgroundColor: colors.lime, borderColor: colors.onLime }]}>
            <Ionicons name="car-outline" size={18} color={colors.onLime} />
          </View>
        </Marker>
      ) : null}
    </MapView>
  );
});

const styles = StyleSheet.create({
  store: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  car: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
