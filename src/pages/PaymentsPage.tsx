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
  CreditCard,
  Plus,
  Zap,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Banknote,
  Search,
  Receipt,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  usePayments,
  useProcessPayment,
  useRefundPayment,
  useSavedPaymentMethods,
  useAddSavedPaymentMethod,
  useDeleteSavedPaymentMethod,
  useOrders,
} from '@/hooks/api';
import { PaymentTransaction, SavedPaymentMethod, PaymentMethodType, PaymentStatus } from '@/types';
import { toast } from 'sonner';

const statusBadgeStyles: Record<PaymentStatus, string> = {
  Successful: 'bg-sage-light text-success border-sage/40',
  Pending: 'bg-butter-light text-warning border-butter',
  Failed: 'bg-destructive-light text-destructive border-destructive/40',
  Refunded: 'bg-secondary text-secondary-foreground border-border',
};

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialogs
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<PaymentTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('Customer cancellation / billing adjustment');

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    orderId: '',
    clientName: '',
    amount: 50000,
    paymentMethod: 'Card' as PaymentMethodType,
    selectedSavedCard: 'pm-demo-1',
    shouldFail: false,
    notes: 'Advance booking payment',
  });

  // New Demo Card Form
  const [newCardForm, setNewCardForm] = useState({
    cardBrand: 'Visa' as 'Visa' | 'Mastercard' | 'Amex',
    cardLast4: '4242',
    cardExpMonth: 12,
    cardExpYear: 2028,
    cardHolderName: 'Mise Catering Escrow',
    isDefault: false,
  });

  const { data: payments = [], isLoading: paymentsLoading } = usePayments();
  const { data: savedCards = [] } = useSavedPaymentMethods();
  const { data: orders = [] } = useOrders();

  const processPaymentMutation = useProcessPayment();
  const refundPaymentMutation = useRefundPayment();
  const addCardMutation = useAddSavedPaymentMethod();
  const deleteCardMutation = useDeleteSavedPaymentMethod();

  // Orders that have remaining balance
  const unpaidOrders = orders.filter((o) => o.remainingBalance > 0);

  // Selected order details for payment dialog
  const selectedOrderObj = orders.find((o) => o.id === paymentForm.orderId);

  // Summary Metrics
  const totalReceived = payments
    .filter((p) => p.status === 'Successful')
    .reduce((sum, p) => sum + p.amount, 0);
  const successfulCount = payments.filter((p) => p.status === 'Successful').length;
  const refundedCount = payments.filter((p) => p.status === 'Refunded').length;

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.clientName && p.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.orderId && p.orderId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenProcessPayment = (presetOrderId?: string) => {
    const targetOrder = presetOrderId
      ? orders.find((o) => o.id === presetOrderId)
      : unpaidOrders[0];

    setPaymentForm({
      orderId: targetOrder?.id || '',
      clientName: targetOrder?.clientName || '',
      amount: targetOrder ? Math.min(targetOrder.remainingBalance, 100000) : 50000,
      paymentMethod: 'Card',
      selectedSavedCard: savedCards[0]?.id || 'pm-demo-1',
      shouldFail: false,
      notes: targetOrder ? `Payment against contract ${targetOrder.id}` : 'General catering advance',
    });
    setIsProcessOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const card = savedCards.find((c) => c.id === paymentForm.selectedSavedCard);

    processPaymentMutation.mutate(
      {
        orderId: paymentForm.orderId || undefined,
        clientName: paymentForm.clientName,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        cardBrand: card?.cardBrand || 'Visa',
        cardLast4: card?.cardLast4 || '4242',
        notes: paymentForm.notes,
        shouldFail: paymentForm.shouldFail,
      },
      {
        onSuccess: (res) => {
          if (!res.success) {
            toast.error(res.error || 'Payment declined by simulated issuer');
          } else {
            toast.success(`Simulated payment of AED ${paymentForm.amount.toLocaleString()} processed!`);
            setIsProcessOpen(false);
          }
        },
        onError: (err) => toast.error(err.message || 'Payment processing failed'),
      }
    );
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;

    refundPaymentMutation.mutate(
      {
        id: refundTarget.id,
        reason: refundReason,
      },
      {
        onSuccess: (res) => {
          if (!res.success) {
            toast.error(res.error || 'Refund failed');
          } else {
            toast.success(`Transaction ${refundTarget.referenceNumber} refunded. Order balance restored.`);
            setRefundTarget(null);
          }
        },
        onError: () => toast.error('Failed to simulate refund'),
      }
    );
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCardMutation.mutate(
      {
        cardBrand: newCardForm.cardBrand,
        cardLast4: newCardForm.cardLast4,
        cardExpMonth: newCardForm.cardExpMonth,
        cardExpYear: newCardForm.cardExpYear,
        cardHolderName: newCardForm.cardHolderName,
        isDefault: newCardForm.isDefault,
      },
      {
        onSuccess: () => {
          toast.success('Demo card registered in local vault');
          setIsAddCardOpen(false);
        },
        onError: () => toast.error('Failed to register demo card'),
      }
    );
  };

  return (
    <DashboardLayout
      title="Payments & Simulation Terminal"
      subtitle="Simulated transaction processing, order receivables settlement, refunds, and masked card vaults"
      actions={
        <Button
          onClick={() => handleOpenProcessPayment()}
          className="bg-terracotta hover:bg-terracotta/90 text-white shadow-xs text-xs h-9"
        >
          <Zap className="w-4 h-4 mr-1.5" />
          Process Simulated Payment
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Simulation Guarantee Callout */}
        <div className="p-4 rounded-xl bg-sage-light border border-sage/40 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-foreground">Standalone Local Simulation:</span>{' '}
            <span className="text-secondary-foreground">
              No real bank cards, Stripe SDKs, or external payment gateways are invoked. All settlements update order balances, financial ledgers, and notifications inside your browser's local store.
            </span>
          </div>
        </div>

        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Total Cleared Receipts
              </p>
              <p className="font-display text-2xl font-bold text-success mt-1">
                AED {totalReceived.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sage-light text-success flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>

          <div className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Successful Transactions
              </p>
              <p className="font-display text-2xl font-bold text-foreground mt-1">
                {successfulCount} settlements
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-charcoal text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Processed Refunds
              </p>
              <p className="font-display text-2xl font-bold text-muted-foreground mt-1">
                {refundedCount} transactions
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Top Split: Quick Payment Dispatch + Saved Demo Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Pay Terminal Card */}
          <div className="card-premium p-6 lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-terracotta text-white flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      Simulated Payment Terminal
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Collect advances or clear contract balances
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-border bg-card font-semibold">
                  Sandbox Active
                </Badge>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-secondary-foreground">
                  Select an active contract with outstanding receivables to simulate a customer payment. The contract balance will immediately reconcile.
                </p>

                {unpaidOrders.length === 0 ? (
                  <div className="p-4 rounded-xl bg-secondary/40 text-center text-xs text-muted-foreground">
                    All currently booked catering contracts are fully paid!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {unpaidOrders.slice(0, 4).map((order) => (
                      <div
                        key={order.id}
                        onClick={() => handleOpenProcessPayment(order.id)}
                        className="p-3 rounded-xl border border-border bg-card hover:bg-secondary/40 cursor-pointer transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground truncate group-hover:text-terracotta transition-colors">
                              {order.clientName}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">{order.id}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Event Date: {order.eventDate}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Due Balance:</span>
                          <span className="font-bold text-destructive">
                            AED {order.remainingBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {unpaidOrders.length} contracts awaiting balance clearance
              </span>
              <Button
                size="sm"
                onClick={() => handleOpenProcessPayment()}
                className="bg-charcoal text-white hover:bg-charcoal/90 text-xs h-8"
              >
                Open Terminal
              </Button>
            </div>
          </div>

          {/* Fictional Masked Saved Cards Vault */}
          <div className="card-premium min-w-0 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-charcoal text-white flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground leading-tight">
                      Demo Card Vault
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Fictional masked payment methods</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddCardOpen(true)}
                  className="text-xs h-7 px-2 border-border"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-2.5">
                {savedCards.map((card) => (
                  <div
                    key={card.id}
                    className="p-3 rounded-xl border border-border bg-card flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-6 shrink-0 rounded bg-secondary flex items-center justify-center font-bold text-[10px] text-foreground tracking-wider">
                        {card.cardBrand.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground font-mono">
                          •••• {card.cardLast4}
                        </p>
                        <p className="text-[10px] text-muted-foreground break-words">
                          Exp: {card.cardExpMonth}/{card.cardExpYear} • {card.cardHolderName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {card.isDefault && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sage/20 text-success uppercase">
                          Default
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteCardMutation.mutate(card.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border mt-4 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-sage flex-shrink-0" />
              <span>Masked token representation for demo use only.</span>
            </div>
          </div>
        </div>

        {/* Transaction History Ledger */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">Transaction History</h3>
              <p className="text-xs text-muted-foreground">
                Audited simulation ledger of all processed settlements, method types, and refunds
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reference or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 bg-card text-xs border-border"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs bg-card border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Successful">Successful</SelectItem>
                  <SelectItem value="Refunded">Refunded</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="card-premium overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/60">
                <TableRow className="border-border">
                  <TableHead className="font-bold text-xs text-foreground py-3.5">Reference No.</TableHead>
                  <TableHead className="font-bold text-xs text-foreground">Date & Time</TableHead>
                  <TableHead className="font-bold text-xs text-foreground">Client / Account</TableHead>
                  <TableHead className="font-bold text-xs text-foreground">Order Ref</TableHead>
                  <TableHead className="font-bold text-xs text-foreground">Payment Method</TableHead>
                  <TableHead className="font-bold text-xs text-foreground">Amount</TableHead>
                  <TableHead className="font-bold text-xs text-foreground">Status</TableHead>
                  <TableHead className="text-right font-bold text-xs text-foreground pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      Loading payment ledger...
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                      No payment records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {payment.referenceNumber}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(payment.transactionDate).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {payment.clientName}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {payment.orderId || 'Direct'}
                      </TableCell>
                      <TableCell className="text-xs text-secondary-foreground font-medium">
                        {payment.paymentMethod} {payment.cardLast4 ? `(•••• ${payment.cardLast4})` : ''}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-foreground">
                        AED {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-[10px] font-semibold shadow-none', statusBadgeStyles[payment.status])}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        {payment.status === 'Successful' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 border-border hover:bg-destructive-light hover:text-destructive"
                            onClick={() => {
                              setRefundTarget(payment);
                              setRefundReason('Customer cancellation / billing adjustment');
                            }}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Simulate Refund
                          </Button>
                        ) : payment.status === 'Refunded' ? (
                          <span className="text-[11px] text-muted-foreground italic">Refunded</span>
                        ) : (
                          <span className="text-[11px] text-destructive">Declined</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Process Simulated Payment Dialog */}
      <Dialog open={isProcessOpen} onOpenChange={setIsProcessOpen}>
        <DialogContent className="max-w-md p-6">
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Simulate Payment</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Process an advance or contract settlement using simulated banking channels.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="payOrder" className="font-semibold text-xs">Select Linked Order (optional)</Label>
                <Select
                  value={paymentForm.orderId}
                  onValueChange={(val) => {
                    const o = orders.find((ord) => ord.id === val);
                    setPaymentForm({
                      ...paymentForm,
                      orderId: val,
                      clientName: o?.clientName || paymentForm.clientName,
                      amount: o ? o.remainingBalance : paymentForm.amount,
                    });
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs bg-card truncate">
                    <SelectValue placeholder="General Payment (No Order Linked)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Direct Customer Payment (No Order)</SelectItem>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.id}: {o.clientName} (Bal: AED {o.remainingBalance.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrderObj && (
                <div className="p-3 bg-secondary/50 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract Total:</span>
                    <span className="font-semibold">AED {selectedOrderObj.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Outstanding Due:</span>
                    <span className="font-bold text-destructive">
                      AED {selectedOrderObj.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="payClient" className="font-semibold text-xs">Payer / Client Name *</Label>
                <Input
                  id="payClient"
                  required
                  value={paymentForm.clientName}
                  onChange={(e) => setPaymentForm({ ...paymentForm, clientName: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="payAmount" className="font-semibold text-xs">Payment Amount (AED) *</Label>
                  <Input
                    id="payAmount"
                    type="number"
                    min="1"
                    max={selectedOrderObj ? selectedOrderObj.remainingBalance : undefined}
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs font-bold"
                  />
                </div>

                <div>
                  <Label htmlFor="payMethod" className="font-semibold text-xs">Payment Method</Label>
                  <Select
                    value={paymentForm.paymentMethod}
                    onValueChange={(val: any) => setPaymentForm({ ...paymentForm, paymentMethod: val })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Card">Credit / Debit Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Wire / IBFT</SelectItem>
                      <SelectItem value="Cash">Counter Cash Deposit</SelectItem>
                      <SelectItem value="Cheque">Bank Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {paymentForm.paymentMethod === 'Card' && (
                <div>
                  <Label htmlFor="savedCardSelect" className="font-semibold text-xs">Use Masked Vault Card</Label>
                  <Select
                    value={paymentForm.selectedSavedCard}
                    onValueChange={(val) => setPaymentForm({ ...paymentForm, selectedSavedCard: val })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {savedCards.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.cardBrand} •••• {c.cardLast4} ({c.cardHolderName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Simulation Testing Toggle */}
              <div className="p-3 border border-border rounded-xl bg-card space-y-2">
                <span className="font-semibold text-xs text-foreground block">
                  Simulation Outcome Scenario
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={!paymentForm.shouldFail ? 'default' : 'outline'}
                    onClick={() => setPaymentForm({ ...paymentForm, shouldFail: false })}
                    className={cn(
                      'h-8 text-xs',
                      !paymentForm.shouldFail ? 'bg-sage text-charcoal font-bold' : 'border-border'
                    )}
                  >
                    ✓ Simulate Approval
                  </Button>
                  <Button
                    type="button"
                    variant={paymentForm.shouldFail ? 'default' : 'outline'}
                    onClick={() => setPaymentForm({ ...paymentForm, shouldFail: true })}
                    className={cn(
                      'h-8 text-xs',
                      paymentForm.shouldFail ? 'bg-destructive text-white font-bold' : 'border-border'
                    )}
                  >
                    ✗ Simulate Decline
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="payNotes" className="font-semibold text-xs">Transaction Reference Notes</Label>
                <Input
                  id="payNotes"
                  placeholder="e.g. Check clearance #9921 / Bank tranche 1"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsProcessOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-terracotta hover:bg-terracotta/90 text-white text-xs h-9">
                Execute Simulated Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Simulate Refund Dialog */}
      <Dialog open={!!refundTarget} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <DialogContent className="max-w-md p-6">
          <form onSubmit={handleRefundSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold text-destructive">
                Simulate Payment Refund
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Refunding transaction <span className="font-bold text-foreground">{refundTarget?.referenceNumber}</span>{' '}
                will restore AED {refundTarget?.amount.toLocaleString()} to the associated order’s balance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="refReason" className="font-semibold text-xs">Reason for Refund</Label>
                <Input
                  id="refReason"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setRefundTarget(null)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" variant="destructive" className="text-xs h-9">
                Execute Simulated Refund
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Demo Card Dialog */}
      <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
        <DialogContent className="max-w-md p-6">
          <form onSubmit={handleAddCardSubmit} className="space-y-3.5">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">Register Masked Demo Card</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Adds a fictional test card profile to your local demo wallet.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="font-semibold text-xs">Card Network</Label>
                <Select
                  value={newCardForm.cardBrand}
                  onValueChange={(val: any) => setNewCardForm({ ...newCardForm, cardBrand: val })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                    <SelectItem value="Amex">American Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-semibold text-xs">Masked Last 4 Digits</Label>
                  <Input
                    required
                    maxLength={4}
                    value={newCardForm.cardLast4}
                    onChange={(e) => setNewCardForm({ ...newCardForm, cardLast4: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <Label className="font-semibold text-xs">Cardholder Title</Label>
                  <Input
                    required
                    value={newCardForm.cardHolderName}
                    onChange={(e) => setNewCardForm({ ...newCardForm, cardHolderName: e.target.value })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-semibold text-xs">Expiry Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={newCardForm.cardExpMonth}
                    onChange={(e) => setNewCardForm({ ...newCardForm, cardExpMonth: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
                <div>
                  <Label className="font-semibold text-xs">Expiry Year</Label>
                  <Input
                    type="number"
                    min="2026"
                    max="2035"
                    value={newCardForm.cardExpYear}
                    onChange={(e) => setNewCardForm({ ...newCardForm, cardExpYear: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddCardOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-charcoal text-white hover:bg-charcoal/90 text-xs h-9">
                Save Demo Card
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
