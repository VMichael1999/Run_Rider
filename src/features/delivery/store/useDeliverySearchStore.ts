import { create } from 'zustand';

interface DeliverySearchState {
  query: string;
  setQuery: (query: string) => void;
}

/** Texto del campo de búsqueda de la barra; lo lee la pantalla de resultados. */
export const useDeliverySearchStore = create<DeliverySearchState>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),
}));
