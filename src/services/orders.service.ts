/**
 * Orders Local Service
 * Handles order lifecycles, financial totals, line items, and status transitions.
 */

import { storageService } from './storage.service';
import { Order, OrderStatus } from '@/types';
import { notificationsService } from './notifications.service';

export const calculateOrderFinancials = (data: {
  guestCount?: number;
  pricePerHead?: number;
  totalValue?: number;
  advanceReceived?: number;
  items?: Array<{ quantity: number; unitPrice: number; totalPrice: number }>;
}): { totalValue: number; advanceReceived: number; remainingBalance: number } => {
  let calculatedTotal = 0;

  if (data.items && data.items.length > 0) {
    calculatedTotal = data.items.reduce((sum, item) => sum + (item.totalPrice || item.quantity * item.unitPrice), 0);
  } else if (data.guestCount && data.pricePerHead) {
    calculatedTotal = data.guestCount * data.pricePerHead;
  } else if (data.totalValue) {
    calculatedTotal = data.totalValue;
  }

  const advance = Math.max(0, Number(data.advanceReceived) || 0);
  const remaining = Math.max(0, calculatedTotal - advance);

  return {
    totalValue: calculatedTotal,
    advanceReceived: advance,
    remainingBalance: remaining,
  };
};

export const ordersService = {
  getAll(): Order[] {
    const db = storageService.getDatabase();
    return db.orders || [];
  },

  getById(id: string): Order | undefined {
    const orders = this.getAll();
    return orders.find((o) => o.id === id);
  },

  create(data: Omit<Order, 'id' | 'createdAt' | 'remainingBalance'> & { advanceReceived?: number; remainingBalance?: number }): Order {
    const db = storageService.getDatabase();
    const orderId = storageService.generateId('ORD-2026');
    const financials = calculateOrderFinancials(data);

    const newOrder: Order = {
      ...data,
      id: orderId,
      guestCount: Number(data.guestCount) || 1,
      pricePerHead: Number(data.pricePerHead) || 0,
      totalValue: financials.totalValue,
      advanceReceived: financials.advanceReceived,
      remainingBalance: financials.remainingBalance,
      status: data.status || 'Inquiry',
      createdAt: new Date().toISOString().split('T')[0],
      menuItems: data.menuItems || [],
      items: data.items || [],
    };

    db.orders = [newOrder, ...(db.orders || [])];
    storageService.saveDatabase(db);

    notificationsService.add({
      title: `New Order Created: ${newOrder.clientName}`,
      message: `${newOrder.eventType} for ${newOrder.guestCount} guests (Total: AED ${newOrder.totalValue.toLocaleString()}).`,
      type: 'order',
      referenceType: 'Order',
      referenceId: newOrder.id,
    });

    return newOrder;
  },

  update(id: string, updates: Partial<Order>): Order {
    const db = storageService.getDatabase();
    const index = db.orders.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`Order ${id} not found`);
    }

    const current = db.orders[index];
    const prevStatus = current.status;

    // Recalculate financials if line items, guestCount, pricePerHead, or advance changed
    const merged = { ...current, ...updates };
    const financials = calculateOrderFinancials({
      guestCount: merged.guestCount,
      pricePerHead: merged.pricePerHead,
      totalValue: updates.totalValue !== undefined ? updates.totalValue : merged.totalValue,
      advanceReceived: updates.advanceReceived !== undefined ? updates.advanceReceived : current.advanceReceived,
      items: merged.items,
    });

    const updatedOrder: Order = {
      ...merged,
      totalValue: financials.totalValue,
      advanceReceived: financials.advanceReceived,
      remainingBalance: financials.remainingBalance,
      updatedAt: new Date().toISOString(),
    };

    db.orders[index] = updatedOrder;
    storageService.saveDatabase(db);

    if (updates.status && updates.status !== prevStatus) {
      notificationsService.add({
        title: `Order Status Updated: ${updatedOrder.clientName}`,
        message: `Order ${updatedOrder.id} transitioned from "${prevStatus}" to "${updates.status}".`,
        type: 'order',
        referenceType: 'Order',
        referenceId: updatedOrder.id,
      });
    }

    return updatedOrder;
  },

  updateStatus(id: string, status: OrderStatus): Order {
    return this.update(id, { status });
  },

  delete(id: string): boolean {
    const db = storageService.getDatabase();
    db.orders = db.orders.filter((o) => o.id !== id);
    storageService.saveDatabase(db);
    return true;
  },
};
