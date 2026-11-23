/**
 * Dashboard & Analytics Local Service
 * Derives real-time operational statistics directly from the stored local database.
 */

import { storageService } from './storage.service';
import { DashboardStats, Order } from '@/types';

export interface MonthlyTrendData {
  month: string;
  revenue: number;
  purchases: number;
  profit: number;
}

export interface BestSellerItem {
  name: string;
  category: string;
  portionsSold: number;
  revenue: number;
  marginPercent: number;
}

export const dashboardService = {
  getStats(): DashboardStats {
    const db = storageService.getDatabase();
    const orders = db.orders || [];
    const inventory = db.inventory || [];
    const purchases = db.purchases || [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's orders
    const todaysOrders = orders.filter((o) => o.eventDate === todayStr).length;

    // Upcoming events (today or later, not closed)
    const upcomingEvents = orders.filter(
      (o) => o.eventDate >= todayStr && o.status !== 'Closed'
    ).length;

    // Inventory value
    const stockValue = inventory.reduce((sum, item) => sum + item.currentStock * item.costPerUnit, 0);

    // Low stock count
    const lowStockCount = inventory.filter((item) => item.currentStock <= item.minimumStock).length;

    // Total Revenue (all orders or delivered/closed orders + advance received)
    // In Mise financial model: Delivered or Closed orders count as recognized revenue, plus advances collected
    const deliveredOrders = orders.filter((o) => o.status === 'Delivered' || o.status === 'Closed');
    const totalRecognizedRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalValue, 0);

    // Total actual revenue from confirmed + delivered + in progress orders
    const totalOrderValue = orders.reduce((sum, o) => sum + o.totalValue, 0);

    // Pending payments across all active orders
    const pendingPayments = orders.reduce((sum, o) => sum + (o.remainingBalance || 0), 0);

    // Monthly figures (current month: Nov 2026 or current wall-clock month)
    const currentMonthPrefix = todayStr.substring(0, 7); // e.g. "2026-11"
    const currentMonthOrders = orders.filter((o) => o.eventDate.startsWith(currentMonthPrefix));
    const monthlyRevenue = currentMonthOrders.reduce((sum, o) => sum + o.totalValue, 0);

    // Monthly purchases
    const currentMonthPurchases = purchases.filter((p) => p.purchaseDate.startsWith(currentMonthPrefix));
    const monthlyCOGS = currentMonthPurchases.reduce((sum, p) => sum + p.cost, 0);
    const monthlyProfit = Math.max(0, monthlyRevenue - monthlyCOGS);

    return {
      todaysOrders,
      upcomingEvents,
      stockValue,
      monthlyProfit,
      monthlyRevenue,
      totalRevenue: totalOrderValue,
      pendingPayments,
      lowStockCount,
      totalOrders: orders.length,
      deliveredOrders: deliveredOrders.length,
    };
  },

  getMonthlyTrends(monthsCount = 6): MonthlyTrendData[] {
    const db = storageService.getDatabase();
    const orders = db.orders || [];
    const purchases = db.purchases || [];

    const result: MonthlyTrendData[] = [];
    const today = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });

      const monthOrders = orders.filter((o) => o.eventDate.startsWith(monthPrefix));
      const monthPurchases = purchases.filter((p) => p.purchaseDate.startsWith(monthPrefix));

      const revenue = monthOrders.reduce((sum, o) => sum + o.totalValue, 0);
      const purchaseCost = monthPurchases.reduce((sum, p) => sum + p.cost, 0);
      const profit = Math.max(0, revenue - purchaseCost);

      result.push({
        month: monthLabel,
        revenue,
        purchases: purchaseCost,
        profit,
      });
    }

    return result;
  },

  getBestSellers(): BestSellerItem[] {
    const db = storageService.getDatabase();
    const orders = db.orders || [];
    const menuItems = db.menuItems || [];

    const portionCounts: Record<string, { portions: number; revenue: number }> = {};

    orders.forEach((order) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          if (!portionCounts[item.name]) {
            portionCounts[item.name] = { portions: 0, revenue: 0 };
          }
          portionCounts[item.name].portions += item.quantity;
          portionCounts[item.name].revenue += item.totalPrice;
        });
      } else if (order.menuItems && order.menuItems.length > 0) {
        order.menuItems.forEach((name) => {
          if (!portionCounts[name]) {
            portionCounts[name] = { portions: 0, revenue: 0 };
          }
          portionCounts[name].portions += order.guestCount;
          portionCounts[name].revenue += order.guestCount * (order.pricePerHead / order.menuItems.length);
        });
      }
    });

    const items: BestSellerItem[] = Object.entries(portionCounts).map(([name, data]) => {
      const menuItem = menuItems.find((m) => m.name.toLowerCase() === name.toLowerCase());
      return {
        name,
        category: menuItem?.category || 'Main',
        portionsSold: data.portions,
        revenue: Math.round(data.revenue),
        marginPercent: menuItem?.marginPercent || 55,
      };
    });

    return items.sort((a, b) => b.portionsSold - a.portionsSold).slice(0, 5);
  },

  getRecentOrders(limit = 5): Order[] {
    const db = storageService.getDatabase();
    return (db.orders || []).slice(0, limit);
  },

  getUpcomingEvents(limit = 5): Order[] {
    const db = storageService.getDatabase();
    const todayStr = new Date().toISOString().split('T')[0];
    return (db.orders || [])
      .filter((o) => o.eventDate >= todayStr && o.status !== 'Closed')
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
      .slice(0, limit);
  },
};
