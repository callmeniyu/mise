import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Banknote,
  Edit,
  Trash2,
  PlusCircle,
  MinusCircle,
  History,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import {
  useInventory,
  useLowStockItems,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useUpdateStock,
  useDeleteInventoryItem,
  useSuppliers,
} from '@/hooks/api';
import { inventoryService, getStockStatus } from '@/services/inventory.service';
import { InventoryItem, StockUnit, InventoryMovement } from '@/types';
import { toast } from 'sonner';

const STOCK_UNITS: StockUnit[] = ['kg', 'liter', 'piece', 'dozen', 'pack', 'gram', 'tin'];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isMovementsOpen, setIsMovementsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<InventoryItem | null>(null);

  // Stock Adjustment Form
  const [adjustAmount, setAdjustAmount] = useState<number>(5);
  const [adjustDirection, setAdjustDirection] = useState<'add' | 'deduct'>('add');
  const [adjustReason, setAdjustReason] = useState<InventoryMovement['reason']>('Manual Adjustment');

  // Item Form
  const [formData, setFormData] = useState({
    name: '',
    category: 'Grains & Flour',
    unit: 'kg' as StockUnit,
    currentStock: 50,
    minimumStock: 20,
    supplierName: '',
    supplierId: '',
    costPerUnit: 350,
    expiryDate: '',
  });

  const { data: inventory = [], isLoading } = useInventory();
  const { data: lowStock = [] } = useLowStockItems();
  const { data: suppliers = [] } = useSuppliers();

  const createItemMutation = useCreateInventoryItem();
  const updateItemMutation = useUpdateInventoryItem();
  const updateStockMutation = useUpdateStock();
  const deleteItemMutation = useDeleteInventoryItem();

  // Categories list derived from inventory
  const categories = Array.from(new Set(inventory.map((i) => i.category || 'General'))).sort();

  // Filtered Inventory
  const filteredItems = inventory.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;

    const status = getStockStatus(item);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'in_stock' && status === 'In Stock') ||
      (statusFilter === 'low_stock' && status === 'Low Stock') ||
      (statusFilter === 'out_of_stock' && status === 'Out of Stock');

    return matchSearch && matchCategory && matchStatus;
  });

  // Financial Stats
  const totalStockValue = inventory.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);
  const lowStockCount = lowStock.length;
  const outOfStockCount = inventory.filter((i) => i.currentStock === 0).length;

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: 'Vegetables & Herbs',
      unit: 'kg',
      currentStock: 25,
      minimumStock: 10,
      supplierName: suppliers[0]?.name || 'Fresh Grove Organic Produce',
      supplierId: suppliers[0]?.id || '',
      costPerUnit: 250,
      expiryDate: '',
    });
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Ingredient name is required');
      return;
    }

    createItemMutation.mutate(
      {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        currentStock: formData.currentStock,
        minimumStock: formData.minimumStock,
        supplierName: formData.supplierName,
        supplierId: formData.supplierId,
        costPerUnit: formData.costPerUnit,
        expiryDate: formData.expiryDate || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Inventory stock item added');
          setIsAddOpen(false);
        },
        onError: () => toast.error('Failed to add item'),
      }
    );
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      supplierName: item.supplierName,
      supplierId: item.supplierId || '',
      costPerUnit: item.costPerUnit,
      expiryDate: item.expiryDate || '',
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    updateItemMutation.mutate(
      {
        id: selectedItem.id,
        data: {
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          currentStock: formData.currentStock,
          minimumStock: formData.minimumStock,
          supplierName: formData.supplierName,
          supplierId: formData.supplierId,
          costPerUnit: formData.costPerUnit,
          expiryDate: formData.expiryDate || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Inventory item updated');
          setIsEditOpen(false);
          setSelectedItem(null);
        },
        onError: () => toast.error('Failed to update item'),
      }
    );
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustAmount(5);
    setAdjustDirection('add');
    setAdjustReason('Manual Adjustment');
    setIsAdjustOpen(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const delta = adjustDirection === 'add' ? adjustAmount : -adjustAmount;

    updateStockMutation.mutate(
      {
        id: selectedItem.id,
        delta,
        reason: adjustReason,
      },
      {
        onSuccess: () => {
          toast.success(`Stock level adjusted for ${selectedItem.name}`);
          setIsAdjustOpen(false);
          setSelectedItem(null);
        },
        onError: () => toast.error('Failed to adjust stock level'),
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmItem) return;
    deleteItemMutation.mutate(deleteConfirmItem.id, {
      onSuccess: () => {
        toast.success(`"${deleteConfirmItem.name}" removed from inventory`);
        setDeleteConfirmItem(null);
      },
      onError: () => toast.error('Failed to delete item'),
    });
  };

  const itemMovements = selectedItem ? inventoryService.getMovements(selectedItem.id) : [];

  return (
    <DashboardLayout
      title="Inventory & Stock Control"
      subtitle="Raw ingredients, stock valuation, threshold alerts, and audit logs"
      actions={
        <Button
          onClick={handleOpenAdd}
          className="bg-terracotta hover:bg-terracotta/90 text-white shadow-xs text-xs h-9"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Ingredient
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Total Valuation
              </p>
              <p className="font-display text-2xl font-bold text-foreground mt-1">
                AED {totalStockValue.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-charcoal text-white flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>

          <div className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Low Stock Thresholds
              </p>
              <p className="font-display text-2xl font-bold text-warning mt-1">{lowStockCount} items</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning-light text-warning flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Depleted / Out of Stock
              </p>
              <p className="font-display text-2xl font-bold text-destructive mt-1">
                {outOfStockCount} items
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-destructive-light text-destructive flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card-premium p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search ingredients or suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-card text-xs border-border"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs bg-card border-border">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-card border-border">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs font-medium text-muted-foreground self-end sm:self-center">
            Showing <span className="font-bold text-foreground">{filteredItems.length}</span> of{' '}
            {inventory.length} ingredients
          </p>
        </div>

        {/* Inventory Data Table */}
        <div className="card-premium overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/60">
              <TableRow className="border-border">
                <TableHead className="font-bold text-xs text-foreground py-3.5">Ingredient Name</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Category</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Current Stock</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Min Threshold</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Cost / Unit</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Total Valuation</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Supplier</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Status</TableHead>
                <TableHead className="text-right font-bold text-xs text-foreground pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                    Loading inventory ledger...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-xs text-muted-foreground">
                    No items match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const status = getStockStatus(item);
                  const itemValue = item.currentStock * item.costPerUnit;

                  return (
                    <TableRow key={item.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-xs text-foreground">{item.name}</p>
                          <span className="text-[10px] font-mono text-muted-foreground">{item.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-foreground font-medium">
                        {item.category}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-foreground font-mono">
                        {item.currentStock} {item.unit}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {item.minimumStock} {item.unit}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        AED {item.costPerUnit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        AED {itemValue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-secondary-foreground truncate max-w-[140px]">
                        {item.supplierName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'text-[10px] font-semibold shadow-none',
                            status === 'In Stock'
                              ? 'bg-sage-light text-success border-sage/40'
                              : status === 'Low Stock'
                              ? 'bg-warning-light text-warning border-warning/40'
                              : 'bg-destructive-light text-destructive border-destructive/40'
                          )}
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-secondary text-foreground"
                            onClick={() => handleOpenAdjust(item)}
                            title="Adjust Stock Quantity (+/-)"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-sage" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-secondary"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsMovementsOpen(true);
                            }}
                            title="Stock Movement Log"
                          >
                            <History className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-secondary"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Item"
                          >
                            <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive-light text-destructive"
                            onClick={() => setDeleteConfirmItem(item)}
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Adjust Stock Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="max-w-md p-6">
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">
                Adjust Stock: {selectedItem?.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Current Level: {selectedItem?.currentStock} {selectedItem?.unit}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={adjustDirection === 'add' ? 'default' : 'outline'}
                  onClick={() => setAdjustDirection('add')}
                  className={cn(
                    'h-9 text-xs',
                    adjustDirection === 'add' ? 'bg-sage text-charcoal font-bold' : 'border-border'
                  )}
                >
                  + Restock / Add
                </Button>
                <Button
                  type="button"
                  variant={adjustDirection === 'deduct' ? 'default' : 'outline'}
                  onClick={() => setAdjustDirection('deduct')}
                  className={cn(
                    'h-9 text-xs',
                    adjustDirection === 'deduct'
                      ? 'bg-destructive text-white font-bold'
                      : 'border-border'
                  )}
                >
                  - Deduct / Spoilage
                </Button>
              </div>

              <div>
                <Label htmlFor="adjustQty" className="font-semibold text-xs">
                  Quantity ({selectedItem?.unit})
                </Label>
                <Input
                  id="adjustQty"
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="mt-1 h-9 bg-card text-xs font-mono font-bold"
                />
              </div>

              <div>
                <Label htmlFor="adjustReason" className="font-semibold text-xs">Reason for Audit Log</Label>
                <Select
                  value={adjustReason}
                  onValueChange={(val: any) => setAdjustReason(val)}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manual Adjustment">Manual Audit Correction</SelectItem>
                    <SelectItem value="Purchase">Purchase Arrival</SelectItem>
                    <SelectItem value="Order Consumption">Event / Catering Prep</SelectItem>
                    <SelectItem value="Spoilage / Wastage">Wastage / Expiry Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-secondary/50 rounded-xl flex items-center justify-between text-xs">
                <span>Resulting Stock:</span>
                <span className="font-bold text-sm text-foreground">
                  {selectedItem
                    ? Math.max(
                        0,
                        adjustDirection === 'add'
                          ? selectedItem.currentStock + adjustAmount
                          : selectedItem.currentStock - adjustAmount
                      )
                    : 0}{' '}
                  {selectedItem?.unit}
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-charcoal text-white hover:bg-charcoal/90 text-xs h-9">
                Confirm Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Movement History Log Sheet */}
      <Dialog open={isMovementsOpen} onOpenChange={setIsMovementsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              Stock Audit Log: {selectedItem?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Traceability history of stock receipts, reconciliations, and culinary usages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 my-4">
            {itemMovements.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No movement history recorded yet.</p>
            ) : (
              itemMovements.map((mov) => {
                const isPositive = mov.changeAmount > 0;
                return (
                  <div
                    key={mov.id}
                    className="p-3 rounded-lg border border-border bg-card flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{mov.reason}</span>
                        {mov.referenceId && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            ({mov.referenceId})
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(mov.timestamp).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={cn(
                          'font-mono font-bold text-sm',
                          isPositive ? 'text-success' : 'text-destructive'
                        )}
                      >
                        {isPositive ? '+' : ''}
                        {mov.changeAmount} {selectedItem?.unit}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        {mov.previousStock} → {mov.newStock} {selectedItem?.unit}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovementsOpen(false)} className="text-xs h-8">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md p-6">
          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">Add New Ingredient</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="invName" className="font-semibold text-xs">Ingredient Name *</Label>
                <Input
                  id="invName"
                  required
                  placeholder="e.g. Saffron / Canola Oil"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="invCat" className="font-semibold text-xs">Category</Label>
                  <Input
                    id="invCat"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="invUnit" className="font-semibold text-xs">Unit of Measurement</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(val: any) => setFormData({ ...formData, unit: val })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STOCK_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="currStock" className="font-semibold text-xs">Current Stock</Label>
                  <Input
                    id="currStock"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="minStock" className="font-semibold text-xs">Minimum Threshold</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="costUnit" className="font-semibold text-xs">Cost Per Unit (AED)</Label>
                  <Input
                    id="costUnit"
                    type="number"
                    min="0"
                    required
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="supplierSelect" className="font-semibold text-xs">Supplier</Label>
                  <Select
                    value={formData.supplierName}
                    onValueChange={(val) => {
                      const sup = suppliers.find((s) => s.name === val);
                      setFormData({ ...formData, supplierName: val, supplierId: sup?.id || '' });
                    }}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-card truncate">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-terracotta hover:bg-terracotta/90 text-white text-xs h-9">
                Save Ingredient
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md p-6">
          <form onSubmit={handleEditSubmit} className="space-y-3.5">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">Edit Ingredient</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="editInvName" className="font-semibold text-xs">Name</Label>
                <Input
                  id="editInvName"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="editInvCat" className="font-semibold text-xs">Category</Label>
                  <Input
                    id="editInvCat"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="editInvCost" className="font-semibold text-xs">Cost / Unit (AED)</Label>
                  <Input
                    id="editInvCost"
                    type="number"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="editMinStock" className="font-semibold text-xs">Min Stock</Label>
                  <Input
                    id="editMinStock"
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="editExp" className="font-semibold text-xs">Expiry Date (optional)</Label>
                  <Input
                    id="editExp"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-charcoal text-white hover:bg-charcoal/90 text-xs h-9">
                Update Ingredient
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-destructive">
              Delete Inventory Item
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              Are you sure you want to remove <span className="font-bold text-foreground">{deleteConfirmItem?.name}</span>?
              Historical purchases and orders will retain historical audit trail.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmItem(null)} className="text-xs h-9">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="text-xs h-9">
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
