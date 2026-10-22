import { useThemeStore } from '@store/useThemeStore';
import { getMapStyle } from '@theme/mapStyles';

/** Estilo del mapa de Google según el tema (oscuro en modo oscuro), como en viajes. */
export function useDeliveryMapStyle() {
  const isDark = useThemeStore((s) => s.isDark);
  return { customMapStyle: getMapStyle(isDark), userInterfaceStyle: isDark ? ('dark' as const) : ('light' as const) };
}
