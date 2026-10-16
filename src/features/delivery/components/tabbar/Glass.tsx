import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { DeliveryColors } from '@theme/colors';

interface GlassProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Pieza de vidrio de la barra: desenfoque del contenido de abajo con un velo blanco y un borde claro,
 * como el vidrio claro de iOS 26 (sin su refracción, que necesita la New Architecture).
 */
export function Glass({ style, children }: GlassProps) {
  return (
    <View style={[styles.wrap, style]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        // En iOS, el material del sistema; en Android, BlurView no desenfoca sin el método experimental.
        tint={Platform.OS === 'ios' ? 'systemChromeMaterialLight' : 'light'}
        intensity={Platform.OS === 'ios' ? 80 : 100}
      />
      <View style={[StyleSheet.absoluteFill, styles.veil]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DeliveryColors.light.glassEdge,
  },
  veil: {
    backgroundColor: Platform.OS === 'ios' ? DeliveryColors.light.glassVeil : DeliveryColors.light.glassFallback,
  },
});
