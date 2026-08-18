'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  CreditCard,
  Smartphone,
  Building,
  Loader2,
  AlertCircle,
  Receipt,
  CalendarDays,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface PaymentHistoryProps {
  userId: string;
  role: 'FAMILY' | 'CAREGIVER';
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  REFUNDED: {
    label: 'Refunded',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
};

function getMethodIcon(method: string | null | undefined) {
  switch (method) {
    case 'upi':
      return <Smartphone className="h-4 w-4" />;
    case 'card':
      return <CreditCard className="h-4 w-4" />;
    case 'netbanking':
      return <Building className="h-4 w-4" />;
    default:
      return <IndianRupee className="h-4 w-4" />;
  }
}

function getMethodLabel(method: string | null | undefined) {
  switch (method) {
    case 'upi':
      return 'UPI';
    case 'card':
      return 'Card';
    case 'netbanking':
      return 'Net Banking';
    default:
      return 'N/A';
  }
}

function formatINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export function PaymentHistory({ userId, role }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/payments?userId=${userId}&role=${role}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load payments');
      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-3 text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800 mb-1">
          Failed to load payments
        </h3>
        <p className="text-xs text-gray-400 mb-3">{error}</p>
        <button
          onClick={fetchPayments}
          className="text-xs font-medium text-forest-700 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-16 h-16 rounded-2xl bg-forest-50 flex items-center justify-center mb-4 text-forest-300">
          <Receipt className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">
          No payments yet
        </h3>
        <p className="text-sm text-gray-400">
          {role === 'FAMILY'
            ? 'Your payment history will appear here after you pay for a booking.'
            : 'Your earnings will appear here once families pay for your services.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment, index) => {
        const status = statusConfig[payment.status] || statusConfig.PENDING;
        const isExpanded = expandedId === payment.id;
        const counterpartyName =
          role === 'FAMILY'
            ? payment.caregiver?.user?.name || 'Caregiver'
            : payment.family?.name || 'Family';
        const patientName = payment.booking?.patient?.name || 'Patient';

        return (
          <motion.div
            key={payment.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Card className="rounded-2xl border-gray-100 hover:shadow-sm transition-shadow overflow-hidden">
              <button
                onClick={() => toggleExpand(payment.id)}
                className="w-full text-left cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          role === 'FAMILY'
                            ? 'bg-forest-50 text-forest-600'
                            : 'bg-lime-50 text-lime-600'
                        }`}
                      >
                        {role === 'FAMILY' ? (
                          <IndianRupee className="h-5 w-5" />
                        ) : (
                          <Receipt className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {role === 'FAMILY'
                            ? `Payment to ${counterpartyName}`
                            : `Payment from ${counterpartyName}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {patientName} &middot;{' '}
                          {new Date(payment.createdAt).toLocaleDateString(
                            'en-IN',
                            { day: 'numeric', month: 'short', year: 'numeric' }
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] rounded-full ${status.className}`}
                          >
                            {status.label}
                          </Badge>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            {getMethodIcon(payment.paymentMethod)}
                            <span>{getMethodLabel(payment.paymentMethod)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p
                        className={`text-base font-bold ${
                          role === 'FAMILY'
                            ? 'text-gray-900'
                            : 'text-forest-700'
                        }`}
                      >
                        {role === 'FAMILY'
                          ? formatINR(payment.amount)
                          : formatINR(payment.caregiverPayout)}
                      </p>
                      {role === 'CAREGIVER' && (
                        <span className="text-[10px] text-gray-400">
                          of {formatINR(payment.amount)}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Separator className="bg-gray-100" />
                  <div className="px-4 py-3 bg-gray-50/50">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                          {role === 'FAMILY' ? 'Amount Paid' : 'Your Earnings'}
                        </p>
                        <p className="font-semibold text-gray-800 mt-0.5">
                          {formatINR(payment.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                          Platform Fee (15%)
                        </p>
                        <p className="font-semibold text-orange-600 mt-0.5">
                          {formatINR(payment.platformFee)}
                        </p>
                      </div>
                      {role === 'CAREGIVER' && (
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                            Your Payout
                          </p>
                          <p className="font-semibold text-forest-700 mt-0.5">
                            {formatINR(payment.caregiverPayout)}
                          </p>
                        </div>
                      )}
                      {role === 'FAMILY' && (
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                            Caregiver Receives
                          </p>
                          <p className="font-semibold text-forest-700 mt-0.5">
                            {formatINR(payment.caregiverPayout)}
                          </p>
                        </div>
                      )}
                      {payment.transactionId && (
                        <div className="col-span-2">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                            Transaction ID
                          </p>
                          <p className="font-mono text-xs text-gray-600 mt-0.5">
                            {payment.transactionId}
                          </p>
                        </div>
                      )}
                      {payment.paidAt && (
                        <div className="col-span-2">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                            Paid On
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(payment.paidAt).toLocaleDateString(
                              'en-IN',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">
                        Booking Reference
                      </p>
                      <p className="font-mono text-xs text-gray-500">
                        {payment.bookingId.slice(0, 12)}...
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
