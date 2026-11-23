import { initialMenuItems } from './seed/menu';
import { initialInventory } from './seed/inventory';
import { initialSuppliers } from './seed/suppliers';
import { initialOrders } from './seed/orders';
import { initialPurchases } from './seed/purchases';
import { initialPayments, initialSavedPaymentMethods } from './seed/payments';
import { initialNotifications } from './seed/notifications';
import { initialProfile } from './seed/profile';
import {
  MenuItem,
  InventoryItem,
  Supplier,
  Order,
  GroceryPurchase,
  PaymentTransaction,
  SavedPaymentMethod,
  NotificationItem,
  BusinessProfile,
  InventoryMovement,
} from '@/types';

export interface MiseDatabase {
  version: number;
  menuItems: MenuItem[];
  inventory: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  suppliers: Supplier[];
  orders: Order[];
  purchases: GroceryPurchase[];
  payments: PaymentTransaction[];
  savedPaymentMethods: SavedPaymentMethod[];
  notifications: NotificationItem[];
  profile: BusinessProfile;
  lastInitialized: string;
}

export const getInitialDatabase = (): MiseDatabase => {
  // Generate initial inventory movements corresponding to current stock
  const movements: InventoryMovement[] = initialInventory.map((item, index) => ({
    id: `MOV-INIT-${String(index + 1).padStart(3, '0')}`,
    inventoryItemId: item.id,
    itemName: item.name,
    changeAmount: item.currentStock,
    previousStock: 0,
    newStock: item.currentStock,
    reason: 'Manual Adjustment',
    timestamp: '2026-11-15T08:00:00Z',
    referenceId: 'INIT-AUDIT',
  }));

  return {
    version: 1,
    menuItems: JSON.parse(JSON.stringify(initialMenuItems)),
    inventory: JSON.parse(JSON.stringify(initialInventory)),
    inventoryMovements: movements,
    suppliers: JSON.parse(JSON.stringify(initialSuppliers)),
    orders: JSON.parse(JSON.stringify(initialOrders)),
    purchases: JSON.parse(JSON.stringify(initialPurchases)),
    payments: JSON.parse(JSON.stringify(initialPayments)),
    savedPaymentMethods: JSON.parse(JSON.stringify(initialSavedPaymentMethods)),
    notifications: JSON.parse(JSON.stringify(initialNotifications)),
    profile: JSON.parse(JSON.stringify(initialProfile)),
    lastInitialized: new Date().toISOString(),
  };
};
