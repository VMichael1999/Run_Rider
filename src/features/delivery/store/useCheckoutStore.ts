import { create } from 'zustand';
import { selectedAddress, useAddressesStore } from './useAddressesStore';

export interface CheckoutAddress {
  label: string;
  detail: string;
  coordinate: { latitude: number; longitude: number };
}


export type Fulfillment = 'delivery' | 'pickup';

interface CheckoutState {
  fulfillment: Fulfillment;
  /** Cupón del local elegido en "Mis cupones" (porcentaje sobre el subtotal). */
  couponId: string | null;
  /** Punto elegido en el mapa solo para este pedido; sin él se usa la dirección guardada elegida. */
  addressOverride: CheckoutAddress | null;
  setAddress: (address: CheckoutAddress | null) => void;
  setFulfillment: (fulfillment: Fulfillment) => void;
  setCoupon: (couponId: string | null) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  fulfillment: 'delivery',
  couponId: null,
  addressOverride: null,
  setAddress: (address) => set({ addressOverride: address }),
  setFulfillment: (fulfillment) => set({ fulfillment }),
  setCoupon: (couponId) => set({ couponId }),
  reset: () => set({ fulfillment: 'delivery', couponId: null, addressOverride: null }),
}));

/** Dirección de entrega del checkout: la elegida en el mapa o, si no, la guardada que está elegida. */
export function useCheckoutAddress(): CheckoutAddress {
  const override = useCheckoutStore((s) => s.addressOverride);
  const saved = useAddressesStore((s) => selectedAddress(s));
  return override ?? { label: saved.label, detail: saved.detail, coordinate: saved.coordinate };
}
