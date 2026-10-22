import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { SearchTarget } from '@shared/types';

// Root stack — decides whether to show auth or main app
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  ClienteApp: undefined;
  DeliveryApp: undefined;
  ConductorApp: undefined;
};

// Auth stack
export type AuthStackParamList = {
  Login: undefined;
  LoginVerificacion: { phone: string; countryCode: string };
};

// Cliente stack (inside drawer/tabs)
export type ClienteStackParamList = {
  ClienteHome: undefined;
  /** editing: se abrió desde la solicitud para cambiar un punto; al elegir, vuelve a ella. */
  /** scheduledTripId: agrega la parada a ese viaje programado en lugar de al viaje que se está pidiendo. */
  SearchAddress: { target: SearchTarget; saveFavorite?: boolean; editing?: boolean; scheduledTripId?: string };
  SelectAddressOnMap: { target: SearchTarget; saveFavorite?: boolean; editing?: boolean; scheduledTripId?: string };
  /** autoSearchServiceId: viaje programado que llegó a su hora; busca conductor de inmediato. */
  SolicitudTaxi: { autoSearchServiceId?: string } | undefined;
  TrayectoTaxi: undefined;
  Chat: { userId: string; userName: string };
  HistorialViaje: undefined;
  DetalleViaje: { tripId: string };
  Configuracion: undefined;
  Perfil: undefined;
  /** forRide: elige el método del viaje en curso y vuelve; sin él, cambia la preferencia. */
  MetodosPago: { forRide?: boolean; scheduledTripId?: string } | undefined;
  Promociones: undefined;
  Favoritas: undefined;
  ProgramarViaje: undefined;
  DetalleViajeProgramado: { tripId: string };
};

// Modo delivery: carga y pestañas
export type DeliveryStackParamList = {
  DeliveryCarga: undefined;
  DeliveryTabs: NavigatorScreenParams<DeliveryTabParamList> | undefined;
  DeliveryLocal: { restaurantId: string };
  DeliveryProducto: { productId: string };
  DeliveryCheckout: undefined;
  /** purpose 'guardar': agrega la dirección elegida a Direcciones guardadas. */
  DeliveryDireccion: { purpose?: 'guardar' } | undefined;
  DeliverySeguimiento: undefined;
  // Menú lateral de delivery
  DeliveryPedidos: undefined;
  DeliveryCupones: undefined;
  DeliveryDirecciones: undefined;
  DeliveryFacturacion: undefined;
  DeliveryNotificaciones: undefined;
  Perfil: undefined;
  MetodosPago: { forRide?: boolean; scheduledTripId?: string } | undefined;
  Configuracion: undefined;
};

export type DeliveryTabParamList = {
  DeliveryInicio: undefined;
  DeliveryFavoritos: undefined;
  DeliveryCarrito: undefined;
  /** Pestaña de búsqueda: va en su propio círculo al final de la barra. */
  DeliveryBuscar: undefined;
};

// Conductor bottom tabs
export type ConductorTabParamList = {
  Solicitudes: undefined;
  Ingresos: undefined;
  Experiencia: undefined;
  Cuenta: undefined;
};

// Conductor stack
export type ConductorStackParamList = {
  ConductorHome: undefined;
  SolicitudesDetalle: { alertId: string };
  SolicitudesTrayecto: undefined;
  ConfirmarPuntoPartida: { routePoints?: { latitude: number; longitude: number }[] };
  Chat: { userId: string; userName: string };
  HistorialViaje: undefined;
  DetalleViaje: { tripId: string };
  Configuracion: undefined;
  Verificacion: undefined;
  VerificacionInformacionBasica: undefined;
  VerificacionFotoConductor: undefined;
  VerificacionDocumento: undefined;
  VerificacionLicencia: undefined;
  VerificacionSoat: undefined;
  VerificacionVehiculo: undefined;
  VerificacionAntecedentes: undefined;
  VerificacionContactoEmergencia: undefined;
};

// Screen prop types
export type LoginProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type LoginVerificacionProps = NativeStackScreenProps<AuthStackParamList, 'LoginVerificacion'>;
export type ClienteHomeProps = NativeStackScreenProps<ClienteStackParamList, 'ClienteHome'>;
export type SolicitudTaxiProps = NativeStackScreenProps<ClienteStackParamList, 'SolicitudTaxi'>;
export type TrayectoTaxiProps = NativeStackScreenProps<ClienteStackParamList, 'TrayectoTaxi'>;
export type ConductorHomeProps = NativeStackScreenProps<ConductorStackParamList, 'ConductorHome'>;
export type SolicitudesDetalleProps = NativeStackScreenProps<ConductorStackParamList, 'SolicitudesDetalle'>;
