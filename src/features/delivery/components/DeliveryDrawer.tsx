import React from 'react';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { AppDrawer, type DrawerOption } from '@shared/components/drawer/AppDrawer';
import type { DeliveryStackParamList } from '@navigation/types';
import { useAuthStore } from '@store/useAuthStore';
import { useAppModeStore } from '@store/useAppModeStore';

type DeliveryRoute = keyof DeliveryStackParamList;

/** Menú lateral en delivery: sin las opciones de viajes (mapa, mis viajes, programar). */
const DELIVERY_OPTIONS: DrawerOption<DeliveryRoute>[] = [
  { id: 'orders', icon: 'receipt-outline', label: 'Mis pedidos', route: 'DeliveryPedidos', section: 'main' },
  { id: 'notifications', icon: 'notifications-outline', label: 'Notificaciones', route: 'DeliveryNotificaciones', section: 'main' },
  { id: 'payment', icon: 'card-outline', label: 'Métodos de pago', route: 'MetodosPago', section: 'wallet' },
  { id: 'coupons', icon: 'pricetag-outline', label: 'Cupones', route: 'DeliveryCupones', section: 'wallet' },
  { id: 'billing', icon: 'document-text-outline', label: 'Datos de facturación', route: 'DeliveryFacturacion', section: 'wallet' },
  { id: 'addresses', icon: 'location-outline', label: 'Direcciones guardadas', route: 'DeliveryDirecciones', section: 'personal' },
  { id: 'settings', icon: 'settings-outline', label: 'Configuración', route: 'Configuracion', section: 'preferences' },
];

const SECTION_LABELS = {
  main: 'Pedidos',
  wallet: 'Pagos y cupones',
};

interface DeliveryDrawerProps {
  visible: boolean;
  onClose: () => void;
  /** La pantalla que se inclina como una carta al abrir el menú. */
  children: React.ReactNode;
}

export function DeliveryDrawer({ visible, onClose, children }: DeliveryDrawerProps) {
  const navigation = useNavigation<NavigationProp<DeliveryStackParamList>>();
  const logout = useAuthStore((s) => s.logout);
  const phone = useAuthStore((s) => s.phone);
  const countryCode = useAuthStore((s) => s.countryCode);
  const setMode = useAppModeStore((s) => s.setMode);

  return (
    <AppDrawer<DeliveryRoute>
      variant="cards"
      visible={visible}
      onClose={onClose}
      options={DELIVERY_OPTIONS}
      sectionLabels={SECTION_LABELS}
      profileRoute="Perfil"
      onNavigate={(route) => navigation.navigate(route as never)}
      onLogout={logout}
      phoneLabel={phone ? `${countryCode} ${phone}` : '+51 999 999 999'}
      mode="delivery"
      onToggleMode={() => setMode('viajes')}
    >
      {children}
    </AppDrawer>
  );
}
