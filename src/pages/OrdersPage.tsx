import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  useOrders,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  useMenuItems,
  useProcessPayment,
} from '@/hooks/api';
import { Order, OrderStatus, ClientType, EventType } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS: OrderStatus[] = ['Inquiry', 'Confirmed', 'In Progress', 'Delivered', 'Closed'];
const CLIENT_TYPES: ClientType[] = ['Wedding', 'Corporate', 'Family', 'Individual'];
const EVENT_TYPES: EventType[] = [
  'Wedding',
  'Corporate Lunch',
  'Private Event',
  'Catering Banquet',
  'Gala Dinner',
  'Family Celebration',
];

const statusBadgeStyles: Record<OrderStatus, string> = {
  Inquiry: 'bg-info-light text-info border-info/30',
  Confirmed: 'bg-butter-light text-warning border-butter',
  'In Progress': 'bg-sage-light text-success border-sage/40',
  Delivered: 'bg-success-light text-success border-success/40',
  Closed: 'bg-muted text-muted-foreground border-border',
};

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientTypeFilter, setClientTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientType: 'Wedding' as ClientType,
    eventType: 'Wedding' as EventType,
    eventDate: new Date().toISOString().split('T')[0],
    guestCount: 100,
    pricePerHead: 2500,
    advanceReceived: 50000,
    notes: '',
    selectedDishes: [] as string[],
  });

  // API Hooks
  const { data: orders = [], isLoading } = useOrders();
  const { data: menuItems = [] } = useMenuItems();
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();

  // Filtering & Sorting
  const filteredOrders = orders
    .filter((order) => {
      const matchSearch =
        order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.eventType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchClient = clientTypeFilter === 'all' || order.clientType === clientTypeFilter;

      return matchSearch && matchStatus && matchClient;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.eventDate.localeCompare(a.eventDate);
      }
      return b.totalValue - a.totalValue;
    });

  const handleOpenCreate = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientType: 'Wedding',
      eventType: 'Wedding',
      eventDate: new Date().toISOString().split('T')[0],
      guestCount: 150,
      pricePerHead: 2600,
      advanceReceived: 100000,
      notes: '',
      selectedDishes: menuItems.slice(0, 3).map((m) => m.name),
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      toast.error('Client name is required');
      return;
    }

    const calculatedTotal = formData.guestCount * formData.pricePerHead;

    createOrderMutation.mutate(
      {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        clientType: formData.clientType,
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        guestCount: formData.guestCount,
        pricePerHead: formData.pricePerHead,
        totalValue: calculatedTotal,
        advanceReceived: formData.advanceReceived,
        menuItems: formData.selectedDishes,
        status: formData.advanceReceived > 0 ? 'Confirmed' : 'Inquiry',
        notes: formData.notes,
      },
      {
        onSuccess: () => {
          toast.success('Catering order created successfully');
          setIsCreateOpen(false);
        },
        onError: () => toast.error('Failed to create order'),
      }
    );
  };

  const handleOpenEdit = (order: Order) => {
    setSelectedOrder(order);
    setFormData({
      clientName: order.clientName,
      clientEmail: order.clientEmail || '',
      clientPhone: order.clientPhone || '',
      clientType: order.clientType,
      eventType: order.eventType,
      eventDate: order.eventDate,
      guestCount: order.guestCount,
      pricePerHead: order.pricePerHead,
      advanceReceived: order.advanceReceived,
      notes: order.notes || '',
      selectedDishes: order.menuItems || [],
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    updateOrderMutation.mutate(
      {
        id: selectedOrder.id,
        data: {
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          clientType: formData.clientType,
          eventType: formData.eventType,
          eventDate: formData.eventDate,
          guestCount: formData.guestCount,
          pricePerHead: formData.pricePerHead,
          advanceReceived: formData.advanceReceived,
          menuItems: formData.selectedDishes,
          notes: formData.notes,
        },
      },
      {
        onSuccess: () => {
          toast.success('Order updated successfully');
          setIsEditOpen(false);
          setSelectedOrder(null);
        },
        onError: () => toast.error('Failed to update order'),
      }
    );
  };

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    updateOrderMutation.mutate(
      {
        id: order.id,
        data: { status: newStatus },
      },
      {
        onSuccess: () => toast.success(`Order ${order.id} marked as ${newStatus}`),
        onError: () => toast.error('Failed to update order status'),
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!orderToDelete) return;
    deleteOrderMutation.mutate(orderToDelete.id, {
      onSuccess: () => {
        toast.success(`Order ${orderToDelete.id} removed`);
        setIsDeleteConfirmOpen(false);
        setOrderToDelete(null);
      },
      onError: () => toast.error('Failed to delete order'),
    });
  };

  return (
    <DashboardLayout
      title="Orders Management"
      subtitle="Comprehensive contracts, banquets, guest counts, and settlements"
      actions={
        <Button
          onClick={handleOpenCreate}
          className="bg-terracotta hover:bg-terracotta/90 text-white shadow-xs text-xs h-9"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Order
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Filter & Control Bar */}
        <div className="card-premium p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, ID, or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-card text-xs border-border"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-card border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Client Type Filter */}
            <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-card border-border">
                <SelectValue placeholder="Client Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {CLIENT_TYPES.map((ct) => (
                  <SelectItem key={ct} value={ct}>
                    {ct}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Toggle */}
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[130px] h-9 text-xs bg-card border-border">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Latest Date</SelectItem>
                <SelectItem value="amount">Highest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs font-medium text-muted-foreground self-end md:self-center">
            Showing <span className="font-bold text-foreground">{filteredOrders.length}</span> of{' '}
            {orders.length} orders
          </div>
        </div>

        {/* Orders Data Table */}
        <div className="card-premium overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/60">
              <TableRow className="border-border">
                <TableHead className="font-bold text-xs text-foreground py-3.5">Order ID</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Client & Event</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Event Date</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Guests</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Total Value</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Balance</TableHead>
                <TableHead className="font-bold text-xs text-foreground">Status</TableHead>
                <TableHead className="text-right font-bold text-xs text-foreground pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                    Loading order records...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                    No orders match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const hasRemaining = order.remainingBalance > 0;

                  return (
                    <TableRow key={order.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                        {order.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-xs text-foreground">{order.clientName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {order.eventType} • <span className="font-medium">{order.clientType}</span>
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-foreground font-medium whitespace-nowrap">
                        {order.eventDate}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        <span className="font-semibold">{order.guestCount}</span> guests
                      </TableCell>
                      <TableCell className="text-xs font-bold text-foreground">
                        AED {order.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {hasRemaining ? (
                          <span className="font-semibold text-destructive">
                            AED {order.remainingBalance.toLocaleString()}
                          </span>
                        ) : (
                          <span className="font-semibold text-success flex items-center gap-1">
                            ✓ Paid
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px] font-medium shadow-none', statusBadgeStyles[order.status])}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-secondary"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailsOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-secondary"
                            onClick={() => handleOpenEdit(order)}
                            title="Edit Order"
                          >
                            <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive-light text-destructive"
                            onClick={() => {
                              setOrderToDelete(order);
                              setIsDeleteConfirmOpen(true);
                            }}
                            title="Delete Order"
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

      {/* View Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6">
          {selectedOrder && (
            <div>
              <DialogHeader>
                <div className="flex items-center justify-between pr-4">
                  <DialogTitle className="font-display text-xl font-bold">
                    Order Contract {selectedOrder.id}
                  </DialogTitle>
                  <Badge className={cn('text-xs', statusBadgeStyles[selectedOrder.status])}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Created on {selectedOrder.createdAt}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-4 text-xs">
                {/* Client & Event Specs */}
                <div className="p-3.5 bg-secondary/40 rounded-xl space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Client Name</span>
                      <p className="font-bold text-sm text-foreground">{selectedOrder.clientName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Client Type</span>
                      <p className="font-medium text-foreground">{selectedOrder.clientType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Event Date</span>
                      <p className="font-semibold text-foreground">{selectedOrder.eventDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Event Type</span>
                      <p className="font-medium text-foreground">{selectedOrder.eventType}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Guest Count</span>
                      <p className="font-semibold text-foreground">{selectedOrder.guestCount} guests</p>
                    </div>
                  </div>
                </div>

                {/* Financial Ledger */}
                <div className="p-3.5 border border-border rounded-xl space-y-2 bg-card">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Financial Ledger</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Price Per Head</span>
                      <p className="font-semibold text-foreground">AED {selectedOrder.pricePerHead.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Total Contract Value</span>
                      <p className="font-bold text-sm text-foreground">AED {selectedOrder.totalValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Advance Received</span>
                      <p className="font-semibold text-success">AED {selectedOrder.advanceReceived.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-secondary/50 rounded-lg flex items-center justify-between text-xs mt-2">
                    <span className="font-semibold">Remaining Balance Due:</span>
                    <span className="font-bold text-destructive text-sm">
                      AED {selectedOrder.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-3.5 border border-border rounded-xl space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Culinary Selections</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOrder.menuItems && selectedOrder.menuItems.length > 0 ? (
                      selectedOrder.menuItems.map((dish, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-secondary text-foreground text-xs font-medium">
                          {dish}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground italic">Custom kitchen menu</span>
                    )}
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="p-3 bg-secondary/20 rounded-lg">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Service Notes</span>
                    <p className="text-xs text-foreground mt-0.5">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Status Transitions Workflow */}
                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-2">
                    Advance Lifecycle Status
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((st) => (
                      <Button
                        key={st}
                        size="sm"
                        variant={selectedOrder.status === st ? 'default' : 'outline'}
                        className={cn(
                          'text-xs h-7',
                          selectedOrder.status === st
                            ? 'bg-charcoal text-white'
                            : 'border-border hover:bg-secondary'
                        )}
                        onClick={() => {
                          handleStatusChange(selectedOrder, st);
                          setSelectedOrder({ ...selectedOrder, status: st });
                        }}
                      >
                        {st}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="text-xs h-8 border-border"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Order Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Create New Catering Contract</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Enter client specs, guest count, and initial advance payment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="clientName" className="text-xs font-semibold">Client / Event Name *</Label>
                <Input
                  id="clientName"
                  required
                  placeholder="e.g. Danish & Alizeh Wedding Gala"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="clientType" className="text-xs font-semibold">Client Segment</Label>
                  <Select
                    value={formData.clientType}
                    onValueChange={(val: any) => setFormData({ ...formData, clientType: val })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eventType" className="text-xs font-semibold">Event Format</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(val: any) => setFormData({ ...formData, eventType: val })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="eventDate" className="text-xs font-semibold">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="guestCount" className="text-xs font-semibold">Guest Count</Label>
                  <Input
                    id="guestCount"
                    type="number"
                    min="1"
                    required
                    value={formData.guestCount}
                    onChange={(e) => setFormData({ ...formData, guestCount: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerHead" className="text-xs font-semibold">Price Per Head (AED)</Label>
                  <Input
                    id="pricePerHead"
                    type="number"
                    min="100"
                    required
                    value={formData.pricePerHead}
                    onChange={(e) => setFormData({ ...formData, pricePerHead: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-secondary/40 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Estimated Total Value:</span>
                  <span className="font-bold text-foreground text-sm">
                    AED {(formData.guestCount * formData.pricePerHead).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Initial Advance Received:</span>
                  <Input
                    type="number"
                    min="0"
                    max={formData.guestCount * formData.pricePerHead}
                    value={formData.advanceReceived}
                    onChange={(e) => setFormData({ ...formData, advanceReceived: Number(e.target.value) })}
                    className="w-36 h-8 text-right bg-card text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Select Menu Dishes</Label>
                <div className="grid grid-cols-2 gap-1.5 mt-1 max-h-36 overflow-y-auto p-2 border border-border rounded-lg bg-card">
                  {menuItems.map((dish) => {
                    const isSelected = formData.selectedDishes.includes(dish.name);
                    return (
                      <div
                        key={dish.id}
                        onClick={() => {
                          const newDishes = isSelected
                            ? formData.selectedDishes.filter((d) => d !== dish.name)
                            : [...formData.selectedDishes, dish.name];
                          setFormData({ ...formData, selectedDishes: newDishes });
                        }}
                        className={cn(
                          'p-1.5 rounded-md text-xs cursor-pointer border transition-colors flex items-center justify-between',
                          isSelected
                            ? 'bg-terracotta/10 border-terracotta text-terracotta font-medium'
                            : 'border-border hover:bg-secondary text-foreground'
                        )}
                      >
                        <span className="truncate">{dish.name}</span>
                        {isSelected && <span className="text-[10px]">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-xs font-semibold">Service Instructions</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="Special client requests, venue guidelines, table setting style..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 bg-card text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-terracotta hover:bg-terracotta/90 text-white text-xs h-9">
                Save Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Edit Catering Contract</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="editClientName" className="text-xs font-semibold">Client Name</Label>
                <Input
                  id="editClientName"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="editClientType" className="text-xs font-semibold">Client Segment</Label>
                  <Select
                    value={formData.clientType}
                    onValueChange={(val: any) => setFormData({ ...formData, clientType: val })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="editEventType" className="text-xs font-semibold">Event Format</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(val: any) => setFormData({ ...formData, eventType: val })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="editEventDate" className="text-xs font-semibold">Event Date</Label>
                  <Input
                    id="editEventDate"
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="editGuestCount" className="text-xs font-semibold">Guest Count</Label>
                  <Input
                    id="editGuestCount"
                    type="number"
                    min="1"
                    required
                    value={formData.guestCount}
                    onChange={(e) => setFormData({ ...formData, guestCount: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="editPricePerHead" className="text-xs font-semibold">Price Per Head (AED)</Label>
                  <Input
                    id="editPricePerHead"
                    type="number"
                    min="100"
                    required
                    value={formData.pricePerHead}
                    onChange={(e) => setFormData({ ...formData, pricePerHead: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editNotes" className="text-xs font-semibold">Notes</Label>
                <Textarea
                  id="editNotes"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 bg-card text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-charcoal text-white hover:bg-charcoal/90 text-xs h-9">
                Update Contract
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-destructive">
              Confirm Order Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              Are you sure you want to permanently delete order{' '}
              <span className="font-bold text-foreground">{orderToDelete?.id}</span> ({orderToDelete?.clientName})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="text-xs h-9"
            >
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
