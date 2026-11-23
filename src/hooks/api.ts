/**
 * Custom React Hooks for Local Data Store
 * Powered by TanStack Query for cache invalidation and reactivity.
 * Calls browser-local services instead of HTTP API endpoints.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService } from '@/services/menu.service';
import { inventoryService } from '@/services/inventory.service';
import { purchasesService } from '@/services/purchases.service';
import { ordersService } from '@/services/orders.service';
import { suppliersService } from '@/services/suppliers.service';
import { paymentsService } from '@/services/payments.service';
import { notificationsService } from '@/services/notifications.service';
import { profileService } from '@/services/profile.service';
import { dashboardService } from '@/services/dashboard.service';
import { searchService } from '@/services/search.service';
import {
  MenuItem,
  InventoryItem,
  GroceryPurchase,
  Order,
  Supplier,
  PaymentTransaction,
  SavedPaymentMethod,
  OrderStatus,
  PaymentMethodType,
} from '@/types';

// ============================================================================
// MENU ITEMS HOOKS
// ============================================================================

export const useMenuItems = () => {
  return useQuery<MenuItem[]>({
    queryKey: ['menuItems'],
    queryFn: async () => menuService.getAll(),
  });
};

export const useMenuItem = (id?: string) => {
  return useQuery<MenuItem | undefined>({
    queryKey: ['menuItem', id],
    queryFn: async () => (id ? menuService.getById(id) : undefined),
    enabled: !!id,
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation<MenuItem, Error, Parameters<typeof menuService.create>[0]>({
    mutationFn: async (data) => menuService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation<MenuItem, Error, { id: string; data: Partial<MenuItem> }>({
    mutationFn: async ({ id, data }) => menuService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['menuItem', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, string>({
    mutationFn: async (id: string) => menuService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

// ============================================================================
// INVENTORY HOOKS
// ============================================================================

export const useInventory = () => {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => inventoryService.getAll(),
  });
};

export const useLowStockItems = () => {
  return useQuery<InventoryItem[]>({
    queryKey: ['lowStockItems'],
    queryFn: async () => inventoryService.getLowStock(),
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation<InventoryItem, Error, Parameters<typeof inventoryService.create>[0]>({
    mutationFn: async (data) => inventoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation<InventoryItem, Error, { id: string; data: Partial<InventoryItem> }>({
    mutationFn: async ({ id, data }) => inventoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  return useMutation<InventoryItem, Error, { id: string; delta: number; reason?: any; referenceId?: string }>({
    mutationFn: async ({ id, delta, reason, referenceId }) =>
      inventoryService.adjustStock(id, delta, reason, referenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, string>({
    mutationFn: async (id: string) => inventoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

// ============================================================================
// PURCHASE HOOKS
// ============================================================================

export const usePurchases = () => {
  return useQuery<GroceryPurchase[]>({
    queryKey: ['purchases'],
    queryFn: async () => purchasesService.getAll(),
  });
};

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation<GroceryPurchase, Error, Parameters<typeof purchasesService.create>[0]>({
    mutationFn: async (data) => purchasesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useUpdatePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation<GroceryPurchase, Error, { id: string; data: Partial<GroceryPurchase> }>({
    mutationFn: async ({ id, data }) => purchasesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useDeletePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, string>({
    mutationFn: async (id: string) => purchasesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

// ============================================================================
// ORDER HOOKS
// ============================================================================

export const useOrders = () => {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => ordersService.getAll(),
  });
};

export const useOrderItems = () => {
  return useQuery({
    queryKey: ['orderItems'],
    queryFn: async () => {
      const orders = ordersService.getAll();
      const allItems: any[] = [];
      orders.forEach((o) => {
        if (o.items && o.items.length > 0) {
          allItems.push(...o.items);
        } else if (o.menuItems && o.menuItems.length > 0) {
          o.menuItems.forEach((name) => {
            allItems.push({
              item_name: name,
              quantity: o.guestCount,
              total_price: Math.round(o.guestCount * (o.pricePerHead / o.menuItems.length)),
            });
          });
        }
      });
      return allItems;
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, Parameters<typeof ordersService.create>[0]>({
    mutationFn: async (data) => ordersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderItems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, { id: string; data: Partial<Order> }>({
    mutationFn: async ({ id, data }) => ordersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderItems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, { id: string; status: OrderStatus }>({
    mutationFn: async ({ id, status }) => ordersService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, string>({
    mutationFn: async (id: string) => ordersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderItems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

// ============================================================================
// SEARCH HOOKS
// ============================================================================

export const useSearch = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return { orders: [], menuItems: [], inventory: [], suppliers: [] };
      }
      return searchService.search(query);
    },
    enabled: !!query && query.length >= 2,
  });
};

// ============================================================================
// USER/PROFILE HOOKS
// ============================================================================

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => profileService.getProfile(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof profileService.updateProfile>[0]) =>
      profileService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => dashboardService.getStats(),
  });
};

export const useMonthlyTrends = (months = 6) => {
  return useQuery({
    queryKey: ['monthlyTrends', months],
    queryFn: async () => dashboardService.getMonthlyTrends(months),
  });
};

export const useBestSellers = () => {
  return useQuery({
    queryKey: ['bestSellers'],
    queryFn: async () => dashboardService.getBestSellers(),
  });
};

// ============================================================================
// SUPPLIERS HOOKS
// ============================================================================

export const useSuppliers = () => {
  return useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => suppliersService.getAll(),
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation<Supplier, Error, Parameters<typeof suppliersService.create>[0]>({
    mutationFn: async (data) => suppliersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation<Supplier, Error, { id: string; data: Partial<Supplier> }>({
    mutationFn: async ({ id, data }) => suppliersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; message?: string }, Error, string>({
    mutationFn: async (id: string) => suppliersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

// ============================================================================
// PAYMENTS HOOKS
// ============================================================================

export const usePayments = () => {
  return useQuery<PaymentTransaction[]>({
    queryKey: ['payments'],
    queryFn: async () => paymentsService.getAll(),
  });
};

export const useSavedPaymentMethods = () => {
  return useQuery<SavedPaymentMethod[]>({
    queryKey: ['savedPaymentMethods'],
    queryFn: async () => paymentsService.getSavedPaymentMethods(),
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ReturnType<typeof paymentsService.processPayment>,
    Error,
    Parameters<typeof paymentsService.processPayment>[0]
  >({
    mutationFn: async (params) => paymentsService.processPayment(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useRefundPayment = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ReturnType<typeof paymentsService.refundPayment>,
    Error,
    { id: string; reason?: string }
  >({
    mutationFn: async ({ id, reason }) => paymentsService.refundPayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useAddSavedPaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation<SavedPaymentMethod, Error, Parameters<typeof paymentsService.addSavedPaymentMethod>[0]>({
    mutationFn: async (method) => paymentsService.addSavedPaymentMethod(method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPaymentMethods'] });
    },
  });
};

export const useDeleteSavedPaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, string>({
    mutationFn: async (id: string) => paymentsService.deleteSavedPaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPaymentMethods'] });
    },
  });
};
