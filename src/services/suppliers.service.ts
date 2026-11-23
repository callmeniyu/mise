/**
 * Suppliers Local Service
 */

import { storageService } from './storage.service';
import { Supplier } from '@/types';

export const suppliersService = {
  getAll(): Supplier[] {
    const db = storageService.getDatabase();
    return db.suppliers || [];
  },

  getById(id: string): Supplier | undefined {
    const list = this.getAll();
    return list.find((s) => s.id === id);
  },

  create(data: Omit<Supplier, 'id' | 'createdAt' | 'activeOrdersCount' | 'totalPurchased'>): Supplier {
    const db = storageService.getDatabase();
    const newSupplier: Supplier = {
      ...data,
      id: storageService.generateId('SUP'),
      activeOrdersCount: 0,
      totalPurchased: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    db.suppliers = [newSupplier, ...(db.suppliers || [])];
    storageService.saveDatabase(db);
    return newSupplier;
  },

  update(id: string, updates: Partial<Supplier>): Supplier {
    const db = storageService.getDatabase();
    const index = db.suppliers.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Supplier ${id} not found`);
    }

    const updated = { ...db.suppliers[index], ...updates };
    db.suppliers[index] = updated;
    storageService.saveDatabase(db);
    return updated;
  },

  delete(id: string): { success: boolean; message?: string } {
    const db = storageService.getDatabase();
    // Check if supplier is linked to purchases
    const linkedPurchases = (db.purchases || []).filter(
      (p) => p.supplierId === id || p.supplier === db.suppliers.find((s) => s.id === id)?.name
    );

    if (linkedPurchases.length > 0) {
      return {
        success: false,
        message: `Cannot delete supplier with ${linkedPurchases.length} associated purchase orders. Supplier is preserved for audit history.`,
      };
    }

    db.suppliers = db.suppliers.filter((s) => s.id !== id);
    storageService.saveDatabase(db);
    return { success: true };
  },
};
