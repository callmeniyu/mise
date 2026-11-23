/**
 * Purchases Local Service
 * Handles transactional linking between purchases, suppliers, and inventory stock.
 */

import { storageService } from './storage.service';
import { GroceryPurchase, InventoryMovement } from '@/types';
import { notificationsService } from './notifications.service';

export const purchasesService = {
  getAll(): GroceryPurchase[] {
    const db = storageService.getDatabase();
    return db.purchases || [];
  },

  getById(id: string): GroceryPurchase | undefined {
    const list = this.getAll();
    return list.find((p) => p.id === id);
  },

  create(data: Omit<GroceryPurchase, 'id'>): GroceryPurchase {
    const db = storageService.getDatabase();
    const purchaseId = storageService.generateId('PUR');
    const quantity = Number(data.quantity) || 0;
    const unitPrice = Number(data.unitPrice) || 0;
    const cost = Number(data.cost) || quantity * unitPrice;

    const newPurchase: GroceryPurchase = {
      ...data,
      id: purchaseId,
      quantity,
      unitPrice,
      cost,
      status: data.status || 'Completed',
      purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
    };

    // 1. Match and update Inventory stock
    const matchedItem = db.inventory.find(
      (inv) =>
        (data.inventoryItemId && inv.id === data.inventoryItemId) ||
        inv.name.toLowerCase() === data.ingredient.trim().toLowerCase()
    );

    if (matchedItem) {
      newPurchase.inventoryItemId = matchedItem.id;
      const prevStock = matchedItem.currentStock;
      const newStock = prevStock + quantity;
      matchedItem.currentStock = newStock;
      matchedItem.lastUpdated = newPurchase.purchaseDate;

      // Add movement log
      const movement: InventoryMovement = {
        id: storageService.generateId('MOV'),
        inventoryItemId: matchedItem.id,
        itemName: matchedItem.name,
        changeAmount: quantity,
        previousStock: prevStock,
        newStock,
        reason: 'Purchase',
        timestamp: new Date().toISOString(),
        referenceId: purchaseId,
      };
      db.inventoryMovements = [movement, ...(db.inventoryMovements || [])];
    }

    // 2. Update Supplier total purchased
    const matchedSupplier = db.suppliers.find(
      (s) =>
        (data.supplierId && s.id === data.supplierId) ||
        s.name.toLowerCase() === data.supplier.trim().toLowerCase()
    );
    if (matchedSupplier) {
      newPurchase.supplierId = matchedSupplier.id;
      matchedSupplier.totalPurchased = (matchedSupplier.totalPurchased || 0) + cost;
    }

    // 3. Save purchase
    db.purchases = [newPurchase, ...(db.purchases || [])];
    storageService.saveDatabase(db);

    // 4. Create notification
    notificationsService.add({
      title: `Purchase Order Logged: ${newPurchase.ingredient}`,
      message: `${quantity} ${newPurchase.unit} purchased from ${newPurchase.supplier} (AED ${cost.toLocaleString()}).`,
      type: 'purchase',
      referenceType: 'Purchase',
      referenceId: purchaseId,
    });

    return newPurchase;
  },

  update(id: string, updates: Partial<GroceryPurchase>): GroceryPurchase {
    const db = storageService.getDatabase();
    const index = db.purchases.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Purchase ${id} not found`);
    }

    const current = db.purchases[index];
    const oldQty = current.quantity;
    const oldCost = current.cost;

    const newQty = updates.quantity !== undefined ? Number(updates.quantity) : oldQty;
    const unitPrice = updates.unitPrice !== undefined ? Number(updates.unitPrice) : current.unitPrice;
    const newCost = updates.cost !== undefined ? Number(updates.cost) : newQty * unitPrice;

    // Reconcile Inventory stock difference
    const targetItemId = updates.inventoryItemId || current.inventoryItemId;
    const matchedItem = db.inventory.find((inv) => inv.id === targetItemId);

    if (matchedItem) {
      const qtyDifference = newQty - oldQty;
      if (qtyDifference !== 0) {
        const prevStock = matchedItem.currentStock;
        const newStock = Math.max(0, prevStock + qtyDifference);
        matchedItem.currentStock = newStock;
        matchedItem.lastUpdated = new Date().toISOString().split('T')[0];

        const movement: InventoryMovement = {
          id: storageService.generateId('MOV'),
          inventoryItemId: matchedItem.id,
          itemName: matchedItem.name,
          changeAmount: qtyDifference,
          previousStock: prevStock,
          newStock,
          reason: 'Manual Adjustment',
          timestamp: new Date().toISOString(),
          referenceId: id,
        };
        db.inventoryMovements = [movement, ...(db.inventoryMovements || [])];
      }
    }

    // Reconcile supplier total
    const supplierId = updates.supplierId || current.supplierId;
    const matchedSupplier = db.suppliers.find((s) => s.id === supplierId);
    if (matchedSupplier) {
      const costDiff = newCost - oldCost;
      matchedSupplier.totalPurchased = Math.max(0, (matchedSupplier.totalPurchased || 0) + costDiff);
    }

    const updatedPurchase: GroceryPurchase = {
      ...current,
      ...updates,
      quantity: newQty,
      unitPrice,
      cost: newCost,
    };

    db.purchases[index] = updatedPurchase;
    storageService.saveDatabase(db);
    return updatedPurchase;
  },

  delete(id: string): boolean {
    const db = storageService.getDatabase();
    const purchase = db.purchases.find((p) => p.id === id);
    if (!purchase) return false;

    // Roll back inventory stock
    const matchedItem = db.inventory.find(
      (inv) =>
        (purchase.inventoryItemId && inv.id === purchase.inventoryItemId) ||
        inv.name.toLowerCase() === purchase.ingredient.trim().toLowerCase()
    );

    if (matchedItem) {
      const prevStock = matchedItem.currentStock;
      const newStock = Math.max(0, prevStock - purchase.quantity);
      matchedItem.currentStock = newStock;
      matchedItem.lastUpdated = new Date().toISOString().split('T')[0];

      const movement: InventoryMovement = {
        id: storageService.generateId('MOV'),
        inventoryItemId: matchedItem.id,
        itemName: matchedItem.name,
        changeAmount: -purchase.quantity,
        previousStock: prevStock,
        newStock,
        reason: 'Manual Adjustment',
        timestamp: new Date().toISOString(),
        referenceId: `DEL-${id}`,
      };
      db.inventoryMovements = [movement, ...(db.inventoryMovements || [])];
    }

    // Adjust supplier total
    const matchedSupplier = db.suppliers.find(
      (s) =>
        (purchase.supplierId && s.id === purchase.supplierId) ||
        s.name.toLowerCase() === purchase.supplier.trim().toLowerCase()
    );
    if (matchedSupplier) {
      matchedSupplier.totalPurchased = Math.max(
        0,
        (matchedSupplier.totalPurchased || 0) - purchase.cost
      );
    }

    db.purchases = db.purchases.filter((p) => p.id !== id);
    storageService.saveDatabase(db);
    return true;
  },

  calculateTotalSpent(): number {
    const purchases = this.getAll();
    return purchases.reduce((sum, p) => sum + p.cost, 0);
  },
};
