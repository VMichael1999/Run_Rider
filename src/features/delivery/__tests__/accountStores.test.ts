import { act } from '@testing-library/react-native';
import { ADDRESSES_INITIAL, selectedAddress, useAddressesStore } from '../store/useAddressesStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useCouponsStore } from '../store/useCouponsStore';
import { unreadCount, useNotificationsStore } from '../store/useNotificationsStore';
import { validateBilling, type BillingData } from '../store/useBillingStore';
import { ACCOUNT_COUPONS, NOTIFICATIONS } from '../data/account';

describe('direcciones guardadas', () => {
  beforeEach(() => act(() => useAddressesStore.setState(ADDRESSES_INITIAL)));

  it('empieza con Casa elegida', () => {
    expect(selectedAddress(useAddressesStore.getState()).label).toBe('Casa');
  });

  it('una dirección nueva queda elegida', () => {
    act(() => {
      useAddressesStore.getState().add({
        label: 'Gimnasio',
        icon: 'location-outline',
        street: 'Av. Pardo 500',
        detail: 'Av. Pardo 500, Miraflores',
        coordinate: { latitude: -12.11, longitude: -77.03 },
      });
    });
    expect(selectedAddress(useAddressesStore.getState()).label).toBe('Gimnasio');
  });

  it('al borrar la elegida pasa a la primera que queda', () => {
    act(() => useAddressesStore.getState().remove('casa'));
    expect(useAddressesStore.getState().selectedId).toBe('trabajo');
  });
});

describe('favoritos', () => {
  it('el corazón agrega y quita', () => {
    act(() => useFavoritesStore.getState().toggleRestaurant('napoli'));
    expect(useFavoritesStore.getState().restaurantIds).toContain('napoli');
    act(() => useFavoritesStore.getState().toggleRestaurant('napoli'));
    expect(useFavoritesStore.getState().restaurantIds).not.toContain('napoli');
  });
});

describe('cupones', () => {
  beforeEach(() => act(() => useCouponsStore.setState({ coupons: ACCOUNT_COUPONS })));

  it('agrega un código válido sin importar mayúsculas', () => {
    let result = '';
    act(() => {
      result = useCouponsStore.getState().redeem(' runrider10 ');
    });
    expect(result).toBe('agregado');
    expect(useCouponsStore.getState().coupons[0].code).toBe('RUNRIDER10');
  });

  it('rechaza códigos repetidos o inexistentes', () => {
    expect(useCouponsStore.getState().redeem('RUN30')).toBe('repetido');
    expect(useCouponsStore.getState().redeem('NOEXISTE')).toBe('invalido');
  });
});

describe('notificaciones', () => {
  beforeEach(() => act(() => useNotificationsStore.setState({ items: NOTIFICATIONS })));

  it('marca como leídas', () => {
    expect(unreadCount(useNotificationsStore.getState().items)).toBe(2);
    act(() => useNotificationsStore.getState().markRead('n1'));
    expect(unreadCount(useNotificationsStore.getState().items)).toBe(1);
    act(() => useNotificationsStore.getState().markAllRead());
    expect(unreadCount(useNotificationsStore.getState().items)).toBe(0);
  });
});

describe('facturación', () => {
  const base: BillingData = {
    type: 'boleta',
    fullName: 'Luis Ramírez',
    dni: '45678912',
    ruc: '',
    businessName: '',
    fiscalAddress: '',
    email: 'luis@correo.pe',
  };

  it('boleta válida', () => {
    expect(validateBilling(base)).toEqual({});
  });

  it('pide DNI de 8 dígitos y correo válido', () => {
    expect(validateBilling({ ...base, dni: '123', email: 'x' })).toMatchObject({ dni: expect.any(String), email: expect.any(String) });
  });

  it('factura: RUC de 11 dígitos que empieza en 10 o 20', () => {
    const factura = { ...base, type: 'factura' as const, businessName: 'Run SAC', fiscalAddress: 'Av. Arequipa 2450' };
    expect(validateBilling({ ...factura, ruc: '20123456789' })).toEqual({});
    expect(validateBilling({ ...factura, ruc: '30123456789' }).ruc).toBeDefined();
  });
});
