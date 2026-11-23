/**
 * Payments Local Simulation Service
 * Completely simulates payment ledgering, order balance settlements, and refunds.
 * No external Stripe API or real payment gateways.
 */

import { storageService } from './storage.service';
import { PaymentTransaction, SavedPaymentMethod, PaymentStatus, PaymentMethodType } from '@/types';
import { notificationsService } from './notifications.service';

export const paymentsService = {
  getAll(): PaymentTransaction[] {
    const db = storageService.getDatabase();
    return db.payments || [];
  },

  getById(id: string): PaymentTransaction | undefined {
    const payments = this.getAll();
    return payments.find((p) => p.id === id);
  },

  getByOrderId(orderId: string): PaymentTransaction[] {
    const payments = this.getAll();
    return payments.filter((p) => p.orderId === orderId);
  },

  getSavedPaymentMethods(): SavedPaymentMethod[] {
    const db = storageService.getDatabase();
    return db.savedPaymentMethods || [];
  },

  addSavedPaymentMethod(method: Omit<SavedPaymentMethod, 'id' | 'isDemo'>): SavedPaymentMethod {
    const db = storageService.getDatabase();
    const newMethod: SavedPaymentMethod = {
      ...method,
      id: storageService.generateId('pm-demo'),
      isDemo: true,
    };

    if (newMethod.isDefault) {
      db.savedPaymentMethods = (db.savedPaymentMethods || []).map((m) => ({ ...m, isDefault: false }));
    }

    db.savedPaymentMethods = [newMethod, ...(db.savedPaymentMethods || [])];
    storageService.saveDatabase(db);
    return newMethod;
  },

  deleteSavedPaymentMethod(id: string): boolean {
    const db = storageService.getDatabase();
    db.savedPaymentMethods = (db.savedPaymentMethods || []).filter((m) => m.id !== id);
    storageService.saveDatabase(db);
    return true;
  },

  /**
   * Execute a simulated payment
   */
  processPayment(params: {
    orderId?: string;
    clientName?: string;
    amount: number;
    paymentMethod: PaymentMethodType;
    cardBrand?: string;
    cardLast4?: string;
    notes?: string;
    shouldFail?: boolean;
  }): { success: boolean; transaction: PaymentTransaction; error?: string } {
    const db = storageService.getDatabase();
    const amount = Number(params.amount) || 0;

    if (amount <= 0) {
      return {
        success: false,
        transaction: null as any,
        error: 'Payment amount must be greater than zero.',
      };
    }

    const targetOrder = params.orderId ? db.orders.find((o) => o.id === params.orderId) : undefined;

    // Check balance validation if linked to an order
    if (targetOrder) {
      if (amount > targetOrder.remainingBalance) {
        return {
          success: false,
          transaction: null as any,
          error: `Payment amount (AED ${amount.toLocaleString()}) exceeds the outstanding balance (AED ${targetOrder.remainingBalance.toLocaleString()}).`,
        };
      }
    }

    const isFailure = params.shouldFail === true;
    const paymentStatus: PaymentStatus = isFailure ? 'Failed' : 'Successful';
    const txnRef = `TXN-${Math.floor(10000 + Math.random() * 90000)}-MISE`;

    const transaction: PaymentTransaction = {
      id: storageService.generateId('PAY-2026'),
      referenceNumber: txnRef,
      orderId: targetOrder?.id,
      clientName: targetOrder?.clientName || params.clientName || 'General Client',
      amount,
      currency: 'AED',
      paymentMethod: params.paymentMethod,
      cardBrand: params.cardBrand || (params.paymentMethod === 'Card' ? 'Visa' : undefined),
      cardLast4: params.cardLast4 || (params.paymentMethod === 'Card' ? '4242' : undefined),
      status: paymentStatus,
      transactionDate: new Date().toISOString(),
      notes: params.notes || `Simulated ${params.paymentMethod} transaction`,
      isSimulated: true,
    };

    // If successful, update linked order
    if (!isFailure && targetOrder) {
      targetOrder.advanceReceived = (targetOrder.advanceReceived || 0) + amount;
      targetOrder.remainingBalance = Math.max(0, targetOrder.totalValue - targetOrder.advanceReceived);

      // If inquiry or confirmed and fully paid or advanced, update status if appropriate
      if (targetOrder.status === 'Inquiry') {
        targetOrder.status = 'Confirmed';
      }
    }

    // Persist payment in database
    db.payments = [transaction, ...(db.payments || [])];
    storageService.saveDatabase(db);

    // Notify
    if (!isFailure) {
      notificationsService.add({
        title: `Payment Received: AED ${amount.toLocaleString()}`,
        message: `${params.paymentMethod} payment recorded for ${transaction.clientName} (Ref: ${txnRef}).`,
        type: 'payment',
        referenceType: 'Payment',
        referenceId: transaction.id,
      });
    } else {
      notificationsService.add({
        title: `Payment Simulation Declined`,
        message: `Attempted transaction of AED ${amount.toLocaleString()} for ${transaction.clientName} was declined.`,
        type: 'alert',
        referenceType: 'Payment',
        referenceId: transaction.id,
      });
    }

    return {
      success: !isFailure,
      transaction,
      error: isFailure ? 'Simulated card was declined by issuing institution.' : undefined,
    };
  },

  /**
   * Simulate a refund on an existing transaction
   */
  refundPayment(transactionId: string, reason?: string): { success: boolean; transaction?: PaymentTransaction; error?: string } {
    const db = storageService.getDatabase();
    const txn = db.payments.find((p) => p.id === transactionId);

    if (!txn) {
      return { success: false, error: 'Transaction not found.' };
    }

    if (txn.status === 'Refunded') {
      return { success: false, error: 'Transaction has already been refunded.' };
    }

    if (txn.status !== 'Successful') {
      return { success: false, error: 'Only successful transactions can be refunded.' };
    }

    // Update transaction status
    txn.status = 'Refunded';
    txn.notes = `${txn.notes || ''} [Refunded: ${reason || 'Customer request'}]`.trim();

    // Reconcile order balance if linked
    if (txn.orderId) {
      const order = db.orders.find((o) => o.id === txn.orderId);
      if (order) {
        order.advanceReceived = Math.max(0, (order.advanceReceived || 0) - txn.amount);
        order.remainingBalance = Math.max(0, order.totalValue - order.advanceReceived);
      }
    }

    storageService.saveDatabase(db);

    notificationsService.add({
      title: `Payment Refunded: AED ${txn.amount.toLocaleString()}`,
      message: `Transaction ${txn.referenceNumber} for ${txn.clientName} refunded. Order balance restored.`,
      type: 'payment',
      referenceType: 'Payment',
      referenceId: txn.id,
    });

    return { success: true, transaction: txn };
  },

  calculateTotalPaymentsReceived(): number {
    const list = this.getAll();
    return list
      .filter((p) => p.status === 'Successful')
      .reduce((sum, p) => sum + p.amount, 0);
  },
};
