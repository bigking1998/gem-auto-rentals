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
  ArrowRight,
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
  PARTIAL: { color: 'text-orange-600', bg: 'bg-orange-100', icon: DollarSign, label: 'Partial' },
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

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
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
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-1">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-1">Total Paid</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-1">Balance Due</p>
                <p className={cn(
                  'text-xl font-bold',
                  balance > 0 ? 'text-red-600' : 'text-gray-900'
                )}>
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">Payment Progress</span>
                <span className="font-medium text-gray-900">
                  {Math.round((totalPaid / totalAmount) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min((totalPaid / totalAmount) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-300px)] p-6">
            {/* Add Payment Button */}
            {!showAddPayment && balance > 0 && (
              <button
                onClick={() => {
                  setNewPayment({ ...newPayment, amount: balance });
                  setShowAddPayment(true);
                }}
                className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Record New Payment
              </button>
            )}

            {/* Add Payment Form */}
            {showAddPayment && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Record Payment
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="0.00"
                          min="0"
                          max={balance}
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={newPayment.method}
                        onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value as Payment['method'] })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="DEBIT_CARD">Debit Card</option>
                        <option value="CASH">Cash</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={newPayment.transactionId}
                      onChange={(e) => setNewPayment({ ...newPayment, transactionId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter transaction reference"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={newPayment.notes}
                      onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      placeholder="Add any notes about this payment..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddPayment(false)}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRecordPayment}
                      disabled={newPayment.amount <= 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment History */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Payment History
              </h3>

              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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
                        className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'p-2 rounded-lg',
                              statusConfig[payment.status].bg
                            )}>
                              <StatusIcon className={cn(
                                'w-4 h-4',
                                statusConfig[payment.status].color
                              )} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </p>
                                <span className={cn(
                                  'px-2 py-0.5 rounded-full text-xs font-medium',
                                  statusConfig[payment.status].bg,
                                  statusConfig[payment.status].color
                                )}>
                                  {statusConfig[payment.status].label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <MethodIcon className="w-3 h-3" />
                                <span>{payment.method.replace('_', ' ')}</span>
                                {payment.transactionId && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-xs">{payment.transactionId}</span>
                                  </>
                                )}
                              </div>
                              {payment.paidAt && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                  <Calendar className="w-3 h-3" />
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
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Refund
                            </button>
                          )}
                        </div>

                        {/* Refund Form */}
                        {showRefund === payment.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="number"
                                  value={refundAmount}
                                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Refund amount"
                                  min="0"
                                  max={payment.amount}
                                  step="0.01"
                                />
                              </div>
                              <button
                                onClick={() => setShowRefund(null)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleRefund(payment.id)}
                                disabled={refundAmount <= 0 || refundAmount > payment.amount}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
