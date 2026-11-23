/**
 * Global Search Local Service
 */

import { storageService } from './storage.service';

export interface SearchResults {
  orders: Array<{ id: string; title: string; subtitle: string; link: string }>;
  menuItems: Array<{ id: string; title: string; subtitle: string; link: string }>;
  inventory: Array<{ id: string; title: string; subtitle: string; link: string }>;
  suppliers: Array<{ id: string; title: string; subtitle: string; link: string }>;
}

export const searchService = {
  search(query: string): SearchResults {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) {
      return { orders: [], menuItems: [], inventory: [], suppliers: [] };
    }

    const db = storageService.getDatabase();

    const orders = (db.orders || [])
      .filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.clientName.toLowerCase().includes(q) ||
          o.eventType.toLowerCase().includes(q) ||
          o.menuItems.some((m) => m.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        title: o.clientName,
        subtitle: `${o.eventType} • ${o.guestCount} guests • AED ${o.totalValue.toLocaleString()}`,
        link: '/orders',
      }));

    const menuItems = (db.menuItems || [])
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map((m) => ({
        id: m.id,
        title: m.name,
        subtitle: `${m.category} • AED ${m.sellingPrice} (Cost: AED ${m.costPerServing})`,
        link: '/menu',
      }));

    const inventory = (db.inventory || [])
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.supplierName.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((i) => ({
        id: i.id,
        title: i.name,
        subtitle: `${i.currentStock} ${i.unit} in stock • ${i.category}`,
        link: '/inventory',
      }));

    const suppliers = (db.suppliers || [])
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        title: s.name,
        subtitle: `${s.category} • ${s.city} • ${s.phone}`,
        link: '/purchases',
      }));

    return { orders, menuItems, inventory, suppliers };
  },
};
