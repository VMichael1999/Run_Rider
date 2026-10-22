import { act } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../useAuthStore';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

const getItemAsync = SecureStore.getItemAsync as jest.Mock;

describe('sesión guardada', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAuthStore.setState({ token: null, role: null, isAuthenticated: false, phone: '', countryCode: '+51', hasHydrated: false });
    });
  });

  it('al entrar guarda la sesión', () => {
    act(() => {
      useAuthStore.getState().setPhone('987654314', '+51');
      useAuthStore.getState().setAuthenticated('tok', 'cliente');
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'runrider.session',
      JSON.stringify({ token: 'tok', role: 'cliente', phone: '987654314', countryCode: '+51' }),
    );
  });

  it('al abrir la app recupera la sesión', async () => {
    getItemAsync.mockResolvedValueOnce(JSON.stringify({ token: 'tok', role: 'cliente', phone: '987654314', countryCode: '+51' }));
    await act(async () => {
      await useAuthStore.getState().loadSession();
    });
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: true, role: 'cliente', phone: '987654314', hasHydrated: true });
  });

  it('sin sesión guardada pide entrar', async () => {
    getItemAsync.mockResolvedValueOnce(null);
    await act(async () => {
      await useAuthStore.getState().loadSession();
    });
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: false, hasHydrated: true });
  });

  it('cerrar sesión borra la sesión guardada', () => {
    act(() => useAuthStore.getState().logout());
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('runrider.session');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
