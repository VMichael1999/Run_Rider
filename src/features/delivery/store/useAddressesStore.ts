import { create } from 'zustand';
import { SAVED_ADDRESSES, type SavedAddress } from '../data/account';

interface AddressesState {
  addresses: SavedAddress[];
  /** Dirección de entrega elegida (la que muestra el inicio y usa el checkout). */
  selectedId: string;
  select: (id: string) => void;
  add: (address: Omit<SavedAddress, 'id'>) => SavedAddress;
  remove: (id: string) => void;
}

/** Direcciones guardadas donde se entregan los pedidos. */
export const useAddressesStore = create<AddressesState>((set) => ({
  addresses: SAVED_ADDRESSES,
  selectedId: SAVED_ADDRESSES[0].id,
  select: (id) => set({ selectedId: id }),
  add: (address) => {
    const saved = { ...address, id: `dir-${Date.now()}` };
    set((state) => ({ addresses: [...state.addresses, saved], selectedId: saved.id }));
    return saved;
  },
  remove: (id) =>
    set((state) => {
      const addresses = state.addresses.filter((item) => item.id !== id);
      // No se queda sin dirección elegida: pasa a la primera que quede.
      const selectedId = state.selectedId === id ? addresses[0]?.id ?? '' : state.selectedId;
      return { addresses, selectedId };
    }),
}));

/** Dirección elegida. */
export function selectedAddress(state: Pick<AddressesState, 'addresses' | 'selectedId'>) {
  return state.addresses.find((item) => item.id === state.selectedId) ?? state.addresses[0];
}

export function useSelectedAddress() {
  return useAddressesStore((state) => selectedAddress(state));
}

// Para pruebas: el store parte de los datos simulados.
export const ADDRESSES_INITIAL = { addresses: SAVED_ADDRESSES, selectedId: SAVED_ADDRESSES[0].id };
