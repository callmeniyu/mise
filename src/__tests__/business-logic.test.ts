import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '@/services/storage.service';
import { ordersService, calculateOrderFinancials } from '@/services/orders.service';
import { purchasesService } from '@/services/purchases.service';
import { paymentsService } from '@/services/payments.service';
import { inventoryService, getStockStatus } from '@/services/inventory.service';
import { menuService, calculateMargin } from '@/services/menu.service';
import { dashboardService } from '@/services/dashboard.service';

describe('Mise Business Logic & Cross-Module Integrity', () => {
  beforeEach(() => {
    storageService.resetToSeed();
  });

  describe('Order Financial Calculations', () => {
    it('calculates total from guest count and price per head', () => {
      const result = calculateOrderFinancials({
        guestCount: 200,
        pricePerHead: 3000,
        advanceReceived: 150000,
      });

      expect(result.totalValue).toBe(600000);
      expect(result.advanceReceived).toBe(150000);
      expect(result.remainingBalance).toBe(450000);
    });

    it('calculates total from line items if provided', () => {
      const result = calculateOrderFinancials({
        items: [
          { quantity: 10, unitPrice: 500, totalPrice: 5000 },
          { quantity: 5, unitPrice: 800, totalPrice: 4000 },
        ],
        advanceReceived: 3000,
      });

      expect(result.totalValue).toBe(9000);
      expect(result.advanceReceived).toBe(3000);
      expect(result.remainingBalance).toBe(6000);
    });

    it('creates an order and stores calculated balance', () => {
      const order = ordersService.create({
        clientName: 'Test Royal Banquet',
        clientType: 'Wedding',
        eventType: 'Wedding',
        eventDate: '2026-12-25',
        guestCount: 100,
        pricePerHead: 2000,
        totalValue: 200000,
        advanceReceived: 50000,
        menuItems: ['Saffron Silk Biryani'],
        status: 'Confirmed',
      });

      expect(order.id).toBeDefined();
      expect(order.totalValue).toBe(200000);
      expect(order.advanceReceived).toBe(50000);
      expect(order.remainingBalance).toBe(150000);
    });
  });

  describe('Payment Simulation & Balance Reconciliation', () => {
    it('processes simulated payment and deducts order remaining balance', () => {
      const order = ordersService.create({
        clientName: 'Payment Test Client',
        clientType: 'Corporate',
        eventType: 'Corporate Lunch',
        eventDate: '2026-12-15',
        guestCount: 50,
        pricePerHead: 2000,
        totalValue: 100000,
        advanceReceived: 20000,
        menuItems: [],
        status: 'Confirmed',
      });

      expect(order.remainingBalance).toBe(80000);

      const payResult = paymentsService.processPayment({
        orderId: order.id,
        amount: 30000,
        paymentMethod: 'Card',
      });

      expect(payResult.success).toBe(true);
      expect(payResult.transaction.status).toBe('Successful');

      const updatedOrder = ordersService.getById(order.id);
      expect(updatedOrder?.advanceReceived).toBe(50000);
      expect(updatedOrder?.remainingBalance).toBe(50000);
    });

    it('rejects payments exceeding the outstanding balance', () => {
      const order = ordersService.create({
        clientName: 'Overpayment Safeguard Client',
        clientType: 'Individual',
        eventType: 'Private Event',
        eventDate: '2026-12-20',
        guestCount: 10,
        pricePerHead: 2000,
        totalValue: 20000,
        advanceReceived: 15000,
        menuItems: [],
        status: 'Confirmed',
      });

      expect(order.remainingBalance).toBe(5000);

      const payResult = paymentsService.processPayment({
        orderId: order.id,
        amount: 8000, // exceeds 5,000
        paymentMethod: 'Bank Transfer',
      });

      expect(payResult.success).toBe(false);
      expect(payResult.error).toContain('exceeds the outstanding balance');
    });

    it('simulates refund and restores order remaining balance', () => {
      const order = ordersService.create({
        clientName: 'Refund Test Client',
        clientType: 'Family',
        eventType: 'Family Celebration',
        eventDate: '2026-12-22',
        guestCount: 20,
        pricePerHead: 2500,
        totalValue: 50000,
        advanceReceived: 0,
        menuItems: [],
        status: 'Inquiry',
      });

      const payResult = paymentsService.processPayment({
        orderId: order.id,
        amount: 25000,
        paymentMethod: 'Card',
      });
      expect(payResult.success).toBe(true);

      const postPayOrder = ordersService.getById(order.id);
      expect(postPayOrder?.advanceReceived).toBe(25000);
      expect(postPayOrder?.remainingBalance).toBe(25000);

      // Now refund
      const refundResult = paymentsService.refundPayment(payResult.transaction.id, 'Test refund');
      expect(refundResult.success).toBe(true);
      expect(refundResult.transaction?.status).toBe('Refunded');

      const postRefundOrder = ordersService.getById(order.id);
      expect(postRefundOrder?.advanceReceived).toBe(0);
      expect(postRefundOrder?.remainingBalance).toBe(50000);
    });
  });

  describe('Purchase to Inventory Transactional Sync', () => {
    it('increases inventory stock upon logging a purchase', () => {
      const targetItem = inventoryService.getAll()[0];
      const initialStock = targetItem.currentStock;
      const purchaseQty = 40;

      const purchase = purchasesService.create({
        supplier: targetItem.supplierName,
        supplierId: targetItem.supplierId,
        ingredient: targetItem.name,
        inventoryItemId: targetItem.id,
        quantity: purchaseQty,
        unit: targetItem.unit,
        unitPrice: targetItem.costPerUnit,
        cost: purchaseQty * targetItem.costPerUnit,
        purchaseDate: '2026-11-23',
      });

      expect(purchase.id).toBeDefined();

      const updatedItem = inventoryService.getById(targetItem.id);
      expect(updatedItem?.currentStock).toBe(initialStock + purchaseQty);

      // Verify movement history log was created
      const movements = inventoryService.getMovements(targetItem.id);
      expect(movements.some((m) => m.referenceId === purchase.id && m.reason === 'Purchase')).toBe(true);
    });

    it('rolls back inventory stock upon purchase deletion', () => {
      const targetItem = inventoryService.getAll()[0];
      const initialStock = targetItem.currentStock;
      const purchaseQty = 30;

      const purchase = purchasesService.create({
        supplier: targetItem.supplierName,
        supplierId: targetItem.supplierId,
        ingredient: targetItem.name,
        inventoryItemId: targetItem.id,
        quantity: purchaseQty,
        unit: targetItem.unit,
        unitPrice: targetItem.costPerUnit,
        cost: purchaseQty * targetItem.costPerUnit,
        purchaseDate: '2026-11-23',
      });

      expect(inventoryService.getById(targetItem.id)?.currentStock).toBe(initialStock + purchaseQty);

      // Delete purchase
      purchasesService.delete(purchase.id);

      expect(inventoryService.getById(targetItem.id)?.currentStock).toBe(initialStock);
    });
  });

  describe('Stock Adjustments & Low Stock Triggers', () => {
    it('correctly reports stock status', () => {
      expect(
        getStockStatus({
          id: '1',
          name: 'Item',
          category: 'Cat',
          unit: 'kg',
          currentStock: 50,
          minimumStock: 20,
          supplierName: 'Sup',
          costPerUnit: 100,
          lastUpdated: '2026-11-23',
        })
      ).toBe('In Stock');

      expect(
        getStockStatus({
          id: '2',
          name: 'Item',
          category: 'Cat',
          unit: 'kg',
          currentStock: 15,
          minimumStock: 20,
          supplierName: 'Sup',
          costPerUnit: 100,
          lastUpdated: '2026-11-23',
        })
      ).toBe('Low Stock');

      expect(
        getStockStatus({
          id: '3',
          name: 'Item',
          category: 'Cat',
          unit: 'kg',
          currentStock: 0,
          minimumStock: 20,
          supplierName: 'Sup',
          costPerUnit: 100,
          lastUpdated: '2026-11-23',
        })
      ).toBe('Out of Stock');
    });

    it('logs inventory movement when manual adjustment is made', () => {
      const item = inventoryService.getAll()[1];
      const prevStock = item.currentStock;

      inventoryService.adjustStock(item.id, -5, 'Spoilage / Wastage');
      const updated = inventoryService.getById(item.id);
      expect(updated?.currentStock).toBe(prevStock - 5);

      const movements = inventoryService.getMovements(item.id);
      expect(movements[0].reason).toBe('Spoilage / Wastage');
      expect(movements[0].changeAmount).toBe(-5);
    });
  });

  describe('Menu Costing & Margin Calculations', () => {
    it('calculates profit margin accurately', () => {
      // cost 250, price 500 -> ((500-250)/500) * 100 = 50%
      expect(calculateMargin(250, 500)).toBe(50);

      // cost 280, price 650 -> ((650-280)/650) * 100 = 56.9%
      expect(calculateMargin(280, 650)).toBe(56.9);
    });

    it('creates dish and stores calculated margin', () => {
      const dish = menuService.create({
        name: 'Test Saffron Dish',
        category: 'Rice',
        costPerServing: 300,
        sellingPrice: 750,
        ingredients: ['Rice', 'Saffron'],
        isAvailable: true,
      });

      expect(dish.id).toBeDefined();
      expect(dish.marginPercent).toBe(60);
    });
  });

  describe('Dashboard Analytics Engine', () => {
    it('derives stats dynamically from database records', () => {
      const stats = dashboardService.getStats();
      expect(stats.totalOrders).toBeGreaterThanOrEqual(20);
      expect(stats.stockValue).toBeGreaterThan(0);
      expect(stats.totalRevenue).toBeGreaterThan(0);
      expect(stats.pendingPayments).toBeGreaterThan(0);
    });
  });
});
