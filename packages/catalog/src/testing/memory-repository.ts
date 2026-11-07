/** TEST-ONLY. Never import from app code: it would present invented data as real listings. */
import { NotFoundError } from '../loadable';
import type { ListingsRepository } from '../repository';
import type { Product } from '../types';

export function memoryRepository(products: Product[]): ListingsRepository {
  return {
    async search(p) {
      let r = products.filter((x) => x.status === 'active' && x.communityId === p.community);
      if (p.q) r = r.filter((x) => `${x.title} ${x.description}`.toLowerCase().includes(p.q.toLowerCase()));
      if (p.category) r = r.filter((x) => x.categorySlug === p.category);
      if (p.condition) r = r.filter((x) => x.condition === p.condition);
      if (p.minPrice != null) r = r.filter((x) => x.price >= p.minPrice!);
      if (p.maxPrice != null) r = r.filter((x) => x.price <= p.maxPrice!);
      r = [...r].sort((a, b) => p.sort === 'price_asc' ? a.price - b.price : p.sort === 'price_desc' ? b.price - a.price : b.createdAt.localeCompare(a.createdAt));
      const size = 24; const start = (p.page - 1) * size;
      return { items: r.slice(start, start + size), total: r.length, page: p.page, pageSize: size };
    },
    async getById(id) {
      const f = products.find((x) => x.id === id && x.status === 'active');
      if (!f) throw new NotFoundError('listing');
      return f;
    },
  };
}
