/**
 * Inventory Local Service
 * Handles stock levels, low-stock threshold monitoring, and movement audits.
 */

import { storageService } from './storage.service';
import { InventoryItem, InventoryMovement, StockStatus } from '@/types';
import { notificationsService } from './notifications.service';

export const getStockStatus = (item: InventoryItem): StockStatus => {
  if (item.currentStock <= 0) return 'Out of Stock';
  if (item.currentStock <= item.minimumStock) return 'Low Stock';
  return 'In Stock';
};

export const inventoryService = {
  getAll(): InventoryItem[] {
    const db = storageService.getDatabase();
    return db.inventory || [];
  },

  getById(id: string): InventoryItem | undefined {
    const items = this.getAll();
    return items.find((i) => i.id === id);
  },

  getLowStock(): InventoryItem[] {
    const items = this.getAll();
    return items.filter((i) => i.currentStock <= i.minimumStock);
  },

  getMovements(itemId?: string): InventoryMovement[] {
    const db = storageService.getDatabase();
    const movements = db.inventoryMovements || [];
    if (!itemId) return movements;
    return movements.filter((m) => m.inventoryItemId === itemId);
  },

  create(data: Omit<InventoryItem, 'id' | 'lastUpdated'>): InventoryItem {
    const db = storageService.getDatabase();
    const newItem: InventoryItem = {
      ...data,
      id: storageService.generateId('INV'),
      currentStock: Number(data.currentStock) || 0,
      minimumStock: Number(data.minimumStock) || 0,
      costPerUnit: Number(data.costPerUnit) || 0,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    db.inventory = [newItem, ...(db.inventory || [])];

    // Log initial stock movement if currentStock > 0
    if (newItem.currentStock > 0) {
      const movement: InventoryMovement = {
        id: storageService.generateId('MOV'),
        inventoryItemId: newItem.id,
        itemName: newItem.name,
        changeAmount: newItem.currentStock,
        previousStock: 0,
        newStock: newItem.currentStock,
        reason: 'Manual Adjustment',
        timestamp: new Date().toISOString(),
      };
      db.inventoryMovements = [movement, ...(db.inventoryMovements || [])];
    }

    storageService.saveDatabase(db);
    return newItem;
  },

  update(id: string, updates: Partial<InventoryItem>): InventoryItem {
    const db = storageService.getDatabase();
    const index = db.inventory.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Inventory item ${id} not found`);
    }

    const current = db.inventory[index];
    const updated: InventoryItem = {
      ...current,
      ...updates,
      currentStock: updates.currentStock !== undefined ? Number(updates.currentStock) : current.currentStock,
      minimumStock: updates.minimumStock !== undefined ? Number(updates.minimumStock) : current.minimumStock,
      costPerUnit: updates.costPerUnit !== undefined ? Number(updates.costPerUnit) : current.costPerUnit,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    db.inventory[index] = updated;
    storageService.saveDatabase(db);
    return updated;
  },

  adjustStock(
    id: string,
    delta: number,
    reason: InventoryMovement['reason'] = 'Manual Adjustment',
    referenceId?: string
  ): InventoryItem {
    const db = storageService.getDatabase();
    const item = db.inventory.find((i) => i.id === id);
    if (!item) {
      throw new Error(`Inventory item ${id} not found`);
    }

    const previousStock = item.currentStock;
    const newStock = Math.max(0, previousStock + delta);
    item.currentStock = newStock;
    item.lastUpdated = new Date().toISOString().split('T')[0];

    const movement: InventoryMovement = {
      id: storageService.generateId('MOV'),
      inventoryItemId: item.id,
      itemName: item.name,
      changeAmount: delta,
      previousStock,
      newStock,
      reason,
      timestamp: new Date().toISOString(),
      referenceId,
    };

    db.inventoryMovements = [movement, ...(db.inventoryMovements || [])];

    // Low stock trigger notification if falls below minimum
    if (newStock <= item.minimumStock && previousStock > item.minimumStock) {
      notificationsService.add({
        title: `Low Stock Alert: ${item.name}`,
        message: `${item.name} stock fell to ${newStock} ${item.unit} (minimum: ${item.minimumStock} ${item.unit}).`,
        type: 'alert',
        referenceType: 'Inventory',
        referenceId: item.id,
      });
    }

    storageService.saveDatabase(db);
    return item;
  },

  delete(id: string): boolean {
    const db = storageService.getDatabase();
    db.inventory = db.inventory.filter((i) => i.id !== id);
    storageService.saveDatabase(db);
    return true;
  },

  calculateTotalInventoryValue(): number {
    const items = this.getAll();
    return items.reduce((sum, item) => sum + item.currentStock * item.costPerUnit, 0);
  },
};
