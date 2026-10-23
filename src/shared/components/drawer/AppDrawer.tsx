import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SideMenu, type SideMenuSection, type SideMenuThemeOverrides } from 'expo-reanimated-side-menu';
import type { ClienteStackParamList } from '@navigation/types';
import { Colors } from '@theme/colors';
import { useAppTheme } from '@theme/useAppTheme';
import { FontFamily } from '@theme/fonts';
import type { AppMode } from '@store/useAppModeStore';
import appJson from '../../../../app.json';

type ClienteRoute = keyof ClienteStackParamList;

export type DrawerSection = 'main' | 'wallet' | 'personal' | 'preferences';

export interface DrawerOption<Route extends string = ClienteRoute> {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: Route;
  section: DrawerSection;
}

interface AppDrawerProps<Route extends string> {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: Route) => void;
  /** Opciones del menú; por defecto, las de viajes. */
  options?: DrawerOption<Route>[];
  /** Pantalla que abre la cabecera "Mi perfil". */
  profileRoute?: Route;
  sectionLabels?: Partial<Record<DrawerSection, string>>;
  onLogout: () => void;
  phoneLabel: string;
  /** Con él, se muestra el botón para cambiar entre viajes y delivery. */
  mode?: AppMode;
  onToggleMode?: () => void;
  /** La pantalla que se corre e inclina en 3D al abrir el menú; sin ella, el menú solo se superpone. */
  children?: React.ReactNode;
}

const SECTION_LABELS: Record<DrawerSection, string> = {
  main: 'Navegación',
  wallet: 'Pagos y promociones',
  personal: 'Personales',
  preferences: 'Preferencias',
};

const SECTION_ORDER: DrawerSection[] = ['main', 'wallet', 'personal', 'preferences'];

const DRAWER_OPTIONS: DrawerOption[] = [
  { id: 'home', icon: 'home-outline', label: 'Mapa', route: 'ClienteHome', section: 'main' },
  { id: 'trips', icon: 'time-outline', label: 'Mis viajes', route: 'HistorialViaje', section: 'main' },
  { id: 'schedule', icon: 'alarm-outline', label: 'Programar viaje', route: 'ProgramarViaje', section: 'main' },
  { id: 'payment', icon: 'card-outline', label: 'Métodos de pago', route: 'MetodosPago', section: 'wallet' },
  { id: 'promos', icon: 'pricetag-outline', label: 'Promociones', route: 'Promociones', section: 'wallet' },
  { id: 'favorites', icon: 'bookmark-outline', label: 'Direcciones favoritas', route: 'Favoritas', section: 'personal' },
  { id: 'settings', icon: 'settings-outline', label: 'Configuración', route: 'Configuracion', section: 'preferences' },
];

const APP_VERSION: string = (appJson as { expo: { version: string } }).expo.version;

/** Menú lateral de la app, dibujado con expo-reanimated-side-menu en los colores y la fuente de Run Rider. */
export function AppDrawer<Route extends string = ClienteRoute>({
  visible,
  onClose,
  onNavigate,
  options,
  profileRoute,
  sectionLabels,
  onLogout,
  phoneLabel,
  mode,
  onToggleMode,
  children,
}: AppDrawerProps<Route>) {
  const appTheme = useAppTheme();

  const theme: SideMenuThemeOverrides = React.useMemo(
    () => ({
      background: appTheme.drawer,
      text: Colors.white,
      textSecondary: Colors.onDarkHigh,
      textMuted: Colors.onDarkMuted,
      divider: Colors.onDarkLine,
      avatarBackground: Colors.onDarkLine,
      accent: Colors.accentLime,
      onAccent: Colors.onAccentLime,
      danger: Colors.dangerOnDark,
      backdrop: Colors.scrimSoft,
      fonts: { regular: FontFamily.regular, semibold: FontFamily.semibold, bold: FontFamily.bold },
    }),
    [appTheme.drawer],
  );

  const sections: SideMenuSection[] = React.useMemo(() => {
    const list = options ?? (DRAWER_OPTIONS as unknown as DrawerOption<Route>[]);
    return SECTION_ORDER.flatMap((section) => {
      const items = list.filter((option) => option.section === section);
      if (items.length === 0) return [];
      return [
        {
          key: section,
          title: sectionLabels?.[section] ?? SECTION_LABELS[section],
          items: items.map((option) => ({
            key: option.id,
            label: option.label,
            icon: option.icon,
            onPress: () => onNavigate(option.route),
          })),
        },
      ];
    });
  }, [options, sectionLabels, onNavigate]);

  const inDelivery = mode === 'delivery';

  return (
    <SideMenu
      visible={visible}
      onClose={onClose}
      theme={theme}
      profile={{
        title: 'Mi perfil',
        subtitle: phoneLabel,
        onPress: () => onNavigate(profileRoute ?? ('Perfil' as Route)),
        accessibilityLabel: 'Ver perfil',
      }}
      sections={sections}
      action={
        mode && onToggleMode
          ? {
              label: inDelivery ? 'Volver a viajes' : 'Modo delivery',
              icon: inDelivery ? 'car-outline' : 'bag-outline',
              variant: inDelivery ? 'outline' : 'accent',
              onPress: onToggleMode,
              accessibilityLabel: inDelivery ? 'Volver a viajes' : 'Cambiar a modo delivery',
            }
          : undefined
      }
      logout={{ label: 'Cerrar sesión', onPress: onLogout }}
      footerText={`Version ${APP_VERSION}`}
      closeLabel="Cerrar menú"
    >
      {children}
    </SideMenu>
  );
}
