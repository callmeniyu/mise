export type ClientType = 'Wedding' | 'Corporate' | 'Family' | 'Individual';
export type OrderStatus = 'Inquiry' | 'Confirmed' | 'In Progress' | 'Delivered' | 'Closed';
export type EventType = 'Wedding' | 'Corporate Lunch' | 'Private Event' | 'Catering Banquet' | 'Gala Dinner' | 'Family Celebration';
export type DishCategory = 'Main' | 'BBQ' | 'Rice' | 'Dessert' | 'Live Station' | 'Appetizer' | 'Beverage';
export type StockUnit = 'kg' | 'liter' | 'piece' | 'dozen' | 'pack' | 'gram' | 'tin';
export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export type PaymentStatus = 'Pending' | 'Successful' | 'Failed' | 'Refunded';
export type PaymentMethodType = 'Card' | 'Bank Transfer' | 'Cash' | 'Cheque';

export interface OrderItem {
  id: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientType: ClientType;
  eventDate: string;
  eventType: EventType;
  guestCount: number;
  pricePerHead: number;
  menuItems: string[]; // names for display convenience
  items?: OrderItem[]; // line items
  totalValue: number;
  advanceReceived: number;
  remainingBalance: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  category: DishCategory;
  costPerServing: number;
  sellingPrice: number;
  marginPercent: number;
  ingredients: string[];
  isAvailable: boolean;
  prepTimeMinutes?: number;
  isVegetarian?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: StockUnit;
  currentStock: number;
  minimumStock: number;
  supplierName: string;
  supplierId?: string;
  costPerUnit: number;
  expiryDate?: string;
  lastUpdated: string;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  itemName: string;
  changeAmount: number;
  previousStock: number;
  newStock: number;
  reason: 'Purchase' | 'Order Consumption' | 'Manual Adjustment' | 'Spoilage / Wastage';
  timestamp: string;
  referenceId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  category: string;
  activeOrdersCount?: number;
  totalPurchased?: number;
  createdAt: string;
}

export interface GroceryPurchase {
  id: string;
  purchaseDate: string;
  supplier: string;
  supplierId?: string;
  ingredient: string;
  inventoryItemId?: string;
  quantity: number;
  unit: StockUnit;
  cost: number;
  unitPrice: number;
  linkedOrderId?: string;
  notes?: string;
  status?: 'Completed' | 'Pending Delivery' | 'Cancelled';
}

export interface PaymentTransaction {
  id: string;
  referenceNumber: string;
  orderId?: string;
  clientName?: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  cardLast4?: string;
  cardBrand?: string;
  status: PaymentStatus;
  transactionDate: string;
  notes?: string;
  isSimulated: true;
}

export interface SavedPaymentMethod {
  id: string;
  cardBrand: 'Visa' | 'Mastercard' | 'Amex';
  cardLast4: string;
  cardExpMonth: number;
  cardExpYear: number;
  cardHolderName: string;
  isDefault: boolean;
  isDemo: true;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'inventory' | 'payment' | 'purchase' | 'alert';
  isRead: boolean;
  referenceType?: 'Order' | 'Inventory' | 'Payment' | 'Purchase';
  referenceId?: string;
  createdAt: string;
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  currency: string;
  currencySymbol: string;
  taxNumber?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff';
  isActive: boolean;
}

export interface DashboardStats {
  todaysOrders: number;
  upcomingEvents: number;
  stockValue: number;
  monthlyProfit: number;
  monthlyRevenue: number;
  totalRevenue: number;
  pendingPayments: number;
  lowStockCount: number;
  totalOrders: number;
  deliveredOrders: number;
}
