import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppTheme } from './src/theme';
import { LogBox } from 'react-native';
import { useThemeStore } from './src/store/useThemeStore';
import { useAppModeStore } from './src/store/useAppModeStore';
import { useAuthStore } from './src/store/useAuthStore';

LogBox.ignoreAllLogs();

// Mantiene el splash nativo (fondo negro) hasta que las fuentes estén listas, en vez de una pantalla en blanco.
void SplashScreen.preventAutoHideAsync();

export default function App() {
  const theme = useAppTheme();
  const isDark = useThemeStore((state) => state.isDark);
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const loadMode = useAppModeStore((state) => state.loadMode);
  const modeHydrated = useAppModeStore((state) => state.hasHydrated);
  const loadSession = useAuthStore((state) => state.loadSession);
  const sessionHydrated = useAuthStore((state) => state.hasHydrated);
  const ready = modeHydrated && sessionHydrated;
  const [fontsLoaded, fontError] = useFonts({
    'GeneralSans-Regular': require('./assets/legacy/fonts/GeneralSans-Regular.ttf'),
    'GeneralSans-Italic': require('./assets/legacy/fonts/GeneralSans-Italic.ttf'),
    'GeneralSans-Medium': require('./assets/legacy/fonts/GeneralSans-Medium.ttf'),
    'GeneralSans-Semibold': require('./assets/legacy/fonts/GeneralSans-Semibold.ttf'),
    'GeneralSans-Bold': require('./assets/legacy/fonts/GeneralSans-Bold.ttf'),
    'GeneralSans-BoldItalic': require('./assets/legacy/fonts/GeneralSans-BoldItalic.ttf'),
  });

  React.useEffect(() => {
    void loadTheme();
    void loadMode();
    void loadSession();
  }, [loadTheme, loadMode, loadSession]);

  React.useEffect(() => {
    if ((fontsLoaded || fontError) && ready) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, ready]);

  // Sin la sesión y el modo guardados, la app mostraría el login o viajes y luego saltaría.
  if ((!fontsLoaded && !fontError) || !ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
          <StatusBar style={theme.statusBar} />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
