import React from 'react';
import { setStatusBarStyle, type StatusBarStyle } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useThemeStore } from '@store/useThemeStore';

/**
 * Fija el color de la barra de estado mientras la pantalla está enfocada (las pestañas siguen montadas).
 * 'dark' es "texto oscuro sobre fondo claro": en modo oscuro pasa a texto claro.
 */
export function useStatusBarStyle(style: StatusBarStyle) {
  const isDark = useThemeStore((s) => s.isDark);
  const resolved = style === 'dark' && isDark ? 'light' : style;
  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle(resolved, true);
    }, [resolved]),
  );
}
