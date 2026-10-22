import { normalize, searchCatalog } from '../utils/searchCatalog';

describe('búsqueda de delivery', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(normalize('  Café MALECÓN ')).toBe('cafe malecon');
  });

  it('encuentra locales y platos', () => {
    const results = searchCatalog('pollo');
    expect(results.restaurants.map((r) => r.id)).toEqual(['donaRosa']);
    expect(results.products.map((p) => p.id)).toEqual(['crispy-pollo']);
  });

  it('sin texto no devuelve nada', () => {
    expect(searchCatalog('   ')).toEqual({ restaurants: [], products: [] });
  });

  it('busca también en la descripción', () => {
    expect(searchCatalog('pepinillos').products.map((p) => p.id)).toEqual(['ruta-clasica']);
  });
});
