import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { UserRole } from '@shared/types';

interface AuthState {
  phone: string;
  countryCode: string;
  role: UserRole | null;
  isAuthenticated: boolean;
  token: string | null;
  /** Ya se leyó la sesión guardada (hasta entonces la app no se muestra). */
  hasHydrated: boolean;
  loadSession: () => Promise<void>;
  setPhone: (phone: string, countryCode: string) => void;
  setAuthenticated: (token: string, role: UserRole) => void;
  logout: () => void;
}

const SESSION_STORAGE_KEY = 'runrider.session';

interface StoredSession {
  token: string;
  role: UserRole;
  phone: string;
  countryCode: string;
}

/** La sesión se guarda en el llavero (SecureStore); en web, en localStorage. */
async function writeSession(session: StoredSession | null) {
  const value = session ? JSON.stringify(session) : null;
  if (Platform.OS === 'web') {
    if (typeof globalThis.localStorage === 'undefined') return;
    if (value) globalThis.localStorage.setItem(SESSION_STORAGE_KEY, value);
    else globalThis.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  if (value) await SecureStore.setItemAsync(SESSION_STORAGE_KEY, value);
  else await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}

async function readSession(): Promise<StoredSession | null> {
  const raw =
    Platform.OS === 'web'
      ? typeof globalThis.localStorage === 'undefined'
        ? null
        : globalThis.localStorage.getItem(SESSION_STORAGE_KEY)
      : await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Partial<StoredSession>;
  return parsed.token && parsed.role ? (parsed as StoredSession) : null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  phone: '',
  countryCode: '+51',
  role: null,
  isAuthenticated: false,
  token: null,
  hasHydrated: false,
  loadSession: async () => {
    try {
      const session = await readSession();
      if (session) {
        set({ ...session, isAuthenticated: true, hasHydrated: true });
        return;
      }
    } catch {
      // Sesión ilegible: se pide entrar de nuevo.
    }
    set({ hasHydrated: true });
  },
  setPhone: (phone, countryCode) => set({ phone, countryCode }),
  setAuthenticated: (token, role) => {
    set({ token, role, isAuthenticated: true });
    const { phone, countryCode } = get();
    void writeSession({ token, role, phone, countryCode }).catch(() => undefined);
  },
  // El modo (viajes o delivery) no se toca: al volver a entrar, se abre el último que se usó.
  logout: () => {
    set({ token: null, role: null, isAuthenticated: false, phone: '', countryCode: '+51' });
    void writeSession(null).catch(() => undefined);
  },
}));
