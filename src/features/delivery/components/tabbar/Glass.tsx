import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '@store/useThemeStore';
import { useDeliveryColors } from '../../theme';
import { LiquidGlassView, isLiquidGlassAvailable } from '@modules/liquid-glass/src';

/** Liquid Glass real (iOS 26 o más); se consulta una vez. */
export const LIQUID_GLASS = isLiquidGlassAvailable();

interface GlassProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Radio de las esquinas del vidrio (en iOS 26 el sistema lo dibuja con su luz de borde). */
  radius: number;
  /** 'clear' es el vidrio transparente del lente; 'regular', el de la barra. */
  variant?: 'regular' | 'clear';
  /** El vidrio responde al toque con el brillo y el rebote de iOS 26. */
  interactive?: boolean;
}

/**
 * Pieza de vidrio. En iOS 26 es Liquid Glass nativo (UIGlassEffect: refracción, dispersión y luz de
 * borde); en iOS anteriores, desenfoque con velo blanco; en Android, blanco translúcido.
 */
export function Glass({ style, children, radius, variant = 'regular', interactive = false }: GlassProps) {
  const isDark = useThemeStore((s) => s.isDark);
  const colors = useDeliveryColors();

  if (LIQUID_GLASS) {
    return (
      <View style={[{ borderRadius: radius }, style]}>
        <LiquidGlassView
          style={StyleSheet.absoluteFill}
          glassStyle={variant}
          cornerRadius={radius}
          interactive={interactive}
          colorScheme={isDark ? 'dark' : 'light'}
          pointerEvents="none"
        />
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { borderRadius: radius, borderColor: colors.glassEdge }, style]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        // En iOS, el material del sistema; en Android, BlurView no desenfoca sin el método experimental.
        tint={Platform.OS === 'ios' ? (isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight') : isDark ? 'dark' : 'light'}
        intensity={Platform.OS === 'ios' ? 80 : 100}
      />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: Platform.OS === 'ios' ? colors.glassVeil : colors.glassFallback }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
