import * as React from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core';

export interface LiquidGlassViewProps extends ViewProps {
  /** 'regular' (más esmerilado) o 'clear' (más transparente, como el lente). */
  glassStyle?: 'regular' | 'clear';
  tintColor?: string;
  /** El vidrio responde al toque (brillo y rebote de iOS 26). */
  interactive?: boolean;
  cornerRadius?: number;
  colorScheme?: 'light' | 'dark' | 'auto';
}

const isIOS = Platform.OS === 'ios';
const NativeModule = isIOS ? requireNativeModule<{ isAvailable: () => boolean }>('LiquidGlass') : null;
const NativeView: React.ComponentType<LiquidGlassViewProps> | null = isIOS ? requireNativeViewManager('LiquidGlass') : null;

/** true en iOS 26 o más, donde el sistema dibuja Liquid Glass real. */
export function isLiquidGlassAvailable(): boolean {
  return NativeModule?.isAvailable() ?? false;
}

/** Vidrio nativo de fondo (sin hijos). Fuera de iOS no dibuja nada. */
export function LiquidGlassView(props: LiquidGlassViewProps) {
  if (!NativeView) return React.createElement(View, { ...props, pointerEvents: 'none' });
  return React.createElement(NativeView, props);
}
