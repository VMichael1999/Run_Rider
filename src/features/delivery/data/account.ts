import type { Ionicons } from '@expo/vector-icons';

/**
 * Datos simulados de la cuenta en delivery (pedidos anteriores, notificaciones, cupones y direcciones).
 * No están en el mockup; son una muestra coherente con los locales y montos del prompt.
 */

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface SavedAddress {
  id: string;
  label: string;
  icon: IoniconName;
  street: string;
  /** Departamento, piso o referencia. */
  detail: string;
  coordinate: { latitude: number; longitude: number };
}

export const SAVED_ADDRESSES: SavedAddress[] = [
  {
    id: 'casa',
    label: 'Casa',
    icon: 'home-outline',
    street: 'Av. Arequipa 2450, Lince',
    detail: 'Av. Arequipa 2450, dpto. 702, Lince',
    coordinate: { latitude: -12.0838, longitude: -77.0335 },
  },
  {
    id: 'trabajo',
    label: 'Trabajo',
    icon: 'briefcase-outline',
    street: 'Av. Javier Prado Este 4200, Surco',
    detail: 'Av. Javier Prado Este 4200, piso 8, Santiago de Surco',
    coordinate: { latitude: -12.0868, longitude: -76.9725 },
  },
  {
    id: 'mama',
    label: 'Casa de mamá',
    icon: 'heart-outline',
    street: 'Jr. Huiracocha 1290, Jesús María',
    detail: 'Jr. Huiracocha 1290, Jesús María (portón verde)',
    coordinate: { latitude: -12.0761, longitude: -77.0493 },
  },
];

export type PastOrderStatus = 'entregado' | 'cancelado';

export interface PastOrder {
  id: string;
  restaurantId: string;
  date: string;
  items: string;
  count: number;
  total: number;
  status: PastOrderStatus;
}

export const PAST_ORDERS: PastOrder[] = [
  {
    id: '2291',
    restaurantId: 'donaRosa',
    date: '12 oct · 13:40',
    items: '1/4 pollo a la brasa · Papas fritas · Chicha morada',
    count: 3,
    total: 48.5,
    status: 'entregado',
  },
  {
    id: '2264',
    restaurantId: 'cafeMalecon',
    date: '5 oct · 09:15',
    items: 'Capuccino grande · Croissant de jamón',
    count: 2,
    total: 22.4,
    status: 'entregado',
  },
  {
    id: '2240',
    restaurantId: 'napoli',
    date: '28 set · 21:05',
    items: 'Pizza americana familiar · Gaseosa 1.5 L',
    count: 2,
    total: 57.9,
    status: 'cancelado',
  },
  {
    id: '2213',
    restaurantId: 'burgerRuta',
    date: '20 set · 20:30',
    items: 'Ruta Clásica · Papas fritas · Limonada',
    count: 3,
    total: 34.8,
    status: 'entregado',
  },
];

export type NotificationKind = 'pedido' | 'promo' | 'cupon' | 'cuenta';

export interface DeliveryNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: string;
  group: 'Hoy' | 'Esta semana' | 'Antes';
  read: boolean;
}

export const NOTIFICATION_ICONS: Record<NotificationKind, IoniconName> = {
  pedido: 'bag-handle-outline',
  promo: 'flash-outline',
  cupon: 'ticket-outline',
  cuenta: 'person-outline',
};

export const NOTIFICATIONS: DeliveryNotification[] = [
  {
    id: 'n1',
    kind: 'promo',
    title: 'Envío gratis toda la semana',
    body: 'Usa ENVIOGRATIS en todos tus pedidos hasta el domingo.',
    time: '10:24',
    group: 'Hoy',
    read: false,
  },
  {
    id: 'n2',
    kind: 'cupon',
    title: 'Tienes un cupón de 15 % en Burger Ruta',
    body: 'Válido en pedidos desde S/ 60.00. Vence en 3 días.',
    time: '08:02',
    group: 'Hoy',
    read: false,
  },
  {
    id: 'n3',
    kind: 'pedido',
    title: 'Tu pedido #2291 fue entregado',
    body: 'Pollos Doña Rosa · ¿Qué tal estuvo? Califica a tu repartidor.',
    time: 'Dom',
    group: 'Esta semana',
    read: true,
  },
  {
    id: 'n4',
    kind: 'promo',
    title: '30 % en todo tu pedido',
    body: 'Código RUN30 en locales seleccionados. Solo por hoy en la noche.',
    time: 'Vie',
    group: 'Esta semana',
    read: true,
  },
  {
    id: 'n5',
    kind: 'cuenta',
    title: 'Agrega tus datos de facturación',
    body: 'Recibe tu boleta o factura en tu correo en cada pedido.',
    time: '28 set',
    group: 'Antes',
    read: true,
  },
];

export interface AccountCoupon {
  id: string;
  code: string;
  title: string;
  conditions: string;
  expires: string;
  /** Local que lo emite; sin él, es un cupón de Run. */
  restaurantId?: string;
  state: 'disponible' | 'usado' | 'vencido';
}

export const ACCOUNT_COUPONS: AccountCoupon[] = [
  {
    id: 'run30',
    code: 'RUN30',
    title: '30% dscto',
    conditions: 'En todo tu pedido · Tope S/ 25.00',
    expires: 'Vence el 31 oct',
    state: 'disponible',
  },
  {
    id: 'enviogratis',
    code: 'ENVIOGRATIS',
    title: 'Envío gratis',
    conditions: 'En cualquier local',
    expires: 'Vence el 26 oct',
    state: 'disponible',
  },
  {
    id: 'br15',
    code: 'BURGER15',
    title: '15% dscto',
    conditions: 'Mín. S/ 60.00 · Solo Burger Ruta',
    expires: 'Vence el 25 oct',
    restaurantId: 'burgerRuta',
    state: 'disponible',
  },
  {
    id: 'np25',
    code: 'NAPOLI25',
    title: '25% dscto',
    conditions: 'Mín. S/ 50.00 · Solo Pizzería Napoli',
    expires: 'Vence el 2 nov',
    restaurantId: 'napoli',
    state: 'disponible',
  },
  {
    id: 'cafe5',
    code: 'CAFE5',
    title: '5% dscto',
    conditions: 'Solo Café Malecón',
    expires: 'Usado el 5 oct',
    restaurantId: 'cafeMalecon',
    state: 'usado',
  },
  {
    id: 'pollo20',
    code: 'POLLO20',
    title: '20% dscto',
    conditions: 'Solo Pollos Doña Rosa',
    expires: 'Venció el 30 set',
    restaurantId: 'donaRosa',
    state: 'vencido',
  },
];

/** Códigos que se pueden agregar a mano en Cupones (muestra). */
export const REDEEMABLE_CODES: Record<string, Omit<AccountCoupon, 'id' | 'code' | 'state'>> = {
  RUNRIDER10: { title: '10% dscto', conditions: 'En tu próximo pedido · Tope S/ 15.00', expires: 'Vence el 30 nov' },
  BIENVENIDA: { title: 'S/ 10.00 de regalo', conditions: 'En pedidos desde S/ 40.00', expires: 'Vence el 15 nov' },
};
