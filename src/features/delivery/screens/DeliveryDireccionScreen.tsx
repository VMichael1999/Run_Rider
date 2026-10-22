import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DeliveryStackParamList } from '@navigation/types';
import { FontFamily } from '@theme/fonts';
import { DeliveryColors } from '@theme/colors';
import { getCurrentLocationMarker, getPlaceNameFromCoordinates } from '@shared/utils/locationUtils';
import { useDeliveryMapStyle } from '../hooks/useDeliveryMapStyle';
import { useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { useCheckoutAddress, useCheckoutStore } from '../store/useCheckoutStore';
import { useAddressesStore } from '../store/useAddressesStore';

type Props = NativeStackScreenProps<DeliveryStackParamList, 'DeliveryDireccion'>;

const DELTA = 0.006;

/** "Av. Arequipa con Av. Canevaro, Lince, Lima" → título y detalle. */
function splitPlace(name: string) {
  const [title, ...rest] = name.split(',');
  return { title: title.trim(), detail: rest.join(',').trim() };
}

/** Cambiar dirección (del-12): mapa completo, pin fijo al centro y hoja con Confirmar ubicación. */
const LABELS: { label: string; icon: 'home-outline' | 'briefcase-outline' | 'location-outline' }[] = [
  { label: 'Casa', icon: 'home-outline' },
  { label: 'Trabajo', icon: 'briefcase-outline' },
  { label: 'Otro', icon: 'location-outline' },
];

export function DeliveryDireccionScreen({ navigation, route }: Props) {
  // 'guardar': agrega la dirección a Direcciones guardadas; si no, cambia la entrega de este pedido.
  const saving = route.params?.purpose === 'guardar';
  const addAddress = useAddressesStore((s) => s.add);
  const [labelIndex, setLabelIndex] = React.useState(2);
  const colors = useDeliveryColors();
  const mapStyle = useDeliveryMapStyle();
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');

  const address = useCheckoutAddress();
  const setAddress = useCheckoutStore((s) => s.setAddress);
  const mapRef = React.useRef<MapView>(null);
  const [center, setCenter] = React.useState(address.coordinate);
  const [place, setPlace] = React.useState({ title: address.label, detail: address.detail });
  const [resolving, setResolving] = React.useState(false);

  const onRegionChangeComplete = async (region: Region) => {
    setCenter({ latitude: region.latitude, longitude: region.longitude });
    setResolving(true);
    try {
      setPlace(splitPlace(await getPlaceNameFromCoordinates(region.latitude, region.longitude)));
    } catch {
      setPlace({ title: 'Ubicación seleccionada', detail: '' });
    } finally {
      setResolving(false);
    }
  };

  const goToMyLocation = async () => {
    const current = await getCurrentLocationMarker();
    if (!current) return;
    mapRef.current?.animateToRegion({ ...current.position, latitudeDelta: DELTA, longitudeDelta: DELTA }, 300);
  };

  const confirm = () => {
    if (saving) {
      const chosen = LABELS[labelIndex];
      addAddress({
        label: chosen.label === 'Otro' ? place.title : chosen.label,
        icon: chosen.icon,
        street: place.title,
        detail: [place.title, place.detail].filter(Boolean).join(', '),
        coordinate: center,
      });
      navigation.goBack();
      return;
    }
    setAddress({ label: place.title, detail: place.detail, coordinate: center });
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        {...mapStyle}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...address.coordinate, latitudeDelta: DELTA, longitudeDelta: DELTA }}
        onRegionChangeComplete={(region) => void onRegionChangeComplete(region)}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
      />

      <View style={[styles.search, { top: insets.top + 2 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.roundButton, { backgroundColor: colors.card }]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <View style={[styles.searchBox, { backgroundColor: colors.card }]} accessibilityRole="search">
          <Ionicons name="search" size={16} color={colors.faint} />
          <Text style={[styles.searchText, { color: colors.faint }]}>Busca una dirección o lugar</Text>
        </View>
      </View>

      {/* Pin fijo al centro (.bigpin): la punta marca el punto elegido. */}
      <View style={styles.pinWrap} pointerEvents="none">
        <Ionicons name="location" size={44} color={colors.red} style={styles.pin} />
      </View>

      <Pressable
        onPress={() => void goToMyLocation()}
        style={[styles.locate, { backgroundColor: colors.card }]}
        accessibilityRole="button"
        accessibilityLabel="Ir a mi ubicación"
      >
        <Ionicons name="locate-outline" size={20} color={colors.limeStrong} />
      </Pressable>

      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        <View style={styles.place}>
          <View style={[styles.placeIcon, { backgroundColor: colors.limeSoft }]}>
            <Ionicons name="location-outline" size={16} color={colors.olive} />
          </View>
          <View style={styles.placeText}>
            <Text style={[styles.placeTitle, { color: colors.ink }]} numberOfLines={1}>
              {place.title}
            </Text>
            {place.detail ? (
              <Text style={[styles.placeDetail, { color: colors.muted }]} numberOfLines={1}>
                {place.detail}
              </Text>
            ) : null}
          </View>
          {resolving ? <ActivityIndicator size="small" color={colors.limeStrong} /> : null}
        </View>
        {saving ? (
          <View style={styles.labels} accessibilityRole="radiogroup">
            {LABELS.map((item, index) => {
              const on = index === labelIndex;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => setLabelIndex(index)}
                  style={[styles.labelChip, { borderColor: on ? colors.limeStrong : colors.line, backgroundColor: on ? colors.limeSoft : colors.card }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <Ionicons name={item.icon} size={15} color={on ? colors.olive : colors.muted} />
                  <Text style={[styles.labelText, { color: on ? colors.olive : colors.ink }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <Pressable
          onPress={confirm}
          disabled={resolving}
          style={[styles.confirm, { backgroundColor: colors.lime }, resolving && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel={`Confirmar ubicación: ${place.title}`}
        >
          <Text style={[styles.confirmText, { color: colors.onLime }]}>{saving ? 'Guardar dirección' : 'Confirmar ubicación'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  // .asearch: top 46, columnas 40 · 1fr, gap 8
  search: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBox: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    // 0 2px 8px rgba(17,21,25,.12)
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  searchText: {
    fontFamily: FontFamily.regular,
    fontSize: 13.5,
  },
  // El centro del mapa queda bajo la punta del pin.
  pinWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    marginTop: -44,
  },
  locate: {
    position: 'absolute',
    right: 14,
    bottom: 190,
    zIndex: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    // 0 2px 8px rgba(17,21,25,.15)
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 26,
    gap: 12,
  },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeText: {
    flex: 1,
  },
  placeTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
  },
  placeDetail: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
  },
  labels: {
    flexDirection: 'row',
    gap: 8,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  labelText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
  confirm: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontFamily: FontFamily.semibold,
    fontSize: 15.5,
  },
});
