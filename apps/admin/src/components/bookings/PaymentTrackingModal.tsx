import { useState } from 'react';
import {
  X,
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Plus,
  Receipt,
  Calendar,
  Banknote,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

interface Payment {
  id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED' | 'PARTIAL';
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BANK_TRANSFER';
  transactionId?: string;
  paidAt?: Date;
  refundedAt?: Date;
  notes?: string;
}

interface PaymentTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  customerName: string;
  totalAmount: number;
  payments: Payment[];
  onRecordPayment: (payment: Omit<Payment, 'id'>) => void;
  onRefundPayment: (paymentId: string, amount: number) => void;
}

const statusConfig = {
  PENDING: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock, label: 'Pending' },
  PAID: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2, label: 'Paid' },
  REFUNDED: { color: 'text-blue-600', bg: 'bg-blue-100', icon: RefreshCw, label: 'Refunded' },
  FAILED: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle, label: 'Failed' },
  PARTIAL: { color: 'text-accent-foreground', bg: 'bg-accent', icon: DollarSign, label: 'Partial' },
};

const methodIcons = {
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: CreditCard,
  CASH: Banknote,
  BANK_TRANSFER: Banknote,
};

export function PaymentTrackingModal({
  isOpen,
  onClose,
  bookingId,
  customerName,
  totalAmount,
  payments,
  onRecordPayment,
  onRefundPayment,
}: PaymentTrackingModalProps) {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showRefund, setShowRefund] = useState<string | null>(null);
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    method: 'CREDIT_CARD' as Payment['method'],
    transactionId: '',
    notes: '',
  });
  const [refundAmount, setRefundAmount] = useState(0);

  if (!isOpen) return null;

  const totalPaid = payments
    .filter((p) => p.status === 'PAID' || p.status === 'PARTIAL')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = payments
    .filter((p) => p.status === 'REFUNDED')
    .reduce((sum, p) => sum + p.amount, 0);

  const balance = totalAmount - totalPaid + totalRefunded;

  const handleRecordPayment = () => {
    if (newPayment.amount <= 0) return;

    onRecordPayment({
      amount: newPayment.amount,
      status: newPayment.amount >= balance ? 'PAID' : 'PARTIAL',
      method: newPayment.method,
      transactionId: newPayment.transactionId || undefined,
      paidAt: new Date(),
      notes: newPayment.notes || undefined,
    });

    setNewPayment({
      amount: 0,
      method: 'CREDIT_CARD',
      transactionId: '',
      notes: '',
    });
    setShowAddPayment(false);
  };

  const handleRefund = (paymentId: string) => {
    if (refundAmount <= 0) return;
    onRefundPayment(paymentId, refundAmount);
    setRefundAmount(0);
    setShowRefund(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Payment Tracking</h2>
                  <p className="text-sm text-white/80">
                    Booking #{bookingId} • {customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-100 bg-white p-4">
                <p className="mb-1 text-xs uppercase text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white p-4">
                <p className="mb-1 text-xs uppercase text-gray-500">Total Paid</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white p-4">
                <p className="mb-1 text-xs uppercase text-gray-500">Balance Due</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    balance > 0 ? 'text-red-600' : 'text-gray-900'
                  )}
                >
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Payment Progress</span>
                <span className="font-medium text-gray-900">
                  {Math.round((totalPaid / totalAmount) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${Math.min((totalPaid / totalAmount) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-300px)] overflow-y-auto p-6">
            {/* Add Payment Button */}
            {!showAddPayment && balance > 0 && (
              <button
                onClick={() => {
                  setNewPayment({ ...newPayment, amount: balance });
                  setShowAddPayment(true);
                }}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-gray-600 transition-colors hover:border-green-500 hover:text-green-600"
              >
                <Plus className="h-5 w-5" />
                Record New Payment
              </button>
            )}

            {/* Add Payment Form */}
            {showAddPayment && (
              <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Plus className="h-4 w-4" />
                  Record Payment
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          value={newPayment.amount}
                          onChange={(e) =>
                            setNewPayment({
                              ...newPayment,
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="0.00"
                          min="0"
                          max={balance}
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Payment Method
                      </label>
                      <select
                        value={newPayment.method}
                        onChange={(e) =>
                          setNewPayment({
                            ...newPayment,
                            method: e.target.value as Payment['method'],
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="DEBIT_CARD">Debit Card</option>
                        <option value="CASH">Cash</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={newPayment.transactionId}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, transactionId: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter transaction reference"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={newPayment.notes}
                      onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Add any notes about this payment..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddPayment(false)}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRecordPayment}
                      disabled={newPayment.amount <= 0}
                      className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment History */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Receipt className="h-4 w-4" />
                Payment History
              </h3>

              {payments.length === 0 ? (
                <div className="py-8 text-center">
                  <DollarSign className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">No payments recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => {
                    const StatusIcon = statusConfig[payment.status].icon;
                    const MethodIcon = methodIcons[payment.method];

                    return (
                      <div
                        key={payment.id}
                        className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn('rounded-lg p-2', statusConfig[payment.status].bg)}>
                              <StatusIcon
                                className={cn('h-4 w-4', statusConfig[payment.status].color)}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </p>
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-xs font-medium',
                                    statusConfig[payment.status].bg,
                                    statusConfig[payment.status].color
                                  )}
                                >
                                  {statusConfig[payment.status].label}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                <MethodIcon className="h-3 w-3" />
                                <span>{payment.method.replace('_', ' ')}</span>
                                {payment.transactionId && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-xs">
                                      {payment.transactionId}
                                    </span>
                                  </>
                                )}
                              </div>
                              {payment.paidAt && (
                                <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(payment.paidAt)}
                                </div>
                              )}
                              {payment.notes && (
                                <p className="mt-2 text-sm text-gray-600">{payment.notes}</p>
                              )}
                            </div>
                          </div>

                          {/* Refund Button */}
                          {payment.status === 'PAID' && (
                            <button
                              onClick={() => {
                                setRefundAmount(payment.amount);
                                setShowRefund(payment.id);
                              }}
                              className="text-secondary hover:text-navy text-sm font-medium"
                            >
                              Refund
                            </button>
                          )}
                        </div>

                        {/* Refund Form */}
                        {showRefund === payment.id && (
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-1">
                                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="number"
                                  value={refundAmount}
                                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                                  className="focus:ring-secondary w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
                                  placeholder="Refund amount"
                                  min="0"
                                  max={payment.amount}
                                  step="0.01"
                                />
                              </div>
                              <button
                                onClick={() => setShowRefund(null)}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-gray-600 transition-colors hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleRefund(payment.id)}
                                disabled={refundAmount <= 0 || refundAmount > payment.amount}
                                className="bg-secondary text-secondary-foreground hover:bg-navy rounded-xl px-3 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Process Refund
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <div className="text-sm text-gray-500">
              {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
            </div>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
