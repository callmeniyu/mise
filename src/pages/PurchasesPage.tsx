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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  ShoppingCart,
  Building2,
  Calendar,
  Banknote,
  TrendingDown,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import {
  usePurchases,
  useCreatePurchase,
  useUpdatePurchase,
  useDeletePurchase,
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useInventory,
  useOrders,
} from '@/hooks/api';
import { GroceryPurchase, Supplier, StockUnit } from '@/types';
import { toast } from 'sonner';

const STOCK_UNITS: StockUnit[] = ['kg', 'liter', 'piece', 'dozen', 'pack', 'gram', 'tin'];

export default function PurchasesPage() {
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');

  // Purchase Dialogs
  const [isLogPurchaseOpen, setIsLogPurchaseOpen] = useState(false);
  const [isEditPurchaseOpen, setIsEditPurchaseOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<GroceryPurchase | null>(null);
  const [deletePurchaseConfirm, setDeletePurchaseConfirm] = useState<GroceryPurchase | null>(null);

  // Supplier Dialogs
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [deleteSupplierConfirm, setDeleteSupplierConfirm] = useState<Supplier | null>(null);

  // Purchase Form
  const [purchaseForm, setPurchaseForm] = useState({
    supplier: '',
    supplierId: '',
    ingredient: '',
    inventoryItemId: '',
    quantity: 20,
    unit: 'kg' as StockUnit,
    unitPrice: 500,
    cost: 10000,
    purchaseDate: new Date().toISOString().split('T')[0],
    linkedOrderId: '',
    notes: '',
  });

  // Supplier Form
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: 'Lahore',
    category: 'Grains & Flour',
  });

  const { data: purchases = [], isLoading: purchasesLoading } = usePurchases();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const { data: inventory = [] } = useInventory();
  const { data: orders = [] } = useOrders();

  const createPurchaseMutation = useCreatePurchase();
  const updatePurchaseMutation = useUpdatePurchase();
  const deletePurchaseMutation = useDeletePurchase();

  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();

  // Financial Metrics
  const totalSpent = purchases.reduce((sum, p) => sum + p.cost, 0);
  const thisMonthSpent = purchases
    .filter((p) => {
      const pMonth = p.purchaseDate.substring(0, 7);
      const currMonth = new Date().toISOString().substring(0, 7);
      return pMonth === currMonth;
    })
    .reduce((sum, p) => sum + p.cost, 0);

  // Filtered Purchases
  const filteredPurchases = purchases.filter((p) => {
    const matchSearch =
      p.ingredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSupplier = supplierFilter === 'all' || p.supplier === supplierFilter;

    return matchSearch && matchSupplier;
  });

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Open Log Purchase
  const handleOpenLogPurchase = () => {
    const defaultSup = suppliers[0];
    const defaultInv = inventory[0];

    setPurchaseForm({
      supplier: defaultSup?.name || '',
      supplierId: defaultSup?.id || '',
      ingredient: defaultInv?.name || 'Basmati Rice',
      inventoryItemId: defaultInv?.id || '',
      quantity: 25,
      unit: defaultInv?.unit || 'kg',
      unitPrice: defaultInv?.costPerUnit || 300,
      cost: (defaultInv?.costPerUnit || 300) * 25,
      purchaseDate: new Date().toISOString().split('T')[0],
      linkedOrderId: '',
      notes: '',
    });
    setIsLogPurchaseOpen(true);
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.ingredient.trim() || !purchaseForm.supplier.trim()) {
      toast.error('Supplier and ingredient are required');
      return;
    }

    const calculatedCost = purchaseForm.quantity * purchaseForm.unitPrice;

    createPurchaseMutation.mutate(
      {
        supplier: purchaseForm.supplier,
        supplierId: purchaseForm.supplierId,
        ingredient: purchaseForm.ingredient,
        inventoryItemId: purchaseForm.inventoryItemId,
        quantity: purchaseForm.quantity,
        unit: purchaseForm.unit,
        unitPrice: purchaseForm.unitPrice,
        cost: calculatedCost,
        purchaseDate: purchaseForm.purchaseDate,
        linkedOrderId: purchaseForm.linkedOrderId || undefined,
        notes: purchaseForm.notes,
        status: 'Completed',
      },
      {
        onSuccess: () => {
          toast.success('Purchase logged & inventory stock replenished');
          setIsLogPurchaseOpen(false);
        },
        onError: () => toast.error('Failed to log purchase order'),
      }
    );
  };

  const handleEditPurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;

    const calculatedCost = purchaseForm.quantity * purchaseForm.unitPrice;

    updatePurchaseMutation.mutate(
      {
        id: selectedPurchase.id,
        data: {
          supplier: purchaseForm.supplier,
          supplierId: purchaseForm.supplierId,
          ingredient: purchaseForm.ingredient,
          quantity: purchaseForm.quantity,
          unit: purchaseForm.unit,
          unitPrice: purchaseForm.unitPrice,
          cost: calculatedCost,
          purchaseDate: purchaseForm.purchaseDate,
          linkedOrderId: purchaseForm.linkedOrderId || undefined,
          notes: purchaseForm.notes,
        },
      },
      {
        onSuccess: () => {
          toast.success('Purchase updated & stock reconciled');
          setIsEditPurchaseOpen(false);
          setSelectedPurchase(null);
        },
        onError: () => toast.error('Failed to update purchase'),
      }
    );
  };

  const handleDeletePurchaseConfirm = () => {
    if (!deletePurchaseConfirm) return;
    deletePurchaseMutation.mutate(deletePurchaseConfirm.id, {
      onSuccess: () => {
        toast.success(`Purchase ${deletePurchaseConfirm.id} deleted & stock rolled back`);
        setDeletePurchaseConfirm(null);
      },
      onError: () => toast.error('Failed to delete purchase'),
    });
  };

  // Supplier Form Submits
  const handleOpenAddSupplier = () => {
    setSupplierForm({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: 'Lahore',
      category: 'Grains & Flour',
    });
    setIsAddSupplierOpen(true);
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    createSupplierMutation.mutate(
      {
        name: supplierForm.name,
        contactPerson: supplierForm.contactPerson,
        email: supplierForm.email,
        phone: supplierForm.phone,
        address: supplierForm.address,
        city: supplierForm.city,
        category: supplierForm.category,
      },
      {
        onSuccess: () => {
          toast.success('Supplier profile added');
          setIsAddSupplierOpen(false);
        },
        onError: () => toast.error('Failed to add supplier'),
      }
    );
  };

  const handleEditSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    updateSupplierMutation.mutate(
      {
        id: selectedSupplier.id,
        data: {
          name: supplierForm.name,
          contactPerson: supplierForm.contactPerson,
          email: supplierForm.email,
          phone: supplierForm.phone,
          address: supplierForm.address,
          city: supplierForm.city,
          category: supplierForm.category,
        },
      },
      {
        onSuccess: () => {
          toast.success('Supplier profile updated');
          setIsEditSupplierOpen(false);
          setSelectedSupplier(null);
        },
        onError: () => toast.error('Failed to update supplier'),
      }
    );
  };

  const handleDeleteSupplierConfirm = () => {
    if (!deleteSupplierConfirm) return;
    deleteSupplierMutation.mutate(deleteSupplierConfirm.id, {
      onSuccess: (res) => {
        if (!res.success) {
          toast.error(res.message || 'Cannot delete supplier');
        } else {
          toast.success('Supplier archived');
        }
        setDeleteSupplierConfirm(null);
      },
      onError: () => toast.error('Failed to delete supplier'),
    });
  };

  return (
    <DashboardLayout
      title="Purchases & Vendor Directory"
      subtitle="Stock replenishment, wholesale purchase orders, and supplier relationships"
      actions={
        <div className="flex items-center gap-2">
          {activeTab === 'purchases' ? (
            <Button
              onClick={handleOpenLogPurchase}
              className="bg-terracotta hover:bg-terracotta/90 text-white shadow-xs text-xs h-9"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Log Purchase Order
            </Button>
          ) : (
            <Button
              onClick={handleOpenAddSupplier}
              className="bg-charcoal text-white hover:bg-charcoal/90 shadow-xs text-xs h-9"
            >
              <Building2 className="w-4 h-4 mr-1.5 text-sage" />
              Add Supplier
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Total Procurement Spend
              </p>
              <p className="font-display text-2xl font-bold text-foreground mt-1">
                AED {totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-charcoal text-white flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>

          <div className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Current Month Spend
              </p>
              <p className="font-display text-2xl font-bold text-terracotta mt-1">
                AED {thisMonthSpent.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-terracotta-light text-terracotta flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Active Supplier Partners
              </p>
              <p className="font-display text-2xl font-bold text-success mt-1">
                {suppliers.length} vendors
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sage-light text-success flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            <TabsList className="bg-secondary/60 p-1 border border-border h-10 w-fit">
              <TabsTrigger
                value="purchases"
                className="text-xs font-semibold px-4 h-8 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                Purchases Ledger ({purchases.length})
              </TabsTrigger>
              <TabsTrigger
                value="suppliers"
                className="text-xs font-semibold px-4 h-8 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                <Building2 className="w-3.5 h-3.5 mr-1.5" />
                Suppliers Directory ({suppliers.length})
              </TabsTrigger>
            </TabsList>

            {/* Global search within page */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={
                  activeTab === 'purchases'
                    ? 'Search purchase ingredient, supplier...'
                    : 'Search vendor name, category, city...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-card text-xs border-border"
              />
            </div>
          </div>

          {/* TAB 1: PURCHASES */}
          <TabsContent value="purchases" className="mt-0 space-y-4">
            <div className="card-premium overflow-hidden">
              <Table>
                <TableHeader className="bg-secondary/60">
                  <TableRow className="border-border">
                    <TableHead className="font-bold text-xs text-foreground py-3.5">PO Number</TableHead>
                    <TableHead className="font-bold text-xs text-foreground">Date</TableHead>
                    <TableHead className="font-bold text-xs text-foreground">Ingredient</TableHead>
                    <TableHead className="font-bold text-xs text-foreground">Supplier</TableHead>
                    <TableHead className="font-bold text-xs text-foreground">Quantity</TableHead>
                    <TableHead className="font-bold text-xs text-foreground">Unit Cost</TableHead>
                    <TableHead className="font-bold text-xs text-foreground">Total Cost</TableHead>
                    <TableHead className="font-bold text-xs text-foreground">Linked Order</TableHead>
                    <TableHead className="text-right font-bold text-xs text-foreground pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchasesLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                        Loading purchase ledger...
                      </TableCell>
                    </TableRow>
                  ) : filteredPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-xs text-muted-foreground">
                        No purchase orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchases.map((purchase) => (
                      <TableRow key={purchase.id} className="border-border hover:bg-secondary/30 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                          {purchase.id}
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-medium whitespace-nowrap">
                          {purchase.purchaseDate}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-foreground">
                          {purchase.ingredient}
                        </TableCell>
                        <TableCell className="text-xs text-secondary-foreground font-medium">
                          {purchase.supplier}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-semibold text-foreground">
                          {purchase.quantity} {purchase.unit}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          AED {purchase.unitPrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-foreground">
                          AED {purchase.cost.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {purchase.linkedOrderId || '—'}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-secondary"
                              onClick={() => {
                                setSelectedPurchase(purchase);
                                setPurchaseForm({
                                  supplier: purchase.supplier,
                                  supplierId: purchase.supplierId || '',
                                  ingredient: purchase.ingredient,
                                  inventoryItemId: purchase.inventoryItemId || '',
                                  quantity: purchase.quantity,
                                  unit: purchase.unit,
                                  unitPrice: purchase.unitPrice,
                                  cost: purchase.cost,
                                  purchaseDate: purchase.purchaseDate,
                                  linkedOrderId: purchase.linkedOrderId || '',
                                  notes: purchase.notes || '',
                                });
                                setIsEditPurchaseOpen(true);
                              }}
                              title="Edit Purchase"
                            >
                              <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive-light text-destructive"
                              onClick={() => setDeletePurchaseConfirm(purchase)}
                              title="Delete Purchase Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TAB 2: SUPPLIERS */}
          <TabsContent value="suppliers" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliersLoading ? (
                <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                  Loading suppliers...
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="col-span-full card-premium p-12 text-center text-sm text-muted-foreground">
                  No suppliers found matching your query.
                </div>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="card-premium p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] border-border font-semibold">
                          {supplier.category}
                        </Badge>
                        <span className="text-[11px] font-mono text-muted-foreground">{supplier.id}</span>
                      </div>

                      <h3 className="font-display text-base font-bold text-foreground mt-1">
                        {supplier.name}
                      </h3>

                      {supplier.contactPerson && (
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          Rep: {supplier.contactPerson}
                        </p>
                      )}

                      <div className="space-y-1.5 mt-3 text-xs text-secondary-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span>{supplier.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{supplier.address}, {supplier.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                          Historical Procurement
                        </span>
                        <p className="font-bold text-foreground">
                          AED {(supplier.totalPurchased || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setSupplierForm({
                              name: supplier.name,
                              contactPerson: supplier.contactPerson || '',
                              email: supplier.email,
                              phone: supplier.phone,
                              address: supplier.address,
                              city: supplier.city,
                              category: supplier.category,
                            });
                            setIsEditSupplierOpen(true);
                          }}
                          title="Edit Supplier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive-light"
                          onClick={() => setDeleteSupplierConfirm(supplier)}
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Log Purchase Dialog */}
      <Dialog open={isLogPurchaseOpen} onOpenChange={setIsLogPurchaseOpen}>
        <DialogContent className="max-w-md p-6">
          <form onSubmit={handlePurchaseSubmit} className="space-y-3.5">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">Log New Grocery Purchase</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Automatic stock update: inventory items matching this ingredient will automatically increase.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="purSupplier" className="font-semibold text-xs">Supplier *</Label>
                <Select
                  value={purchaseForm.supplier}
                  onValueChange={(val) => {
                    const s = suppliers.find((sup) => sup.name === val);
                    setPurchaseForm({ ...purchaseForm, supplier: val, supplierId: s?.id || '' });
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name} ({s.category})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="purItem" className="font-semibold text-xs">Ingredient Item *</Label>
                <Select
                  value={purchaseForm.ingredient}
                  onValueChange={(val) => {
                    const inv = inventory.find((i) => i.name === val);
                    setPurchaseForm({
                      ...purchaseForm,
                      ingredient: val,
                      inventoryItemId: inv?.id || '',
                      unit: inv?.unit || purchaseForm.unit,
                      unitPrice: inv?.costPerUnit || purchaseForm.unitPrice,
                    });
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                    <SelectValue placeholder="Select inventory ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map((inv) => (
                      <SelectItem key={inv.id} value={inv.name}>
                        {inv.name} (Stock: {inv.currentStock} {inv.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="purQty" className="font-semibold text-xs">Quantity</Label>
                  <Input
                    id="purQty"
                    type="number"
                    min="1"
                    required
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs font-bold"
                  />
                </div>
                <div>
                  <Label htmlFor="purUnit" className="font-semibold text-xs">Unit</Label>
                  <Input
                    id="purUnit"
                    readOnly
                    value={purchaseForm.unit}
                    className="mt-1 h-9 bg-secondary/50 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="purPrice" className="font-semibold text-xs">Unit Cost (AED)</Label>
                  <Input
                    id="purPrice"
                    type="number"
                    min="1"
                    required
                    value={purchaseForm.unitPrice}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, unitPrice: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-secondary/50 rounded-xl flex items-center justify-between text-xs">
                <span>Total PO Purchase Cost:</span>
                <span className="font-bold text-sm text-foreground">
                  AED {(purchaseForm.quantity * purchaseForm.unitPrice).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="purDate" className="font-semibold text-xs">Purchase Date</Label>
                  <Input
                    id="purDate"
                    type="date"
                    required
                    value={purchaseForm.purchaseDate}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="purLinkedOrder" className="font-semibold text-xs">Linked Order (optional)</Label>
                  <Select
                    value={purchaseForm.linkedOrderId}
                    onValueChange={(val) => setPurchaseForm({ ...purchaseForm, linkedOrderId: val })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-card truncate">
                      <SelectValue placeholder="General Stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General Inventory (No Order)</SelectItem>
                      {orders.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.id}: {o.clientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsLogPurchaseOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-terracotta hover:bg-terracotta/90 text-white text-xs h-9">
                Log Purchase Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Purchase Dialog */}
      <Dialog open={isEditPurchaseOpen} onOpenChange={setIsEditPurchaseOpen}>
        <DialogContent className="max-w-md p-6">
          <form onSubmit={handleEditPurchaseSubmit} className="space-y-3.5">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">Edit Purchase Order</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-semibold text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs font-bold"
                  />
                </div>
                <div>
                  <Label className="font-semibold text-xs">Unit Price (AED)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={purchaseForm.unitPrice}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, unitPrice: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <Label className="font-semibold text-xs">Purchase Date</Label>
                <Input
                  type="date"
                  value={purchaseForm.purchaseDate}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditPurchaseOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-charcoal text-white hover:bg-charcoal/90 text-xs h-9">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Purchase Confirmation */}
      <Dialog open={!!deletePurchaseConfirm} onOpenChange={(open) => !open && setDeletePurchaseConfirm(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-destructive">
              Delete Purchase Record
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              Deleting this purchase will automatically roll back{' '}
              <span className="font-bold text-foreground">
                {deletePurchaseConfirm?.quantity} {deletePurchaseConfirm?.unit}
              </span>{' '}
              from inventory stock. Are you sure you wish to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeletePurchaseConfirm(null)} className="text-xs h-9">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePurchaseConfirm} className="text-xs h-9">
              Confirm Rollback & Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
        <DialogContent className="max-w-md p-6">
          <form onSubmit={handleSupplierSubmit} className="space-y-3.5">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">Add Supplier Profile</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="supName" className="font-semibold text-xs">Company Name *</Label>
                <Input
                  id="supName"
                  required
                  placeholder="e.g. Grain Masters & Co."
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="supRep" className="font-semibold text-xs">Contact Person</Label>
                  <Input
                    id="supRep"
                    placeholder="Representative name"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="supCat" className="font-semibold text-xs">Primary Category</Label>
                  <Input
                    id="supCat"
                    placeholder="e.g. Poultry & Meat"
                    value={supplierForm.category}
                    onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="supPhone" className="font-semibold text-xs">Phone Number</Label>
                  <Input
                    id="supPhone"
                    placeholder="+92 300 0000000"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="supEmail" className="font-semibold text-xs">Email</Label>
                  <Input
                    id="supEmail"
                    type="email"
                    placeholder="orders@vendor.demo"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label htmlFor="supAddr" className="font-semibold text-xs">Address</Label>
                  <Input
                    id="supAddr"
                    placeholder="Street or terminal"
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="supCity" className="font-semibold text-xs">City</Label>
                  <Input
                    id="supCity"
                    value={supplierForm.city}
                    onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddSupplierOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-charcoal text-white hover:bg-charcoal/90 text-xs h-9">
                Save Vendor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditSupplierOpen} onOpenChange={setIsEditSupplierOpen}>
        <DialogContent className="max-w-md p-6">
          <form onSubmit={handleEditSupplierSubmit} className="space-y-3.5">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">Edit Supplier Profile</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="editSupName" className="font-semibold text-xs">Company Name</Label>
                <Input
                  id="editSupName"
                  required
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="editSupRep" className="font-semibold text-xs">Contact Person</Label>
                  <Input
                    id="editSupRep"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="editSupCat" className="font-semibold text-xs">Category</Label>
                  <Input
                    id="editSupCat"
                    value={supplierForm.category}
                    onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="editSupPhone" className="font-semibold text-xs">Phone</Label>
                  <Input
                    id="editSupPhone"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="editSupEmail" className="font-semibold text-xs">Email</Label>
                  <Input
                    id="editSupEmail"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditSupplierOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-charcoal text-white hover:bg-charcoal/90 text-xs h-9">
                Save Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Supplier Confirmation */}
      <Dialog open={!!deleteSupplierConfirm} onOpenChange={(open) => !open && setDeleteSupplierConfirm(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-destructive">
              Delete Supplier
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              Are you sure you want to remove <span className="font-bold text-foreground">{deleteSupplierConfirm?.name}</span>?
              If this supplier is referenced by existing purchase orders, deletion will be safely rejected to prevent broken audit history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteSupplierConfirm(null)} className="text-xs h-9">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSupplierConfirm} className="text-xs h-9">
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
