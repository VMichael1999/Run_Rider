import { PRODUCTS, RESTAURANTS } from '../data/mock';

/** "Café" y "cafe" son lo mismo al buscar. */
export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Locales y platos que contienen el texto (sin tildes ni mayúsculas). */
export function searchCatalog(query: string) {
  const q = normalize(query);
  if (!q) return { restaurants: [], products: [] };
  return {
    restaurants: Object.values(RESTAURANTS).filter((restaurant) => normalize(restaurant.name).includes(q)),
    products: Object.values(PRODUCTS).filter(
      (product) => normalize(product.name).includes(q) || normalize(product.description).includes(q),
    ),
  };
}
