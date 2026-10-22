import { create } from 'zustand';

interface FavoritesState {
  restaurantIds: string[];
  productIds: string[];
  toggleRestaurant: (id: string) => void;
  toggleProduct: (id: string) => void;
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

/** Locales y platos guardados con el corazón. Empieza con una muestra. */
export const useFavoritesStore = create<FavoritesState>((set) => ({
  restaurantIds: ['burgerRuta', 'cafeMalecon'],
  productIds: ['crispy-pollo'],
  toggleRestaurant: (id) => set((state) => ({ restaurantIds: toggle(state.restaurantIds, id) })),
  toggleProduct: (id) => set((state) => ({ productIds: toggle(state.productIds, id) })),
}));
