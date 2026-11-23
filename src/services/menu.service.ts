/**
 * Menu & Costing Local Service
 */

import { storageService } from './storage.service';
import { MenuItem } from '@/types';

export const calculateMargin = (cost: number, price: number): number => {
  if (price <= 0) return 0;
  const margin = ((price - cost) / price) * 100;
  return Math.round(margin * 10) / 10;
};

export const menuService = {
  getAll(): MenuItem[] {
    const db = storageService.getDatabase();
    return db.menuItems || [];
  },

  getById(id: string): MenuItem | undefined {
    const items = this.getAll();
    return items.find((i) => i.id === id);
  },

  create(data: Omit<MenuItem, 'id' | 'marginPercent'> & { marginPercent?: number }): MenuItem {
    const db = storageService.getDatabase();
    const cost = Number(data.costPerServing) || 0;
    const price = Number(data.sellingPrice) || 0;
    const margin = calculateMargin(cost, price);

    const newItem: MenuItem = {
      ...data,
      id: storageService.generateId('MENU'),
      costPerServing: cost,
      sellingPrice: price,
      marginPercent: margin,
      ingredients: data.ingredients || [],
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
    };

    db.menuItems = [newItem, ...(db.menuItems || [])];
    storageService.saveDatabase(db);
    return newItem;
  },

  update(id: string, updates: Partial<MenuItem>): MenuItem {
    const db = storageService.getDatabase();
    const index = db.menuItems.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Menu item with ID ${id} not found`);
    }

    const current = db.menuItems[index];
    const cost = updates.costPerServing !== undefined ? Number(updates.costPerServing) : current.costPerServing;
    const price = updates.sellingPrice !== undefined ? Number(updates.sellingPrice) : current.sellingPrice;
    const margin = calculateMargin(cost, price);

    const updatedItem: MenuItem = {
      ...current,
      ...updates,
      costPerServing: cost,
      sellingPrice: price,
      marginPercent: margin,
    };

    db.menuItems[index] = updatedItem;
    storageService.saveDatabase(db);
    return updatedItem;
  },

  delete(id: string): boolean {
    const db = storageService.getDatabase();
    db.menuItems = db.menuItems.filter((i) => i.id !== id);
    storageService.saveDatabase(db);
    return true;
  },
};
